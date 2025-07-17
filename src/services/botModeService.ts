import axios from '../utils/axiosInstance';

export type BotMode = 'manual' | 'bot';
export type ModeState = {
    mode: BotMode;
    isReady: boolean;
    isChanging: boolean;
    error: string | null;
};

export interface BotModeServiceConfig {
    apiBaseUrl: string;
    onModeChange?: (state: ModeState) => void;
    onError?: (error: string) => void;
    debug?: boolean;
}

export class BotModeService {
    private currentRequest: AbortController | null = null;
    private cleanupFunctions: (() => void)[] = [];
    private config: BotModeServiceConfig;
    private modeCache = new Map<string, { mode: BotMode; timestamp: number }>();
    private forceModeCache = new Map<string, { force: boolean; timestamp: number }>();
    private readonly CACHE_TTL = 30000; // Increased to 30 seconds to reduce API calls
    private pendingRequests = new Map<string, Promise<BotMode | boolean>>(); // Debounce pending requests
    private requestTimeouts = new Map<string, NodeJS.Timeout>(); // Track request timeouts
    private readonly REQUEST_TIMEOUT = 10000; // 10 second timeout for all requests
    
    // Circuit breaker pattern
    private failureCount = new Map<string, number>();
    private lastFailureTime = new Map<string, number>();
    private readonly MAX_FAILURES = 3;
    private readonly FAILURE_TIMEOUT = 60000; // 1 minute circuit breaker timeout

    constructor(config: BotModeServiceConfig) {
        this.config = config;
        this.setupBeforeUnloadHandler();
    }

    private log(message: string, data?: unknown) {
        if (this.config.debug) {
            console.log(`[BotModeService] ${message}`, data || '');
        }
    }

    private logError(message: string, error?: unknown) {
        console.error(`[BotModeService] ${message}`, error || '');
        this.config.onError?.(message);
    }

    private getCachedMode(from: string): BotMode | null {
        const cached = this.modeCache.get(from);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            this.log(`Cache hit for ${from}:`, cached.mode);
            return cached.mode;
        }
        return null;
    }

    private setCachedMode(from: string, mode: BotMode) {
        this.modeCache.set(from, { mode, timestamp: Date.now() });
        this.log(`Cache set for ${from}:`, mode);
    }

    private getCachedForceMode(from: string): boolean | null {
        const cached = this.forceModeCache.get(from);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            this.log(`Force mode cache hit for ${from}:`, cached.force);
            return cached.force;
        }
        return null;
    }

    private setCachedForceMode(from: string, force: boolean) {
        this.forceModeCache.set(from, { force, timestamp: Date.now() });
        this.log(`Force mode cache set for ${from}:`, force);
    }

    /**
     * Get current mode for a user
     */
    async getCurrentMode(from: string): Promise<BotMode> {
        if (!from) throw new Error('User ID (from) is required');

        // Check cache first - more aggressive caching
        const cachedMode = this.getCachedMode(from);
        if (cachedMode) return cachedMode;

        // Debounce requests
        const requestKey = `mode-${from}`;
        if (this.pendingRequests.has(requestKey)) {
            this.log(`Reusing pending mode request for ${from}`);
            const existingRequest = this.pendingRequests.get(requestKey);
            return existingRequest as Promise<BotMode>;
        }

        // Create request with timeout
        const requestPromise = this.executeGetCurrentMode(from);
        this.pendingRequests.set(requestKey, requestPromise);

        try {
            const mode = await requestPromise;
            return mode;
        } finally {
            this.pendingRequests.delete(requestKey);
        }
    }

    private async executeGetCurrentMode(from: string): Promise<BotMode> {
        const endpoint = `mode-${from}`;
        
        // Check circuit breaker
        if (this.isCircuitBreakerOpen(endpoint)) {
            const cached = this.modeCache.get(from);
            return cached?.mode || 'bot';
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            this.log(`Get mode request timeout for ${from}`);
            controller.abort();
        }, this.REQUEST_TIMEOUT);

        try {
            this.log(`Fetching current mode for ${from}`);
            const response = await axios.get(`${this.config.apiBaseUrl}/mode/${from}`, {
                signal: controller.signal,
                timeout: this.REQUEST_TIMEOUT
            });
            
            clearTimeout(timeoutId);
            const mode: BotMode = (response?.data as { mode?: BotMode })?.mode || 'bot';

            this.setCachedMode(from, mode);
            this.recordSuccess(endpoint); // Record success
            this.log(`Current mode for ${from}:`, mode);
            return mode;
        } catch (error: unknown) {
            clearTimeout(timeoutId);
            this.recordFailure(endpoint); // Record failure
            
            if (error instanceof Error && error.name === 'AbortError') {
                this.log(`Get mode request aborted for ${from}`);
            } else {
                this.logError(`Failed to get current mode for ${from}`, error);
            }
            
            // Return cached mode or default
            const cached = this.modeCache.get(from);
            return cached?.mode || 'bot';
        }
    }

    /**
     * Change mode for a user (with force mode protection)
     */
    async changeMode(from: string, targetMode: BotMode): Promise<BotMode> {
        if (!from) throw new Error('User ID (from) is required');

        // More aggressive caching - don't change if already set
        const currentMode = this.getCachedMode(from);
        if (currentMode === targetMode) {
            this.log(`Mode already set to ${targetMode} for ${from} (cached)`);
            return currentMode;
        }

        // Debounce mode change requests
        const requestKey = `change-${from}-${targetMode}`;
        if (this.pendingRequests.has(requestKey)) {
            this.log(`Reusing pending change mode request for ${from} to ${targetMode}`);
            const existingRequest = this.pendingRequests.get(requestKey);
            return existingRequest as Promise<BotMode>;
        }

        const requestPromise = this.executeChangeMode(from, targetMode);
        this.pendingRequests.set(requestKey, requestPromise);

        try {
            const mode = await requestPromise;
            return mode;
        } finally {
            this.pendingRequests.delete(requestKey);
        }
    }

    private async executeChangeMode(from: string, targetMode: BotMode): Promise<BotMode> {
        // Skip force mode check to avoid recursive calls
        // Let the UI handle force mode logic

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            this.log(`Change mode request timeout for ${from}`);
            controller.abort();
        }, this.REQUEST_TIMEOUT);

        try {
            this.log(`Changing mode for ${from} to ${targetMode}`);

            // Check for conflicts before making the change
            const currentStatus = await axios.get(`${this.config.apiBaseUrl}/mode/${from}?debug=true`);
            const conflicts = currentStatus.data?.conflicts || [];
            
            if (conflicts.length > 0) {
                this.log(`Mode conflicts detected for ${from}:`, conflicts);
                // Auto-fix conflicts
                await axios.post(`${this.config.apiBaseUrl}/mode/debug/fix/${from}`, currentStatus.data);
            }

            // Make the mode change request using new API
            const response = await axios.put(
                `${this.config.apiBaseUrl}/mode/${from}`,
                { mode: targetMode },
                { 
                    signal: controller.signal,
                    timeout: this.REQUEST_TIMEOUT
                }
            );

            clearTimeout(timeoutId);

            // Check if the change was successful
            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Mode change failed');
            }

            // Update cache
            this.setCachedMode(from, targetMode);
            this.log(`Successfully changed mode for ${from} to ${targetMode}`);

            return targetMode;
        } catch (error: unknown) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                this.log('Mode change request was cancelled');
                // Return current cached mode
                const cached = this.getCachedMode(from);
                return cached || 'bot';
            }

            this.logError(`Failed to change mode for ${from} to ${targetMode}`, error);
            
            // Check if it's a force mode conflict
            if (error instanceof Error && error.message.includes('Force mode aktif')) {
                this.log(`Force mode is active for ${from}, cannot change mode`);
                // Return current mode from cache or fetch fresh
                const cached = this.getCachedMode(from);
                return cached || 'manual'; // Force mode usually means manual
            }
            
            // For other errors, throw to let caller handle
            throw new Error(`Failed to change mode: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Ensure mode is set correctly with retry logic
     */
    async ensureMode(from: string, targetMode: BotMode, maxRetries = 1): Promise<BotMode> {
        // Reduced retry attempts to prevent loops

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    this.log(`Retry attempt ${attempt} for ${from} -> ${targetMode}`);
                    // Clear cache on retry
                    this.modeCache.delete(from);
                    // Add longer delay between retries
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

                return await this.changeMode(from, targetMode);
            } catch (error) {
                const currentError = error as Error;

                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 2000; // Increased delay
                    this.log(`Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    // Use the error for final attempt
                    console.error('Max retries reached:', currentError.message);
                    // On final failure, return cached mode
                    const cached = this.getCachedMode(from);
                    if (cached) {
                        this.log(`Returning cached mode ${cached} after ensure failure`);
                        return cached;
                    }
                }
            }
        }

        // Return default mode instead of throwing
        this.log(`Max retries exceeded for ${from}, returning default mode`);
        return 'bot';
    }

    /**
     * Set force mode (saklar utama) - override semua mode switching
     */
    async setForceMode(from: string, force: boolean): Promise<void> {
        if (!from) throw new Error('User ID (from) is required');

        try {
            this.log(`Setting force mode for ${from} to ${force}`);

            await axios.post(
                `${this.config.apiBaseUrl}/mode/force/${from}`,
                { force }
            );

            // Clear cache setelah force mode berubah
            this.clearCache(from);
            this.log(`Successfully set force mode for ${from} to ${force}`);
        } catch (error: unknown) {
            this.logError(`Failed to set force mode for ${from}`, error);
            throw new Error(`Failed to set force mode: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    /**
     * Set manual mode dengan timeout (auto-expire) - DEFAULT 30 MINUTES
     */
    async setManualMode(from: string, minutes: number = 30): Promise<void> {
        if (!from) throw new Error('User ID (from) is required');

        // Check if force mode is active first
        try {
            const isForceActive = await this.getForceMode(from);
            if (isForceActive) {
                this.log(`Force mode active for ${from}, cannot set manual mode`);
                throw new Error('Cannot set manual mode when force mode is active');
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            if (errorMessage.includes('force mode is active')) {
                throw error; // Re-throw force mode error
            }
            this.log(`Could not check force mode for ${from}, proceeding with manual mode`);
        }

        try {
            this.log(`Setting manual mode for ${from} with timeout ${minutes} minutes`);

            await axios.post(
                `${this.config.apiBaseUrl}/mode/manual/${from}`,
                { minutes }
            );

            // Update cache ke manual mode
            this.setCachedMode(from, 'manual');
            this.log(`Successfully set manual mode for ${from} with ${minutes} minutes timeout`);
        } catch (error: unknown) {
            this.logError(`Failed to set manual mode for ${from}`, error);
            throw new Error(`Failed to set manual mode: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    /**
     * Get force mode status with request debouncing
     */
    async getForceMode(from: string): Promise<boolean> {
        if (!from) throw new Error('User ID (from) is required');

        // Check cache first
        const cachedForceMode = this.getCachedForceMode(from);
        if (cachedForceMode !== null) return cachedForceMode;

        // Check if there's already a pending request for this user
        const requestKey = `force-${from}`;
        if (this.pendingRequests.has(requestKey)) {
            this.log(`Reusing pending force mode request for ${from}`);
            const existingRequest = this.pendingRequests.get(requestKey);
            return existingRequest as Promise<boolean>;
        }

        // Create new request
        const requestPromise = this.executeForceMode(from);
        this.pendingRequests.set(requestKey, requestPromise);

        try {
            const result = await requestPromise;
            return result;
        } finally {
            this.pendingRequests.delete(requestKey);
        }
    }

    private async executeForceMode(from: string): Promise<boolean> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            this.log(`Force mode request timeout for ${from}`);
            controller.abort();
        }, this.REQUEST_TIMEOUT);

        try {
            this.log(`Getting force mode status for ${from}`);
            const response = await axios.get(`${this.config.apiBaseUrl}/mode/${from}`, {
                signal: controller.signal,
                timeout: this.REQUEST_TIMEOUT
            });
            
            clearTimeout(timeoutId);
            const responseData = response?.data as { forceModeManual?: boolean; forceMode?: boolean; force?: boolean } || {};
            const forceMode = responseData.forceModeManual || responseData.forceMode || responseData.force || false;

            // Cache the result
            this.setCachedForceMode(from, forceMode);

            this.log(`Force mode for ${from}:`, forceMode);
            return forceMode;
        } catch (error: unknown) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                this.log(`Force mode request aborted for ${from}`);
                // Return cached value or default
                const cached = this.forceModeCache.get(from);
                return cached?.force || false;
            }
            this.logError(`Failed to get force mode for ${from}`, error);
            // Return cached value or default instead of throwing
            const cached = this.forceModeCache.get(from);
            return cached?.force || false;
        }
    }

    /**
     * Check if manual mode is active
     */
    async isManualModeActive(from: string): Promise<boolean> {
        if (!from) throw new Error('User ID (from) is required');

        try {
            this.log(`Checking manual mode status for ${from}`);
            const response = await axios.get(`${this.config.apiBaseUrl}/mode/${from}`);
            const mode = (response?.data as { mode?: string })?.mode || 'bot';
            const isActive = mode === 'manual';

            this.log(`Manual mode active for ${from}:`, isActive);
            return isActive;
        } catch (error: unknown) {
            this.logError(`Failed to check manual mode for ${from}`, error);
            // Return false as default if API call fails
            return false;
        }
    }

    /**
     * Force mode to bot when leaving (SIMPLE - NO API CALLS TO PREVENT LOOPS)
     */
    forceModeToBotOnExit(from: string) {
        if (!from || typeof navigator === 'undefined') return;

        try {
            // ULTRA SIMPLE: Just beacon, no checks, no promises, no async
            const formData = new FormData();
            formData.append('_method', 'PUT');
            formData.append('mode', 'bot');

            navigator.sendBeacon(`${this.config.apiBaseUrl}/mode/${from}`, formData);
            this.setCachedMode(from, 'bot');
            this.log(`Beacon sent to set bot mode for ${from}`);
        } catch (error) {
            this.logError(`Failed to send beacon for ${from}:`, error);
        }
    }

    /**
     * Setup beforeunload handler (MINIMAL - NO LOOPS)
     */
    private setupBeforeUnloadHandler() {
        if (typeof window === 'undefined') return;

        const handleBeforeUnload = () => {
            // SIMPLEST APPROACH: Only send beacon for cleanup, no checks
            this.modeCache.forEach((cached, from) => {
                if (cached.mode === 'manual') {
                    try {
                        // Simple beacon approach - no fetch, no promises, no async
                        if (typeof navigator !== 'undefined') {
                            const formData = new FormData();
                            formData.append('_method', 'PUT');
                            formData.append('mode', 'bot');
                            navigator.sendBeacon(`${this.config.apiBaseUrl}/mode/${from}`, formData);
                        }
                    } catch {
                        // Silent fail - nothing we can do in beforeunload
                    }
                }
            });
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        this.cleanupFunctions.push(() => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        });
    }

    /**
     * Clear cache for specific user
     */
    clearCache(from?: string) {
        if (from) {
            this.modeCache.delete(from);
            this.forceModeCache.delete(from);
            this.log(`Cleared cache for ${from}`);
        } else {
            this.modeCache.clear();
            this.forceModeCache.clear();
            this.log('Cleared all cache');
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.modeCache.size,
            entries: Array.from(this.modeCache.entries()).map(([from, { mode, timestamp }]) => ({
                from,
                mode,
                age: Date.now() - timestamp,
                isExpired: Date.now() - timestamp > this.CACHE_TTL
            }))
        };
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Cancel any ongoing requests
        if (this.currentRequest) {
            this.currentRequest.abort();
            this.currentRequest = null;
        }

        // Clear all caches
        this.modeCache.clear();
        this.forceModeCache.clear();

        // Run cleanup functions
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.cleanupFunctions = [];

        this.log('BotModeService destroyed');
    }

    // Circuit breaker methods
    private isCircuitBreakerOpen(endpoint: string): boolean {
        const failures = this.failureCount.get(endpoint) || 0;
        const lastFailure = this.lastFailureTime.get(endpoint) || 0;
        
        if (failures >= this.MAX_FAILURES) {
            const timeSinceLastFailure = Date.now() - lastFailure;
            if (timeSinceLastFailure < this.FAILURE_TIMEOUT) {
                this.log(`Circuit breaker open for ${endpoint}. Time remaining: ${Math.ceil((this.FAILURE_TIMEOUT - timeSinceLastFailure) / 1000)}s`);
                return true;
            } else {
                // Reset circuit breaker
                this.failureCount.set(endpoint, 0);
                this.lastFailureTime.delete(endpoint);
            }
        }
        
        return false;
    }
    
    private recordFailure(endpoint: string) {
        const failures = (this.failureCount.get(endpoint) || 0) + 1;
        this.failureCount.set(endpoint, failures);
        this.lastFailureTime.set(endpoint, Date.now());
        this.log(`Recorded failure ${failures}/${this.MAX_FAILURES} for ${endpoint}`);
    }
    
    private recordSuccess(endpoint: string) {
        this.failureCount.delete(endpoint);
        this.lastFailureTime.delete(endpoint);
    }
}

// Singleton instance
let botModeServiceInstance: BotModeService | null = null;

export function createBotModeService(config: BotModeServiceConfig): BotModeService {
    if (botModeServiceInstance) {
        botModeServiceInstance.destroy();
    }

    botModeServiceInstance = new BotModeService(config);
    return botModeServiceInstance;
}

export function getBotModeService(): BotModeService | null {
    return botModeServiceInstance;
}

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
    private readonly CACHE_TTL = 10000; // Increased to 10 seconds to reduce API calls
    private pendingRequests = new Map<string, Promise<any>>(); // Debounce pending requests

    constructor(config: BotModeServiceConfig) {
        this.config = config;
        this.setupBeforeUnloadHandler();
    }

    private log(message: string, data?: any) {
        if (this.config.debug) {
            console.log(`[BotModeService] ${message}`, data || '');
        }
    }

    private logError(message: string, error?: any) {
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

        // Check cache first
        const cachedMode = this.getCachedMode(from);
        if (cachedMode) return cachedMode;

        try {
            this.log(`Fetching current mode for ${from}`);
            const response = await axios.get(`${this.config.apiBaseUrl}/mode/${from}`);
            const mode: BotMode = response.data?.mode || 'bot';

            this.setCachedMode(from, mode);
            this.log(`Current mode for ${from}:`, mode);
            return mode;
        } catch (error: any) {
            this.logError(`Failed to get current mode for ${from}`, error);
            throw new Error(`Failed to get current mode: ${error.message}`);
        }
    }

    /**
     * Change mode for a user (with force mode protection)
     */
    async changeMode(from: string, targetMode: BotMode): Promise<BotMode> {
        if (!from) throw new Error('User ID (from) is required');

        // Check if force mode is active first
        try {
            const isForceActive = await this.getForceMode(from);
            if (isForceActive) {
                this.log(`Force mode active for ${from}, cannot change mode to ${targetMode}`);
                // Return current mode without changing
                return await this.getCurrentMode(from);
            }
        } catch (error) {
            this.log(`Could not check force mode for ${from}, proceeding with mode change`);
        }

        // Cancel previous request if still running
        if (this.currentRequest) {
            this.currentRequest.abort();
            this.log('Cancelled previous mode change request');
        }

        this.currentRequest = new AbortController();

        try {
            this.log(`Changing mode for ${from} to ${targetMode}`);

            // Check current mode first
            const currentMode = await this.getCurrentMode(from);
            if (currentMode === targetMode) {
                this.log(`Mode already set to ${targetMode} for ${from}`);
                return currentMode;
            }

            // Make the mode change request using new API
            await axios.put(
                `${this.config.apiBaseUrl}/mode/${from}`,
                { mode: targetMode },
                { signal: this.currentRequest.signal }
            );

            // Update cache
            this.setCachedMode(from, targetMode);
            this.log(`Successfully changed mode for ${from} to ${targetMode}`);

            return targetMode;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                this.log('Mode change request was cancelled');
                throw new Error('Request cancelled');
            }

            this.logError(`Failed to change mode for ${from} to ${targetMode}`, error);
            throw new Error(`Failed to change mode: ${error.message}`);
        } finally {
            this.currentRequest = null;
        }
    }

    /**
     * Ensure mode is set correctly with retry logic
     */
    async ensureMode(from: string, targetMode: BotMode, maxRetries = 2): Promise<BotMode> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    this.log(`Retry attempt ${attempt} for ${from} -> ${targetMode}`);
                    // Clear cache on retry
                    this.modeCache.delete(from);
                }

                return await this.changeMode(from, targetMode);
            } catch (error) {
                lastError = error as Error;

                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    this.log(`Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError || new Error('Max retries exceeded');
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
        } catch (error: any) {
            this.logError(`Failed to set force mode for ${from}`, error);
            throw new Error(`Failed to set force mode: ${error.message}`);
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
        } catch (error: any) {
            if (error.message.includes('force mode is active')) {
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
        } catch (error: any) {
            this.logError(`Failed to set manual mode for ${from}`, error);
            throw new Error(`Failed to set manual mode: ${error.message}`);
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
            return this.pendingRequests.get(requestKey);
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
        try {
            this.log(`Getting force mode status for ${from}`);
            const response = await axios.get(`${this.config.apiBaseUrl}/mode/${from}`);
            // Update field sesuai API response terbaru
            const forceMode = response.data?.forceModeManual || response.data?.forceMode || response.data?.force || false;

            // Cache the result
            this.setCachedForceMode(from, forceMode);

            this.log(`Force mode for ${from}:`, forceMode);
            return forceMode;
        } catch (error: any) {
            this.logError(`Failed to get force mode for ${from}`, error);
            // Return false as default if API call fails
            return false;
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
            const mode = response.data?.mode || 'bot';
            const isActive = mode === 'manual';

            this.log(`Manual mode active for ${from}:`, isActive);
            return isActive;
        } catch (error: any) {
            this.logError(`Failed to check manual mode for ${from}`, error);
            // Return false as default if API call fails
            return false;
        }
    }

    /**
     * Force mode to bot when leaving (SIMPLE - NO API CALLS TO PREVENT LOOPS)
     */
    forceModeToBotOnExit(from: string) {
        if (!from) return;

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
        const handleBeforeUnload = () => {
            // SIMPLEST APPROACH: Only send beacon for cleanup, no checks
            this.modeCache.forEach((cached, from) => {
                if (cached.mode === 'manual') {
                    try {
                        // Simple beacon approach - no fetch, no promises, no async
                        const formData = new FormData();
                        formData.append('_method', 'PUT');
                        formData.append('mode', 'bot');
                        navigator.sendBeacon(`${this.config.apiBaseUrl}/mode/${from}`, formData);
                    } catch (error) {
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

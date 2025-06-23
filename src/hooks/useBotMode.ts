import { useEffect, useState, useCallback, useRef } from 'react';
import { BotModeService, BotMode, ModeState, createBotModeService } from '../services/botModeService';

export interface UseBotModeOptions {
  userId: string;
  initialMode?: BotMode;
  autoManageOnTab?: boolean;
  debug?: boolean;
}

export interface UseBotModeReturn {
  mode: BotMode;
  isReady: boolean;
  isChanging: boolean;
  error: string | null;
  changeMode: (targetMode: BotMode) => Promise<void>;
  ensureMode: (targetMode: BotMode) => Promise<void>;
  setForceMode: (force: boolean) => Promise<void>;
  setManualMode: (minutes?: number) => Promise<void>;
  getForceMode: () => Promise<boolean>;
  isManualModeActive: () => Promise<boolean>;
  clearError: () => void;
  refreshMode: () => Promise<void>;
  cacheStats: any;
}

export function useBotMode({
  userId,
  initialMode = 'bot',
  autoManageOnTab = true,
  debug = false
}: UseBotModeOptions): UseBotModeReturn {
  const [modeState, setModeState] = useState<ModeState>({
    mode: initialMode,
    isReady: false,
    isChanging: false,
    error: null,
  });

  const serviceRef = useRef<BotModeService | null>(null);
  const isInitializedRef = useRef(false);

  // Handle mode state changes
  const handleModeChange = useCallback((state: ModeState) => {
    setModeState(state);
  }, []);

  // Handle errors
  const handleError = useCallback((error: string) => {
    setModeState(prev => ({
      ...prev,
      error,
      isChanging: false,
      isReady: false,
    }));
  }, []);

  // Initialize service
  useEffect(() => {
    if (!userId || isInitializedRef.current) return;

    const apiBaseUrl = process.env.NEXT_PUBLIC_BE_BASE_URL;
    if (!apiBaseUrl) {
      handleError('API base URL not configured');
      return;
    }

    serviceRef.current = createBotModeService({
      apiBaseUrl,
      onModeChange: handleModeChange,
      onError: handleError,
      debug,
    });

    isInitializedRef.current = true;

    // Get initial mode
    const initializeMode = async () => {
      try {
        setModeState(prev => ({ ...prev, isChanging: true, error: null }));
        
        const currentMode = await serviceRef.current!.getCurrentMode(userId);
        setModeState({
          mode: currentMode,
          isReady: true,
          isChanging: false,
          error: null,
        });
      } catch (error: any) {
        handleError(`Failed to initialize mode: ${error.message}`);
      }
    };

    initializeMode();

    // Cleanup on unmount - SIMPLIFIED TO PREVENT LOOPS
    return () => {
      if (serviceRef.current) {
        // SIMPLE: Just destroy service, no auto bot mode switching
        serviceRef.current.destroy();
        serviceRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [userId, debug, handleModeChange, handleError]);

  // Change mode function
  const changeMode = useCallback(async (targetMode: BotMode) => {
    if (!serviceRef.current || !userId) {
      handleError('Service not initialized or user ID missing');
      return;
    }

    try {
      setModeState(prev => ({ ...prev, isChanging: true, error: null }));
      
      const newMode = await serviceRef.current.changeMode(userId, targetMode);
      
      setModeState({
        mode: newMode,
        isReady: true,
        isChanging: false,
        error: null,
      });
    } catch (error: any) {
      handleError(`Failed to change mode: ${error.message}`);
    }
  }, [userId, handleError]);

  // Ensure mode function with retry logic
  const ensureMode = useCallback(async (targetMode: BotMode) => {
    if (!serviceRef.current || !userId) {
      handleError('Service not initialized or user ID missing');
      return;
    }

    try {
      setModeState(prev => ({ ...prev, isChanging: true, error: null }));
      
      const newMode = await serviceRef.current.ensureMode(userId, targetMode);
      
      setModeState({
        mode: newMode,
        isReady: true,
        isChanging: false,
        error: null,
      });
    } catch (error: any) {
      handleError(`Failed to ensure mode: ${error.message}`);
    }
  }, [userId, handleError]);

  // Refresh current mode
  const refreshMode = useCallback(async () => {
    if (!serviceRef.current || !userId) {
      handleError('Service not initialized or user ID missing');
      return;
    }

    try {
      setModeState(prev => ({ ...prev, isChanging: true, error: null }));
      
      // Clear cache and get fresh mode
      serviceRef.current.clearCache(userId);
      const currentMode = await serviceRef.current.getCurrentMode(userId);
      
      setModeState({
        mode: currentMode,
        isReady: true,
        isChanging: false,
        error: null,
      });
    } catch (error: any) {
      handleError(`Failed to refresh mode: ${error.message}`);
    }
  }, [userId, handleError]);

  // Set force mode function
  const setForceMode = useCallback(async (force: boolean) => {
    if (!serviceRef.current || !userId) {
      handleError('Service not initialized or user ID missing');
      return;
    }

    try {
      setModeState(prev => ({ ...prev, isChanging: true, error: null }));
      
      await serviceRef.current.setForceMode(userId, force);
      
      // Refresh mode after setting force mode
      await refreshMode();
    } catch (error: any) {
      handleError(`Failed to set force mode: ${error.message}`);
    }
  }, [userId, handleError, refreshMode]);

  // Set manual mode with timeout function (DEFAULT 30 MINUTES)
  const setManualMode = useCallback(async (minutes: number = 30) => {
    if (!serviceRef.current || !userId) {
      handleError('Service not initialized or user ID missing');
      return;
    }

    try {
      setModeState(prev => ({ ...prev, isChanging: true, error: null }));
      
      await serviceRef.current.setManualMode(userId, minutes);
      
      setModeState(prev => ({
        ...prev,
        mode: 'manual',
        isReady: true,
        isChanging: false,
        error: null,
      }));
    } catch (error: any) {
      handleError(`Failed to set manual mode: ${error.message}`);
    }
  }, [userId, handleError]);

  // Get force mode status function
  const getForceMode = useCallback(async (): Promise<boolean> => {
    if (!serviceRef.current || !userId) {
      handleError('Service not initialized or user ID missing');
      return false;
    }

    try {
      return await serviceRef.current.getForceMode(userId);
    } catch (error: any) {
      handleError(`Failed to get force mode: ${error.message}`);
      return false;
    }
  }, [userId, handleError]);

  // Check manual mode active function
  const isManualModeActive = useCallback(async (): Promise<boolean> => {
    if (!serviceRef.current || !userId) {
      handleError('Service not initialized or user ID missing');
      return false;
    }

    try {
      return await serviceRef.current.isManualModeActive(userId);
    } catch (error: any) {
      handleError(`Failed to check manual mode: ${error.message}`);
      return false;
    }
  }, [userId, handleError]);

  // Clear error function
  const clearError = useCallback(() => {
    setModeState(prev => ({ ...prev, error: null }));
  }, []);

  // Get cache stats
  const cacheStats = serviceRef.current?.getCacheStats() || null;

  return {
    mode: modeState.mode,
    isReady: modeState.isReady,
    isChanging: modeState.isChanging,
    error: modeState.error,
    changeMode,
    ensureMode,
    setForceMode,
    setManualMode,
    getForceMode,
    isManualModeActive,
    clearError,
    refreshMode,
    cacheStats,
  };
}

// Hook for tab-based mode management with force mode support
export function useBotModeWithTab({
  userId,
  activeTab,
  messageTabKey = 'pesan',
  debug = false
}: {
  userId: string;
  activeTab: string;
  messageTabKey?: string;
  debug?: boolean;
}) {
  const botMode = useBotMode({ userId, debug });
  const [forceMode, setForceModeState] = useState<boolean>(false);
  const [isCheckingForceMode, setIsCheckingForceMode] = useState<boolean>(false);

  // Check force mode status on initialization - ONCE ONLY
  useEffect(() => {
    if (!userId || !botMode.isReady || isCheckingForceMode) return;

    const checkForceMode = async () => {
      setIsCheckingForceMode(true);
      try {
        const isForceActive = await botMode.getForceMode();
        setForceModeState(isForceActive);
        console.log(`Initial force mode check for ${userId}:`, isForceActive);
      } catch (error) {
        console.error('Failed to check force mode:', error);
        setForceModeState(false);
      } finally {
        setIsCheckingForceMode(false);
      }
    };

    // Only check once when ready and not already checking
    checkForceMode();
  }, [userId, botMode.isReady]); // ONLY depend on userId and botMode.isReady

  // Handle tab changes with force mode logic - OPTIMIZED
  useEffect(() => {
    if (!userId || !botMode.isReady || isCheckingForceMode || forceMode === undefined) return;

    const handleTabChange = async () => {
      try {
        // CRITICAL: Check force mode first to prevent override
        if (forceMode) {
          console.log('Force mode active, skipping automatic mode change');
          return; // Don't change mode if force is active
        }

        // Normal logic: enter message tab = manual mode, exit = bot mode
        if (activeTab === messageTabKey) {
          console.log('Entering message tab - setting manual mode (30 minutes)');
          await botMode.setManualMode(30); // 30 minutes timeout
        } else {
          console.log('Exiting message tab - setting bot mode');
          await botMode.changeMode('bot');
        }
      } catch (error) {
        console.error('Failed to handle tab change:', error);
        // Don't show alert here to prevent user disruption
      }
    };

    // Add small delay to prevent rapid succession calls + debounce
    const timeoutId = setTimeout(handleTabChange, 300); // Increased delay
    
    return () => clearTimeout(timeoutId);
  }, [activeTab, messageTabKey, userId, forceMode]); // Removed botMode and isCheckingForceMode

  return {
    ...botMode,
    forceMode,
    setForceMode: async (force: boolean) => {
      try {
        await botMode.setForceMode(force);
        setForceModeState(force);
      } catch (error) {
        console.error('Failed to set force mode:', error);
        throw error;
      }
    },
    isCheckingForceMode,
  };
}

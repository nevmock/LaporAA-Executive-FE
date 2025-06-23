// Export semua bot mode utilities dari satu tempat
// Untuk memudahkan import di seluruh aplikasi

// Service
export { 
  BotModeService, 
  createBotModeService, 
  getBotModeService,
  type BotMode,
  type ModeState,
  type BotModeServiceConfig 
} from '../services/botModeService';

// Hooks
export { 
  useBotMode, 
  useBotModeWithTab,
  type UseBotModeOptions,
  type UseBotModeReturn 
} from '../hooks/useBotMode';

// Components
export { 
  BotModeIndicator, 
  BotModeDebugPanel,
  type BotModeIndicatorProps,
  type BotModeDebugPanelProps 
} from '../components/BotModeIndicator';

// Usage examples:
// import { useBotModeWithTab, BotModeIndicator } from './lib/botMode';
// import { getBotModeService } from './lib/botMode';

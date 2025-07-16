# GitHub Copilot Instructions for Lapor AA

## Project Overview
Lapor AA is a WhatsApp-based complaint reporting system for local government with two main components:
- **Frontend**: Next.js 15 executive dashboard (TypeScript, Tailwind CSS)
- **Backend**: Express.js API server (JavaScript, MongoDB)

## Architecture Patterns

### Frontend Structure
- **App Router**: Next.js 15 with `(auth)` and `(dashboard)` route groups
- **Component Organization**: Feature-based folders (`/pengaduan`, `/dashboard`, `/common`)
- **State Management**: React Context for Socket.IO + local useState/useEffect patterns
- **Real-time**: Custom Socket.IO service with offline queue and reconnection logic

### Backend Structure
- **Layered Architecture**: Controllers → Services → Repositories → Models
- **WhatsApp Integration**: Bot flow service handles conversational logic
- **Authentication**: JWT tokens with role-based permissions

## Key Conventions

### Role-Based Access Control
Three role levels with specific UI patterns:
```typescript
// Conditional rendering pattern used throughout
{(role === "Bupati" || role === "SuperAdmin") && (
  <AdminOnlyComponent />
)}

// Role hierarchy: SuperAdmin > Bupati > Admin
```

### Component Props Pattern
Components use comprehensive interface props with clear TypeScript definitions:
```typescript
interface Props {
  // State & handlers grouped logically
  search: string;
  setSearch: (val: string) => void;
  // Data arrays with consistent naming
  filteredData: ChatData[];
  // Loading states for async operations
  loading: boolean;
  loadingPin: Record<string, boolean>;
}
```

### API Integration
- Base URL: `process.env.NEXT_PUBLIC_BE_BASE_URL`
- Axios for HTTP requests with consistent error handling
- Socket.IO for real-time updates with robust reconnection logic

### File Naming & Organization
- **Components**: PascalCase (`TableSection.tsx`, `HeaderDesktop.tsx`)
- **Services**: camelCase (`socketService.ts`, `botModeService.ts`)
- **Hooks**: `use` prefix (`useNetworkStatus.ts`)
- **Types**: `.types.ts` suffix (`socket.types.ts`)

## Critical Workflows

### Development Commands
```bash
# Frontend (with Turbopack)
npm run dev --turbopack

# Backend
npm start              # Production
npm run dev           # Development with nodemon

# Build Analysis
npm run analyze       # Bundle analyzer
```

### Socket.IO Integration
The app heavily relies on Socket.IO for real-time updates:
- Use `SocketContext` for global socket state
- Service layer handles connection management, offline queue, and reconnection
- All socket events use typed interfaces from `socket.types.ts`

### Photo/Media Handling
- Images stored in backend `/public/uploads/`
- Frontend uses Next.js Image component with `unoptimized: true`
- Custom download functions generate formatted filenames: `DDMMYY_Name_(1)_sessionId.ext`

### Error Boundaries
- Global `ErrorBoundary` component wraps critical sections
- Consistent error handling with fallback UI patterns
- Network-aware offline/online state management

## Data Patterns

### Report/Complaint Structure
```typescript
interface ChatData {
  sessionId: string;           // Primary identifier
  from: string;               // WhatsApp number
  user: string;              // Display name
  tindakan?: {               // Admin actions
    status: string;
    situasi: string;
    opd: string[];           // Government departments
    prioritas: 'Ya' | 'Tidak';
    tag: TagItem[];
  };
  location?: LocationData;
  photos: string[];          // File paths
  is_pinned?: boolean;
}
```

### Tag System
- Legacy string arrays and new object format coexist
- UI renders both formats with search functionality
- Tags use blue badge styling with hover effects

## Integration Points

### WhatsApp Bot
- Backend handles webhook verification and message processing
- Bot state managed through `UserSession` model
- Force mode toggles between manual/automatic responses

### External APIs
- SP4N Lapor integration for tracking IDs
- GeoJSON for location data
- Image optimization disabled for external sources

## Performance Considerations
- Next.js Image optimization disabled due to external image sources
- Socket.IO connection pooling and background health checks
- Table virtualization for large datasets (1000+ reports)
- Debounced search and pagination

## Security Patterns
- JWT authentication with role validation
- CSRF protection on API endpoints
- Image content security policy for SVGs
- Input sanitization for file names and user data

When working with this codebase:
1. Always check user role before rendering admin controls
2. Use the Socket.IO service for real-time features
3. Follow the component props interface pattern
4. Handle both legacy and new data formats (tags, OPD arrays)
5. Include proper TypeScript types for all new components
6. Test both online/offline scenarios for socket features

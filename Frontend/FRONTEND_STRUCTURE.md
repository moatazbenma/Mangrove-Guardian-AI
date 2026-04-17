# Frontend Project Structure

## 📁 Folder Organization

```
src/
├── pages/                     # Page components (route-level)
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── index.ts
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   └── index.ts
│   └── reports/
│       ├── ReportForm.tsx
│       └── index.ts
│
├── components/                # Reusable components
│   ├── shared/               # Shared/common components
│   │   ├── ReportMap.tsx
│   │   └── index.ts
│   ├── auth/                 # Auth-specific components
│   ├── dashboard/            # Dashboard-specific components
│   └── reports/              # Report-specific components
│
├── hooks/                     # Custom React hooks
│   └── (useFetch, useAuth, etc.)
│
├── services/                  # API & external services
│   ├── api.ts                # Axios instance & base API setup
│   └── (auth, reports, etc.)
│
├── types/                     # TypeScript types & interfaces
│   └── index.ts              # Centralized type definitions
│
├── utils/                     # Utility functions
│   └── index.ts              # Helper functions
│
├── constants/                 # Application constants
│   └── (API endpoints, config values, etc.)
│
├── api/                       # Legacy API files (optional)
│   ├── auth.ts
│   └── axios.ts
│
├── assets/                    # Images, fonts, etc.
│   └── (static files)
│
├── App.tsx                    # Root component
├── main.tsx                   # Entry point
└── index.css                  # Global styles
```

## 🎯 Usage Guidelines

### Pages
- One page component per route
- Contains logic and data fetching for that route
- Located in `pages/[feature]/PageName.tsx`

### Components
- **Shared**: Used across multiple features (buttons, cards, modals)
- **Feature-specific**: Components for auth, dashboard, reports
- Break large components into smaller, reusable pieces

### Hooks
- Custom React hooks for shared logic
- Naming convention: `useFeatureName`
- Example: `useFetch`, `useAuth`, `useNotification`

### Services
- Centralized API calls and external service integrations
- API client setup with Axios
- Separate service files for different domains

### Types
- All TypeScript interfaces in one place
- Helps maintain type consistency across the app

### Utils
- Pure utility functions
- Formatting, validation, transformation helpers

### Constants
- API endpoints, error messages, config values
- Keep magic strings in constants file

## 📦 Importing

**Good:**
```tsx
import { LoginPage } from '@/pages/auth';
import { Dashboard } from '@/pages/dashboard';
import { ReportMap } from '@/components/shared';
import api from '@/services/api';
import { Report } from '@/types';
import { formatDate } from '@/utils';
```

**Avoid:**
```tsx
// ❌ Deep imports
import LoginPage from '../../../pages/auth/LoginPage';
```

## 🚀 Adding New Features

1. Create feature folder in `pages/[feature]/`
2. Create component folder in `components/[feature]/`
3. Create service in `services/` if needed
4. Add types in `types/index.ts`
5. Create index files for clean exports

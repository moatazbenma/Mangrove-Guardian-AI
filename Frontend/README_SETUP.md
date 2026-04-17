# Frontend Setup & Organization

## 📂 New Project Structure

The frontend has been reorganized for better maintainability and scalability:

```
Frontend/
├── src/
│   ├── pages/                  # Route-level pages
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard page
│   │   └── reports/           # Report management pages
│   │
│   ├── components/            # Reusable components
│   │   ├── shared/           # Common/shared components
│   │   ├── auth/             # Auth-specific components
│   │   ├── dashboard/        # Dashboard components
│   │   └── reports/          # Report components
│   │
│   ├── services/             # API services
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript types
│   ├── utils/               # Utility functions
│   ├── constants/           # Application constants
│   ├── api/                 # Legacy API files (in transition)
│   ├── assets/              # Images, fonts
│   ├── App.tsx              # Root component
│   └── main.tsx             # Entry point
│
├── FRONTEND_STRUCTURE.md    # Detailed structure docs
└── tsconfig.json
```

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Build
```bash
npm run build
```

## 📦 Import Patterns

Always use the clean import pattern:

```typescript
// ✅ Good
import { Dashboard } from '@/pages/dashboard';
import { ReportMap } from '@/components/shared';
import { Report } from '@/types';
import { formatDate } from '@/utils';

// ❌ Avoid deep imports
import Dashboard from '../../../pages/dashboard/Dashboard';
```

## 🔄 Recent Changes

### Files Reorganized
- `pages/LoginPage.tsx` → `pages/auth/LoginPage.tsx`
- `pages/RegisterPage.tsx` → `pages/auth/RegisterPage.tsx`
- `pages/Dashboard.tsx` → `pages/dashboard/Dashboard.tsx`
- `pages/ReportForm.tsx` → `pages/reports/ReportForm.tsx`
- `components/ReportMap.tsx` → `components/shared/ReportMap.tsx`

### Imports Updated
- `App.tsx` - Updated to use new page paths
- `pages/dashboard/Dashboard.tsx` - Updated ReportMap import

## 📚 For More Details

See [FRONTEND_STRUCTURE.md](./FRONTEND_STRUCTURE.md) for:
- Complete folder organization
- Detailed usage guidelines
- Examples and best practices
- How to add new features

## 🎯 Next Steps

1. **Migrate API Services** - Move calls from `api/` to `services/`
2. **Create Custom Hooks** - Extract logic into `hooks/`
3. **Standardize Types** - All types in `types/index.ts`
4. **Migrate Utils** - Move helper functions to `utils/`

## 💡 Tips

- Use `index.ts` files for clean exports from folders
- Keep components small and focused
- Use TypeScript for better type safety
- Check folder READMEs for detailed guidelines

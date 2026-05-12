# 🚀 FOODBRIDGE - Enhanced Application Documentation

## Overview

FOODBRIDGE is an AI-powered food redistribution platform that connects donors, volunteers, NGOs, and reporters to efficiently redirect excess food to those in need.

**Latest Enhancement Cycle:**
- ✅ Unified Dashboard Layout with role-based navigation
- ✅ Comprehensive Form Validation System
- ✅ Enhanced Error Pages and UX
- ✅ Improved Documentation and Code Quality

---

## 📋 Table of Contents

1. [Architecture & Components](#architecture--components)
2. [Forms & Validation](#forms--validation)
3. [Dashboard & Layout](#dashboard--layout)
4. [Core Systems](#core-systems)
5. [Best Practices](#best-practices)
6. [Development Guide](#development-guide)

---

## Architecture & Components

### Component Structure

```
components/
├── layout/
│   ├── DashboardLayout.tsx       # Main dashboard wrapper with nav
│   └── DashboardNav.tsx
├── ui/
│   ├── form-field.tsx            # Enhanced form field with validation
│   ├── button.tsx
│   ├── input.tsx
│   └── [other UI components]
├── auth/
│   ├── LoginForm.tsx             # Optimized login with validation
│   └── SignupForm.tsx            # Multi-step signup with KYC
├── dashboard/
│   └── AnalyticsDashboard.tsx    # Real-time analytics (5 tabs)
├── visualization/
│   └── RealtimeTrackingVisualizations.tsx
└── demo/
    └── FoodBridgeDemoFlow.tsx    # 6-step interactive demo
```

### Key Architecture Principles

- **Modular**: Each component is self-contained and reusable
- **Type-Safe**: Full TypeScript with strict mode enabled
- **Composable**: Components can be combined to build complex UIs
- **Accessible**: Built-in ARIA labels, keyboard navigation
- **Responsive**: Mobile-first design approach

---

## Forms & Validation

### Validation System

Located in `lib/form-validation.ts`, provides:

**Validation Functions:**
```typescript
- validateEmail(email: string)
- validatePassword(password: string)
- validatePasswordConfirm(password, confirm)
- validateFullName(name: string)
- validatePhone(phone: string)
- validateAddress(address: string)
- validateRequired(value: string, fieldName: string)
- validateCheckbox(checked: boolean, fieldName: string)
- validateSignupForm(data: object)
- validateKycForm(data: object)
```

**Error Types:**
- `error` - Blocking validation failure
- `warning` - Non-blocking suggestion (e.g., weak password)

### Using FormField Component

```typescript
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { validateEmail, getFieldErrorMessage } from '@/lib/form-validation';

// In your component:
const [email, setEmail] = useState('');
const [errors, setErrors] = useState([]);

const handleChange = (value: string) => {
  setEmail(value);
  const error = validateEmail(value);
  // Update errors array
};

// In JSX:
<FormField
  label="Email Address"
  error={getFieldErrorMessage(errors, 'email')}
  required
  helperText="We'll send you a confirmation code"
>
  <Input
    type="email"
    value={email}
    onChange={(e) => handleChange(e.target.value)}
    placeholder="you@example.com"
  />
</FormField>
```

### Form Validation Best Practices

1. **Real-time Validation**: Validate as user types for better UX
2. **Clear Messages**: Use specific, actionable error messages
3. **Progressive Enhancement**: Show warnings but allow submission
4. **Field-Level Focus**: Highlight problematic fields immediately
5. **Summary Display**: Show all errors at form top for quick review

---

## Dashboard & Layout

### DashboardLayout Component

Provides the authenticated user experience with:

- **Responsive Navigation**: Desktop sidebar + mobile menu
- **Role-Based Routes**: Different nav items per user role
- **Quick Stats**: Sidebar showing user contribution/impact
- **User Profile**: Avatar and role display
- **Notification Badge**: Unread alerts indicator

**Supported Roles:**
- `admin` - Analytics, users, KYC reviews
- `volunteer` - Missions, tracking
- `donor` - Donations, impact metrics
- `ngo` - Recipients, analytics
- `reporter` - Reporting dashboard

### Usage Example

```typescript
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function VolunteerDashboard() {
  return (
    <DashboardLayout 
      userRole="volunteer" 
      userName="Rajesh Kumar"
    >
      {/* Your dashboard content */}
    </DashboardLayout>
  );
}
```

### Responsive Breakpoints

- **Mobile**: Full-width layout, hamburger menu
- **Tablet (768px)**: Collapsed sidebar, full navigation
- **Desktop (1024px)**: Expanded sidebar with quick stats

---

## Core Systems

### 1. Volunteer Tracking System
**File:** `lib/volunteer-tracking.ts`

Manages real-time volunteer locations with:
- GPS coordinate tracking
- Journey segment management
- Geofencing detection
- Performance metrics

```typescript
// Record volunteer location
recordVolunteerLocation(
  volunteerId: string,
  lat: number,
  lng: number,
  accuracy: number
)

// Get location history
getVolunteerLocationHistory(volunteerId: string, limitPoints?: number)

// Check geofence status
isVolunteerInGeofence(volunteerId: string, missionId: string)
```

### 2. KYC Verification System
**File:** `lib/kyc-verification.ts`

Automated beneficiary verification with:
- 0-100 scoring system
- Document verification
- Multi-step review process
- Automatic expiration (365 days)

**Status Flow:** `pending → under_review → approved/rejected/expired`

### 3. Mission Assignment Algorithm
**File:** `lib/mission-assignment.ts`

Multi-factor volunteer matching using:
- Distance Score (25%)
- Availability Score (20%)
- Performance Score (25%)
- Priority Score (15%)
- Urgency Score (15%)

```typescript
// Find best volunteer
findBestVolunteerForMission(mission, availableVolunteers)

// Batch assignments
batchAssignMissions(missions, volunteers)

// Get scoring breakdown
scoreVolunteerForMission(volunteer, mission)
```

### 4. Food Redistribution Optimizer
**File:** `lib/donation-redistribution-optimizer.ts`

Optimized distribution balancing efficiency & fairness:
- Distance minimization (20%)
- Capacity utilization (20%)
- Demand prioritization (25%)
- Fairness rotation (20%)
- Specialized matching (15%)

---

## Best Practices

### 1. Component Development

```typescript
/**
 * Clear JSDoc comments explaining purpose
 * @component
 * @example
 * <MyComponent prop="value" />
 */
export function MyComponent({ prop }: Props) {
  // Implementation
}
```

### 2. Error Handling

```typescript
try {
  // Operation
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  setError(message);
  // Log for debugging
  console.error('Operation failed:', err);
}
```

### 3. Async Operations

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

const handleAsync = async () => {
  setLoading(true);
  setError('');
  try {
    // Operation
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error');
  } finally {
    setLoading(false);
  }
};
```

### 4. Form Submission

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validate
  const validation = validateSignupForm(data);
  if (!validation.isValid) {
    setErrors(validation.errors);
    return;
  }
  
  // Submit
  await submitForm(data);
};
```

---

## Development Guide

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type check
tsc --noEmit

# Lint code
npm run lint
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Code Quality Guidelines

1. **TypeScript**: Use strict mode, avoid `any`
2. **Documentation**: Add JSDoc for all public functions
3. **Components**: Keep components under 300 lines
4. **Styling**: Use Tailwind CSS utility classes
5. **Accessibility**: Include ARIA labels, test with keyboard
6. **Testing**: Write unit tests for utilities

### Adding New Pages

1. Create folder in `app/[route]/`
2. Add `page.tsx` as default export
3. Wrap with `DashboardLayout` if authenticated
4. Add proper metadata in layout.tsx

Example:
```typescript
// app/volunteer/dashboard/page.tsx
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export const metadata = {
  title: 'My Dashboard - FOODBRIDGE',
};

export default function VolunteerDashboard() {
  return (
    <DashboardLayout userRole="volunteer" userName="Volunteer Name">
      {/* Content */}
    </DashboardLayout>
  );
}
```

### Common Patterns

**Loading State:**
```typescript
{loading ? (
  <div className="flex items-center gap-2">
    <Loader2 className="w-4 h-4 animate-spin" />
    Loading...
  </div>
) : (
  // Content
)}
```

**Error Display:**
```typescript
{error && (
  <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
    <AlertCircle className="w-5 h-5 text-red-600" />
    <p className="text-sm text-red-700">{error}</p>
  </div>
)}
```

**Empty State:**
```typescript
{items.length === 0 ? (
  <Card className="p-8 text-center">
    <p className="text-slate-600">No items found</p>
  </Card>
) : (
  // Content
)}
```

---

## File Structure Reference

```
Final year/
├── app/
│   ├── (auth)/             # Auth pages (login, signup)
│   ├── (dashboard)/        # Authenticated routes
│   ├── admin/              # Admin pages
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Global styles
│   └── error.tsx           # Error boundary
├── components/
│   ├── layout/             # Layout components
│   ├── ui/                 # UI components
│   ├── auth/               # Auth forms
│   ├── dashboard/          # Dashboard components
│   ├── visualization/      # Charts & visualizations
│   └── demo/               # Demo components
├── lib/
│   ├── form-validation.ts  # Form validation utilities
│   ├── volunteer-tracking.ts
│   ├── kyc-verification.ts
│   ├── mission-assignment.ts
│   ├── donation-redistribution-optimizer.ts
│   ├── audit-log.ts
│   ├── error-handler.ts
│   ├── geo-distance.ts
│   ├── types.ts
│   └── supabase/           # Supabase clients
├── hooks/
│   ├── use-volunteer-tracking.ts
│   ├── use-mission-assignment.ts
│   ├── use-donation-redistribution.ts
│   └── [other hooks]
├── public/                 # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
└── README.md
```

---

## Key Features Summary

| Feature | File | Status |
|---------|------|--------|
| Real-time Volunteer Tracking | `lib/volunteer-tracking.ts` | ✅ Complete |
| KYC Verification System | `lib/kyc-verification.ts` | ✅ Complete |
| Mission Assignment Algorithm | `lib/mission-assignment.ts` | ✅ Complete |
| Food Redistribution Optimizer | `lib/donation-redistribution-optimizer.ts` | ✅ Complete |
| Interactive Demo | `components/demo/FoodBridgeDemoFlow.tsx` | ✅ Complete |
| Analytics Dashboard | `components/dashboard/AnalyticsDashboard.tsx` | ✅ Complete |
| Enhanced Forms | `lib/form-validation.ts` + `components/ui/form-field.tsx` | ✅ Complete |
| Dashboard Layout | `components/layout/DashboardLayout.tsx` | ✅ Complete |
| Error Pages | `app/not-found.tsx` | ✅ Complete |
| Authentication | `components/auth/LoginForm.tsx` + `SignupForm.tsx` | ✅ Complete |

---

## Next Steps & Recommendations

1. **Integration**: Connect real Supabase backend
2. **Real Data**: Replace mock data with actual database queries
3. **Testing**: Add comprehensive unit/integration tests
4. **Notifications**: Implement real-time push notifications
5. **Mobile App**: Consider React Native version
6. **Performance**: Add caching and pagination
7. **Analytics**: Implement event tracking
8. **Internationalization**: Add multi-language support

---

## Support & Resources

- **Documentation**: See inline JSDoc comments in source files
- **Issues**: Report bugs with reproduction steps
- **Contributing**: Follow code style and testing guidelines
- **Deployment**: See `DEPLOYMENT.md`

---

**© 2026 FOODBRIDGE. Turning Excess Into Access.**

# IPSS (Invisible People Support System) - Implementation Guide

## Overview
This is a complete authentication flow and role-specific dashboard system for the IPSS platform, built with Next.js 16, Supabase, and shadcn/ui.

## Architecture

### Authentication Flow
1. **Login** (`/auth/login`) - Email/password authentication
2. **Signup** (`/auth/signup`) - Create account with role selection (Donor, Reporter, NGO, Volunteer)
3. **Onboarding** (`/auth/onboarding`) - Role-specific carousel with introduction slides
4. **Dashboard Redirect** (`/`) - Auto-routes authenticated users to their role dashboard

### Database Schema
The system uses Supabase PostgreSQL with Row Level Security (RLS) for data protection:

**Tables:**
- `public.users` - User profiles with role assignment
- `public.donations` - Food donations from donors
- `public.case_reports` - Food need reports from reporters
- `public.missions` - Delivery missions for volunteers

**Features:**
- User role enum: `donor`, `reporter`, `ngo`, `volunteer`
- RLS policies enforce data access control
- Cascade deletes for data integrity

### Role-Specific Dashboards

#### Donor Dashboard (`/dashboard/donor`)
- **Impact Stats**: Meals provided count, donation history, community hero badge
- **Donate Food**: Form to submit food donations with quantity
- **Recent Donations**: List of all donations with timestamps
- **Features**: Track impact, see contribution history

#### Reporter Dashboard (`/dashboard/reporter`)
- **Report Cases**: Form to report areas needing food assistance
- **Case Statistics**: Total cases reported, pending verification count
- **Case List**: View all reported cases with verification status
- **Features**: Identify food needs, track verification status

#### NGO Dashboard (`/dashboard/ngo`)
- **Command Center**: Real-time overview of all operations
- **Priority Cases**: Sorted by urgency score with location details
- **Active Missions**: Monitor volunteer deliveries in progress
- **Statistics**: Cases, missions, meals, volunteers active
- **Features**: Manage all food distribution operations

#### Volunteer Dashboard (`/dashboard/volunteer`)
- **Active Mission**: Currently assigned mission details and checklist
- **Mission Acceptance**: Swipe to accept pending missions
- **Available Missions**: Browse unassigned delivery tasks
- **Mission Status**: Track pickup/delivery locations and completion
- **Features**: Accept missions, complete deliveries, track status

## File Structure

```
app/
├── layout.tsx                          # Root layout with providers
├── page.tsx                            # Auth check & redirect
├── (auth)/
│   ├── layout.tsx                     # Auth layout (green background)
│   ├── login/page.tsx                 # Login page
│   ├── signup/page.tsx                # Signup page
│   └── onboarding/page.tsx            # Onboarding carousel
├── (dashboard)/
│   ├── layout.tsx                     # Dashboard layout with nav
│   ├── page.tsx                       # Dashboard redirect
│   ├── donor/page.tsx                 # Donor dashboard
│   ├── reporter/page.tsx              # Reporter dashboard
│   ├── ngo/page.tsx                   # NGO dashboard
│   └── volunteer/page.tsx             # Volunteer dashboard
└── providers.tsx                       # Client providers

components/
├── auth/
│   ├── LoginForm.tsx                  # Login form component
│   ├── SignupForm.tsx                 # Signup form with role selection
│   └── OnboardingCarousel.tsx         # Role-specific onboarding slides
├── dashboards/
│   ├── DonorDashboard.tsx             # Donor dashboard component
│   ├── ReporterDashboard.tsx          # Reporter dashboard component
│   ├── NGODashboard.tsx               # NGO dashboard component
│   └── VolunteerDashboard.tsx         # Volunteer dashboard component
└── layout/
    └── DashboardNav.tsx               # Navigation bar with user menu

lib/
├── types.ts                           # TypeScript types & interfaces
└── supabase/
    ├── client.ts                      # Client-side Supabase instance
    ├── server.ts                      # Server-side Supabase instance
    └── proxy.ts                       # Middleware session handling

scripts/
└── seed.sql                           # Database schema & RLS policies

middleware.ts                          # Auth middleware for route protection
```

## Setup Instructions

### 1. Connect Supabase
Make sure Supabase is connected in project settings with:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Create Database Tables
Run the SQL migration in `scripts/seed.sql` in your Supabase SQL editor:

```sql
-- Creates:
-- - user_role enum type
-- - public.users table with RLS policies
-- - public.donations table with RLS policies
-- - public.case_reports table with RLS policies
-- - public.missions table with RLS policies
```

### 3. User Email Confirmation (Optional)
By default, Supabase requires email confirmation for new signups. You can disable this in Supabase Auth settings if needed for testing.

## Key Features Implemented

### Authentication
✅ Email/password sign up and login
✅ Role selection during signup (Donor/Reporter/NGO/Volunteer)
✅ Role-specific onboarding carousel
✅ Session persistence across page refreshes
✅ Automatic redirect based on user role
✅ Logout functionality

### Authorization
✅ Middleware-based route protection (`/dashboard/*` requires auth)
✅ Row Level Security (RLS) in database
✅ Role-based data access (users can only view their own data + public data)
✅ Automatic redirect to login for unauthorized access

### Dashboards
✅ **Donor**: Submit donations, track impact, view history
✅ **Reporter**: Report cases, track verification status
✅ **NGO**: Command center, manage all operations, view statistics
✅ **Volunteer**: Accept missions, track deliveries, mark complete

### UI/UX
✅ Green theme matching design mockups
✅ Responsive design (mobile-first)
✅ Loading states with spinners
✅ Error handling and alerts
✅ Form validation
✅ Role-based navigation

## Testing the System

### Test Flow
1. Go to `/auth/signup`
2. Create account with role "Donor" (or any role)
3. You'll be redirected to onboarding carousel
4. Complete onboarding to reach dashboard
5. Try different roles to see role-specific dashboards
6. Use profile menu to logout

### Test Data
The system is ready to accept real data:
- Donations are created in `public.donations` table
- Cases are created in `public.case_reports` table
- Missions are created in `public.missions` table
- All have RLS policies for data security

## Dependencies Required
```json
{
  "@supabase/ssr": "latest",
  "@supabase/supabase-js": "latest",
  "next": "^16.0.0",
  "react": "^19.0.0",
  "shadcn/ui": "latest",
  "tailwind-css": "^4.0.0",
  "react-hook-form": "^7.54.1",
  "zod": "^3.24.1",
  "lucide-react": "latest"
}
```

## Customization

### Add OAuth (Google/Apple)
Uncomment the OAuth button code in `LoginForm.tsx` and `SignupForm.tsx`, then configure in Supabase Auth settings.

### Modify Onboarding Slides
Edit the `ONBOARDING_SLIDES` object in `OnboardingCarousel.tsx` to customize role-specific slides.

### Change Color Scheme
Update green color classes throughout components. Primary: `#15803d` (green-600), Secondary: `#166534` (green-700)

### Add More Roles
1. Update `UserRole` type in `lib/types.ts`
2. Add case in `ONBOARDING_SLIDES` in `OnboardingCarousel.tsx`
3. Update user_role enum in `scripts/seed.sql`
4. Create new dashboard component
5. Add route in `app/(dashboard)/[role]/page.tsx`

## Troubleshooting

### Users logged out randomly
Make sure `middleware.ts` is calling `supabase.auth.getUser()` - this refreshes the session.

### RLS Policy Errors
Check that the user's role is correctly set in `public.users` table. RLS policies verify the user ID and role.

### Images/assets not loading
Make sure image URLs are properly formatted and CORS headers are configured in Supabase storage.

### Session not persisting
Ensure cookies are being set correctly in middleware. Check browser DevTools → Application → Cookies.

## Security Considerations

1. **Password Security**: Supabase handles bcrypt hashing
2. **CORS**: Supabase is configured for your domain
3. **RLS**: All tables have Row Level Security enabled
4. **HTTPS Only**: Session cookies are secure by default
5. **JWT Tokens**: Supabase manages token refresh automatically
6. **Email Verification**: Optional via Supabase Auth settings

## Next Steps

1. ✅ Database schema created with RLS
2. ✅ Authentication flow implemented
3. ✅ Middleware for route protection
4. ✅ All 4 role dashboards built
5. 📝 Test with real users
6. 📝 Connect to backend APIs for donations/cases/missions
7. 📝 Add real-time updates (Supabase Realtime)
8. 📝 Deploy to Vercel

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review Next.js App Router: https://nextjs.org/docs
- Check shadcn/ui components: https://ui.shadcn.com

# IPSS - Integrated Platform for Social Support 🤝

**A comprehensive Next.js application for managing donations, food distribution, and community volunteerism.**

---

## 📋 Project Overview

IPSS is a modern web platform that connects:
- **Donors** → Contribute food and resources
- **NGOs** → Manage distribution centers and logistics
- **Reporters** → Document food needs in communities
- **Volunteers** → Execute deliveries and community support

### Key Features
✅ Role-based user authentication with 3-step KYC signup  
✅ Google OAuth integration for seamless login  
✅ Multi-role dashboards with real-time data sync  
✅ Donation tracking and impact metrics  
✅ Community needs reporting system  
✅ Volunteer mission management  
✅ Resilient auth layer with metadata fallback  
✅ Performance-optimized with Turbopack  

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16.2.0 (Turbopack)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + Google OAuth
- **UI**: React 18+ with Radix UI components
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **State**: Client-side React hooks

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account with project

### 1. Clone & Install
```bash
cd "Final year"
npm install
```

### 2. Configure Environment
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxx
```

Obtain these values from Supabase: Settings → API → Your API Keys

### 3. Setup Database Schema
```bash
# In Supabase SQL Editor, run:
# scripts/seed.sql
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Authentication Flow

### Signup (3-Step KYC Process)

**Step 1: Account Details**
- Email
- Password (minimum 8 characters)
- Full Name

**Step 2: Role Selection**
- Choose: Donor, Reporter, NGO, or Volunteer

**Step 3: KYC (Know Your Customer)**

**Common for all roles:**
- Phone number
- Address
- ID type (National ID, Passport, Driver's License, etc.)
- ID number
- Consent checkbox (terms & conditions)

**Role-specific fields:**

| Role | Additional KYC Fields |
|------|----------------------|
| **Donor** | None additional |
| **NGO** | Organization name, Registration number |
| **Volunteer** | Emergency contact name, Emergency contact phone |
| **Reporter** | Coverage area (region/city) |

### Login Options

**Email & Password**
1. Go to [http://localhost:3000/login](http://localhost:3000/login)
2. Enter email and password
3. Click "Sign in"

---

## 👥 Test Credentials & Scenarios

### Test User Accounts

To create test accounts, use the signup flow with these variations:

**Test Donor:**
- Email: `donor@test.com`
- Password: `TestPass123!`
- Full Name: `John Donor`
- Phone: `+1-555-0101`
- Address: `123 Main St, City, State`
- ID Type: National ID
- ID Number: `123-45-6789`

**Test NGO:**
- Email: `ngo@test.com`
- Password: `TestPass123!`
- Full Name: `Jane NGO`
- Organization: `Community Food Bank`
- Registration: `REG-2024-001`
- Phone: `+1-555-0102`
- Address: `456 Oak Ave, City, State`
- ID Type: Driver's License
- ID Number: `DL456789`

**Test Reporter:**
- Email: `reporter@test.com`
- Password: `TestPass123!`
- Full Name: `Bob Reporter`
- Coverage Area: `Downtown District`
- Phone: `+1-555-0103`
- Address: `789 Elm Rd, City, State`
- ID Type: Passport
- ID Number: `PASS987654`

**Test Volunteer:**
- Email: `volunteer@test.com`
- Password: `TestPass123!`
- Full Name: `Alice Volunteer`
- Emergency Contact: `Sarah Volunteer`
- Emergency Phone: `+1-555-0199`
- Phone: `+1-555-0104`
- Address: `321 Pine Ln, City, State`
- ID Type: National ID
- ID Number: `NAT-111-222`

### Test Workflows

**Donor Workflow**
1. Sign up as Donor
2. Navigate to `/donor`
3. Click "Make a Donation"
4. Enter food type and quantity
5. View donation in "Recent Donations"
6. Check impact metrics

**NGO Workflow**
1. Sign up as NGO
2. Navigate to `/ngo`
3. View distribution overview
4. Monitor volunteer missions
5. Track resource inventory

**Reporter Workflow**
1. Sign up as Reporter
2. Navigate to `/reporter`
3. Submit new need report
4. Track report status
5. View community impact

**Volunteer Workflow**
1. Sign up as Volunteer
2. Navigate to `/volunteer`
3. Browse available missions
4. Accept delivery task
5. Mark mission complete

---

## 📁 Project Structure

```
Final year/
├── app/                              # Next.js app directory
│   ├── (auth)/                       # Auth routes group
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── onboarding/page.tsx
│   ├── (dashboard)/                  # Dashboard routes group
│   │   ├── page.tsx
│   │   ├── donor/page.tsx
│   │   ├── ngo/page.tsx
│   │   ├── reporter/page.tsx
│   │   ├── volunteer/page.tsx
│   │   └── layout.tsx
│   └── layout.tsx
├── components/
│   ├── auth/                         # Auth UI components
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── OnboardingCarousel.tsx
│   ├── dashboards/                   # Role-specific dashboards
│   │   ├── DonorDashboard.tsx
│   │   ├── NGODashboard.tsx
│   │   ├── ReporterDashboard.tsx
│   │   ├── VolunteerDashboard.tsx
│   │   └── DashboardNav.tsx
│   ├── ui/                           # Radix UI components
│   └── theme-provider.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Browser Supabase client (singleton)
│   │   ├── server.ts                # Server Supabase client
│   │   ├── proxy.ts                 # Middleware proxy for SSR
│   │   └── user-profile.ts          # Profile helpers with fallback
│   ├── types.ts                     # TypeScript definitions
│   └── utils.ts                     # Utility functions
├── scripts/
│   └── seed.sql                     # Database schema setup
├── .env.local                       # Environment variables
└── package.json
```

---

## 🔧 Development

### Available Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable API key | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (fallback) | ✅ |

---

## 📐 Methodology and Algorithms

### 5.2 Haversine Formula for Location Matching

#### 5.2.1 Overview
The Haversine formula calculates the shortest spherical distance between two points using latitude and longitude. In FOODBRIDGE, this is used to identify the nearest NGO for a reported donor location.

#### 5.2.2 Mathematical Formula
Given two points $(\phi_1, \lambda_1)$ and $(\phi_2, \lambda_2)$ in radians:

$$
a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)
$$

$$
c = 2\,\operatorname{atan2}(\sqrt{a},\sqrt{1-a}), \quad d = r\,c
$$

Where:
- $d$ = distance between two points
- $r$ = Earth radius (approximately $6371$ km)
- $\phi_1, \phi_2$ = latitudes
- $\lambda_1, \lambda_2$ = longitudes

#### 5.2.3 Working Principle
1. Convert latitude and longitude values from degrees to radians.
2. Apply the Haversine equation to compute great-circle distance.
3. Compute distance from incident/donation point to each provider with valid coordinates.
4. Select minimum distance.
5. Assign nearest NGO and create linked mission(s).

#### 5.2.4 Application in FOODBRIDGE
- **Current implementation:** nearest NGO matching is active in `findNearestNGO` and `assignDonationToNearestNGO`.
- Reduces response time by routing to geographically closest organization.
- Improves delivery efficiency by reducing travel overhead.

### 5.3 AI-Based Text Classification

#### 5.3.1 Overview
NLP techniques are used to classify user report text into assistance categories:
- Food
- Medical
- Shelter

#### 5.3.2 TF-IDF (Term Frequency-Inverse Document Frequency)
TF-IDF converts text into weighted numerical features:

$$
\mathrm{tfidf}(t, d, D) = \mathrm{tf}(t, d) \cdot \log\left(\frac{1 + |D|}{1 + \mathrm{df}(t, D)}\right) + 1
$$

Where:
- $t$ = term
- $d$ = document
- $D$ = corpus
- $\mathrm{df}(t, D)$ = number of documents containing term $t$

#### 5.3.3 Logistic Regression
Logistic Regression estimates class probability:

$$
z = w_1x_1 + w_2x_2 + \dots + b
$$

$$
\sigma(z) = \frac{1}{1 + e^{-z}}
$$

#### 5.3.4 Working Process
1. User inputs report title/description/notes.
2. Text is normalized and tokenized (with stop-word removal).
3. TF-IDF features are computed.
4. Logistic-style weighted scoring predicts assistance category.
5. Predicted category is passed to urgency estimation.

#### 5.3.5 Application in FOODBRIDGE
- **Current implementation:** lightweight classifier exists in `lib/text-classifier.ts` and runs during report submission.
- Automatically infers likely assistance type.
- Reduces manual triage effort for reporters and NGOs.

### 5.4 Urgency Detection Algorithm

#### 5.4.1 Overview
Urgency detection prioritizes requests so critical cases are addressed first.

#### 5.4.2 Rule-Based Logic
Current rules include:
- If keywords include terms like "injured" or "bleeding" then urgency is elevated strongly.
- If keywords include vulnerable groups like "elderly" or "child" then urgency is elevated.
- General hardship keywords produce moderate urgency elevation.
- People-count and predicted assistance category further adjust final score.

#### 5.4.3 Working Process
1. Analyze submitted report text.
2. Match urgency keywords by severity tier.
3. Apply weighted increments and bound score to $[1, 10]$.
4. Store `urgency_score` in database.
5. Use urgency sorting in NGO case views and queue handling.

#### 5.4.4 Application in FOODBRIDGE
- **Current implementation:** rule-based urgency scoring is active in `lib/urgency-detector.ts` and persisted from reporter submissions.
- Speeds response for critical cases.
- Improves resource allocation across missions.

### 5.5 Overall Methodology

FOODBRIDGE request lifecycle:
1. User submits donation/report details.
2. System records location and contextual metadata.
3. Text classifier predicts assistance category.
4. Urgency engine computes priority score.
5. Location matching identifies nearest service provider.
6. Task/mission is assigned.
7. Delivery is tracked and status is updated on completion.

### 5.6 Advantages of Proposed Methodology

- Automated decision support for case triage.
- Reduced response time with distance-based provider matching.
- Better resource utilization through urgency-aware prioritization.
- Scalable architecture with separable algorithm modules.
- Improved consistency and traceability of assignment decisions.

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Signup flow (all 3 steps) for each role
- [ ] KYC validation (required fields enforce)
- [ ] Login with email/password
- [ ] Role-specific dashboards load correctly
- [ ] Navigation between pages works
- [ ] Responsive design (mobile/tablet/desktop)

### Common Issues & Solutions

**Issue: "Supabase configuration not found"**
- Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and API key
- Restart dev server after env changes: `npm run dev`

**Issue: "public.users table not found"**
- Run `scripts/seed.sql` in Supabase SQL Editor
- Fallback auth metadata is used if table unavailable

**Issue: Port 3000 already in use**
```bash
# Windows: Kill the process using port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Linux/Mac: Kill the process
lsof -ti:3000 | xargs kill -9
```

---

## 🔒 Security Notes

- All passwords hashed with bcrypt (Supabase handles)
- Row-level security (RLS) policies enforce data access
- KYC data stored securely in auth metadata and database
- Environment variables required for all sensitive config

---

## 📞 Support & Troubleshooting

### Logs & Debugging

**Terminal Logs:**
```bash
npm run dev
# Watch for errors in terminal output
```

**Browser Console:**
- Open DevTools: F12
- Check Console tab for client-side errors
- Use Network tab to debug API calls

**Supabase Logs:**
- Supabase Dashboard → Logs → Recent events
- Check for auth, database, and API errors

---

## 📝 License

Private project. All rights reserved.

---




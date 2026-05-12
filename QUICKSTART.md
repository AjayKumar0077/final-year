# IPSS Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Connect Supabase (If Not Already Connected)
1. Open project Settings (top right)
2. Select "Integrations"
3. Connect Supabase project
4. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### Step 2: Create Database Schema
1. Go to your Supabase dashboard
2. Click "SQL Editor"
3. Click "New Query"
4. Copy-paste the contents of `/scripts/seed.sql`
5. Click "Run"
6. Wait for success message (creates all tables + RLS policies)

### Step 3: Run the App
The development server should start automatically. If not:
```bash
pnpm dev
```

### Step 4: Test Authentication
1. Open `http://localhost:3000` in your browser
2. You'll be redirected to `/auth/login`
3. Click "Sign up" to create a test account
4. Fill in the form and select a role (try "Donor")
5. You'll see the onboarding carousel
6. Click through to reach the dashboard

### Step 5: Explore Dashboards
Try signing up with different roles to see different dashboards:
- **Donor**: Track donations and impact
- **Reporter**: Report food needs
- **NGO**: Command center overview
- **Volunteer**: Accept delivery missions

---

## 🧪 Test Scenarios

### Scenario 1: Donor Workflow
```
1. Sign up as Donor
2. Click "Donate Food" button
3. Enter "Fresh vegetables" and quantity 5
4. See it appear in "Recent Donations"
```

### Scenario 2: Reporter Workflow
```
1. Sign up as Reporter
2. Click "Report a Case"
3. Enter location and details
4. See it in "Your Reports" list
```

### Scenario 3: Volunteer Workflow
```
1. Sign up as Volunteer
2. See "Available Missions" list
3. Click "Accept Mission" on any mission
4. See it move to "Active Mission" section
5. Complete mission checklist
```

### Scenario 4: NGO Oversight
```
1. Sign up as NGO
2. See all cases sorted by urgency
3. See all active missions
4. See statistics dashboard
```

---

## 🔑 Default Test Accounts

You can create your own accounts, but here's what the system expects:

**Role: Donor**
- Email: `donor@test.com`
- Can donate food, see impact stats

**Role: Reporter**
- Email: `reporter@test.com`
- Can report cases, verify status

**Role: NGO**
- Email: `ngo@test.com`
- Sees all operations, command center

**Role: Volunteer**
- Email: `volunteer@test.com`
- Can accept and complete missions

---

## 📱 Mobile Testing

The app is fully responsive. Test on:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

All dashboards adapt to screen size.

---

## 🐛 Common Issues & Fixes

### Issue: "RLS Policy Violation"
**Cause**: Database tables don't have RLS policies
**Fix**: Run the SQL from `scripts/seed.sql` again

### Issue: "Session expired"
**Cause**: Middleware not refreshing token
**Fix**: Check `lib/supabase/proxy.ts` is imported in middleware

### Issue: "Wrong dashboard after login"
**Cause**: User role not set correctly
**Fix**: Check `public.users` table, verify role matches enum

### Issue: Donations not showing up
**Cause**: Need to refresh page
**Fix**: Page refresh loads fresh data (real-time updates coming soon)

---

## 🎨 Customization Quick Tips

### Change Theme Color
Search for `green-600` in components and replace with desired color:
```css
green-600 → blue-600  /* or any Tailwind color */
green-700 → blue-700
```

### Modify Onboarding Slides
Edit `components/auth/OnboardingCarousel.tsx`:
```tsx
const ONBOARDING_SLIDES = {
  donor: [
    {
      title: "Your Title Here",
      description: "Your description",
      icon: <YourIcon className="w-16 h-16" />,
    },
    // Add more slides...
  ],
}
```

### Add New Form Fields
In `components/auth/SignupForm.tsx`, add:
```tsx
const [newField, setNewField] = useState('');

// In form:
<Input
  type="text"
  value={newField}
  onChange={(e) => setNewField(e.target.value)}
  placeholder="Your field"
/>

// When creating user profile:
full_name: fullName,
new_field: newField,  // Add this
```

---

## 🚀 Next: Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy!

---

## 📚 Full Documentation

For detailed setup and advanced customization:
- Read `IMPLEMENTATION_GUIDE.md`
- Check `BUILD_SUMMARY.md`
- Review component comments

---

## ✅ You're Ready!

Your IPSS platform is now running with:
- ✅ Full authentication
- ✅ Role-based access
- ✅ Functional dashboards
- ✅ Database with security

**Next Steps:**
1. Test all features
2. Customize colors/text
3. Connect real APIs
4. Deploy to production

---

## 💬 Need Help?

Check the component code - most have inline comments explaining the logic.

**File locations:**
- Auth pages: `app/(auth)/*/page.tsx`
- Dashboards: `app/(dashboard)/*/page.tsx`
- Components: `components/auth/*.tsx` and `components/dashboards/*.tsx`
- Database: `lib/supabase/*.ts`
- Middleware: `middleware.ts` and `lib/supabase/proxy.ts`

---

Happy building! 🎉

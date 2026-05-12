# IPSS Visual Design Guide

## Color Palette

### Primary Colors
- **Primary Green**: `#4d9d6d` or `oklch(0.48 0.167 142.5)`
  - Used for: Buttons, headers, primary actions, brand elements
  - Conveys: Trust, growth, community, health

- **Secondary Yellow**: `#d4ac0d` or `oklch(0.82 0.175 96.5)`
  - Used for: Highlights, CTAs, badges
  - Conveys: Action, warmth, energy

### Supporting Colors
- **Background**: Off-white `oklch(0.98 0 0)`
- **Text**: Dark gray `oklch(0.18 0 0)`
- **Borders**: Light gray `oklch(0.92 0 0)`
- **Error**: Red `oklch(0.63 0.238 27.4)`
- **Muted**: Light gray `oklch(0.92 0 0)`

### Dark Mode
- **Background**: Dark `oklch(0.14 0 0)`
- **Primary**: Lighter green `oklch(0.62 0.167 142.5)`
- **Secondary**: Lighter yellow `oklch(0.88 0.165 96.5)`

---

## Typography

### Font Family
- **Sans Serif**: Geist (default)
- **Monospace**: Geist Mono (for code)

### Font Sizes
- **h1**: 2.25rem (36px) on mobile, 3rem (48px) on desktop
- **h2**: 1.875rem (30px) on mobile, 2.25rem (36px) on desktop
- **h3**: 1.5rem (24px) on mobile, 1.875rem (30px) on desktop
- **Body**: 1rem (16px)
- **Small**: 0.875rem (14px)
- **Extra Small**: 0.75rem (12px)

### Font Weights
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

### Line Heights
- **Tight**: 1.4 (headings)
- **Normal**: 1.5 (body)
- **Relaxed**: 1.6 (paragraphs)

---

## Spacing System

All spacing is based on 0.25rem (4px) increments:
- 0.25rem (1px) - Minimal
- 0.5rem (2px) - Dividers
- 1rem (4px) - Tight
- 1.5rem (6px) - Compact
- 2rem (8px) - Standard
- 2.5rem (10px) - Comfortable
- 3rem (12px) - Relaxed
- 4rem (16px) - Generous
- 6rem (24px) - Large
- 8rem (32px) - Extra Large

---

## Components

### Buttons
- **Default**: Primary green background, white text
- **Outline**: Transparent with border
- **Disabled**: Reduced opacity
- **Hover**: Darker shade, increased shadow
- **Active**: Enhanced shadow with scale

### Cards
- **Border**: Light border with primary/20 opacity
- **Shadow**: Subtle drop shadow with hover elevation
- **Padding**: 1.5rem standard
- **Radius**: 0.625rem (10px)
- **Hover**: Shadow increase, optional border color change

### Inputs
- **Border**: Light gray
- **Focus**: Primary color ring
- **Padding**: 0.625rem
- **Radius**: 0.5rem
- **Background**: White or very light

### Forms
- **Label**: Semibold, small text
- **Error**: Red text with error icon
- **Success**: Green text with checkmark
- **Spacing**: 1.25rem between groups

---

## Animations

### Entrance Animations
```css
.animate-fade-in {
  animation: fadeIn 500ms ease-out forwards;
}

.animate-slide-up {
  animation: slideInUp 500ms ease-out forwards;
}

.animate-slide-down {
  animation: slideInDown 500ms ease-out forwards;
}
```

### Transition Timing
- **Quick**: 150ms - Button hovers, state changes
- **Standard**: 300ms - Opacity, color changes
- **Smooth**: 500ms - Entrance animations
- **Delayed**: 1-2s - Staggered list items

### Easing Functions
- **ease-out**: Default for entrance animations
- **ease-in-out**: For hover states
- **linear**: For progress indicators

---

## Layout Grid

### Breakpoints
- **Mobile**: 640px and below
- **Tablet**: 641px - 1024px
- **Desktop**: 1025px and above

### Max Width
- **Default**: 6rem (1152px)
- **Small**: 3rem (768px)
- **Large**: 7rem (1344px)

### Column System
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3-4 columns

---

## Design Tokens Reference

### In Code
```css
--primary: oklch(0.48 0.167 142.5);
--secondary: oklch(0.82 0.175 96.5);
--accent: oklch(0.48 0.167 142.5);
--background: oklch(0.98 0 0);
--foreground: oklch(0.18 0 0);
--border: oklch(0.92 0 0);
--muted-foreground: oklch(0.5 0 0);
```

### Usage in Tailwind
```html
<!-- Text colors -->
<p class="text-primary">Primary text</p>
<p class="text-secondary">Secondary text</p>
<p class="text-muted-foreground">Muted text</p>

<!-- Background colors -->
<div class="bg-primary">Primary background</div>
<div class="bg-secondary">Secondary background</div>

<!-- Borders -->
<div class="border border-border">With border</div>
<div class="border-primary/30">Semi-transparent border</div>
```

---

## Component Examples

### Stat Card
```html
<Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/0 border border-primary/20">
  <div className="flex items-start justify-between">
    <div>
      <p class="text-muted-foreground text-sm font-semibold">Label</p>
      <p class="text-4xl font-bold text-primary mt-2">Value</p>
    </div>
    <Icon className="w-8 h-8 text-primary" />
  </div>
</Card>
```

### CTA Button
```html
<Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
  <Icon className="w-5 h-5" />
  Action Text
</Button>
```

### Form Input
```html
<Input 
  type="email"
  placeholder="example@email.com"
  className="w-full border-border focus:ring-primary/30"
/>
```

---

## Responsive Design Approach

### Mobile-First
- Design starts at 320px width
- Add media queries for larger screens
- Touch-friendly sizes (44px+ for buttons)

### Tailwind Breakpoints in Use
```html
<!-- Responsive text -->
<h1 class="text-2xl md:text-3xl lg:text-4xl">Responsive heading</h1>

<!-- Responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

<!-- Responsive display -->
<div class="hidden md:block">Visible on tablet and up</div>
<div class="md:hidden">Visible on mobile only</div>
```

---

## Accessibility Checklist

- [ ] Color contrast ratio 4.5:1 for text
- [ ] 44px minimum touch target size
- [ ] Focus visible on all interactive elements
- [ ] Semantic HTML (buttons, links, headings)
- [ ] Alt text for all images
- [ ] ARIA labels where needed
- [ ] Keyboard navigation support
- [ ] Proper heading hierarchy
- [ ] No color-only information
- [ ] Sufficient spacing for readability

---

## Brand Guidelines

### Logo Usage
- Minimum size: 32px
- Always include text "IPSS"
- Use primary green color
- Maintain spacing around logo

### Color Applications
- **Primary** (Green): Main CTA, important information, trust elements
- **Secondary** (Yellow): Highlights, badges, secondary actions
- **Accent**: Emphasis, special items

### Tone & Messaging
- Warm and welcoming
- Community-focused
- Action-oriented
- Hopeful and positive

### Visual Hierarchy
1. Headers/Titles
2. Main content
3. Supporting information
4. Background/Decorative

---

## Dark Mode Implementation

All color tokens have dark mode versions defined in `.dark` class:
```css
.dark {
  --background: oklch(0.14 0 0);
  --primary: oklch(0.62 0.167 142.5);
  --secondary: oklch(0.88 0.165 96.5);
  /* ... more tokens ... */
}
```

Toggle with `dark:` class in Tailwind or by adding `.dark` class to `<html>`.

---

## Common Patterns

### Success State
- Green text color
- Checkmark icon
- Subtle green background

### Error State
- Red text color
- Error icon
- Red/pink background
- Clear error message

### Loading State
- Spinner animation
- Disabled interactions
- Progress indication

### Empty State
- Icon representation
- Clear messaging
- Call-to-action suggestion

---

## Performance Notes

- All animations use CSS (GPU accelerated)
- Minimal JavaScript animations
- Optimized color values using oklch
- Efficient class usage with Tailwind
- No unnecessary libraries
- Lazy loading for images

---

This design guide ensures consistency across the application while maintaining flexibility for future enhancements.

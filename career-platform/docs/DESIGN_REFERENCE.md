# PivotAI Career Platform - Cloud Sky Design System

## Overview
PivotAI is a career platform that helps candidates with resume analysis and career roadmap generation. The application follows a dynamic scrolling cloudy sky theme using Tailwind CSS for styling and Next.js for the frontend framework. The design evokes a sense of possibility, elevation, and career growth through cloud imagery and sky-inspired color transitions.

## Color Palette

### Primary Colors
- **Sky Blue**: Used for primary actions, navigation, and branding
  - Deep sky: `bg-sky-700` (#0369a1)
  - Medium sky: `bg-sky-500` (#0ea5e9)
  - Hover sky: `bg-sky-600` (#0284c7)
  - Light sky: `bg-sky-200` (#bae6fd)
  - Lightest sky: `bg-sky-100` (#e0f2fe)

### Secondary Colors
- **Sunset**: Used for destructive actions, warnings and highlights
  - Sunset orange: `bg-amber-500` (#f59e0b)
  - Hover sunset: `bg-amber-600` (#d97706)
  - Light sunset: `bg-amber-100` (#fef3c7)

### Neutral Colors
- **Cloud**: Used for text, backgrounds, and borders
  - Background: `bg-slate-100` (#f1f5f9) with dynamic gradient overlays
  - Card background: `bg-white/80` (#ffffff with 80% opacity) with frosted glass effect
  - Text primary: `text-slate-800` (#1e293b)
  - Text secondary: `text-slate-600` (#475569)
  - Text tertiary: `text-slate-400` (#94a3b8)
  - Border: `border-slate-200` (#e2e8f0)

### Accent Colors
- **Rain**: Used for success states and completed items
  - Rain blue: `bg-blue-500` (#3b82f6)
  - Text blue: `text-blue-600` (#2563eb)
- **Sun**: Used for highlights and important elements
  - Sun yellow: `bg-yellow-400` (#facc15)
  - Text yellow: `text-yellow-500` (#eab308)

## Typography

### Font Family
- Primary font: 'Cumulus', sans-serif (system UI font stack with custom name)
- Secondary font: 'Cirrus', serif (for accent text)

### Font Sizes
- Extra large (page titles): `text-4xl` (2.25rem)
- Large (section headers): `text-2xl` (1.5rem)
- Medium (subsection headers): `text-xl` (1.25rem)
- Default (body text): `text-base` (1rem)
- Small (secondary text): `text-sm` (0.875rem)
- Extra small (labels, captions): `text-xs` (0.75rem)

### Font Weights
- Bold: `font-bold` (700)
- Semi-bold: `font-semibold` (600)
- Medium: `font-medium` (500)
- Normal: `font-normal` (400)
- Light: `font-light` (300) - for airy, cloud-like text effects

## Layout Components

### Navbar
- Fixed at the top of the page with subtle cloud animation
- Contains logo (cloud-shaped), navigation links, and user information
- Responsive design with floating cloud hamburger menu
- Background: `bg-gradient-to-r from-sky-500 to-sky-700` with `backdrop-filter blur-lg`
- Height: `h-20` (5rem)
- Shadow: `shadow-lg shadow-sky-500/20`

### Main Content Area
- Parallax scrolling effect with clouds that move at different speeds
- Centered with maximum width: `max-w-6xl`
- Padding: `p-8`
- Background: Dynamic gradient transitioning from `bg-gradient-to-b from-sky-100 via-sky-50 to-slate-100`
- Min height: `min-h-screen`

### Cards
- Background: `bg-white/80` with `backdrop-filter blur-md`
- Border radius: `rounded-2xl`
- Shadow: `shadow-xl shadow-sky-200/50`
- Padding: `p-6`
- Margin bottom: `mb-8`
- Border: `border border-slate-100`
- Hover effect: Subtle floating animation `hover:translate-y-[-5px] transition-transform`

## UI Components

### Buttons
- **Primary Button**:
  - Background: `bg-gradient-to-r from-sky-500 to-sky-600`
  - Hover: `bg-gradient-to-r from-sky-600 to-sky-700`
  - Text color: `text-white`
  - Padding: `px-6 py-3`
  - Border radius: `rounded-full`
  - Font weight: `font-medium`
  - Shadow: `shadow-md shadow-sky-500/30`
  - Transition: `transition-all duration-300`

- **Destructive Button**:
  - Background: `bg-gradient-to-r from-amber-500 to-amber-600`
  - Hover: `bg-gradient-to-r from-amber-600 to-amber-700`
  - Text color: `text-white`
  - Padding: `px-6 py-3`
  - Border radius: `rounded-full`
  - Font weight: `font-medium`
  - Shadow: `shadow-md shadow-amber-500/30`

- **Secondary Button**:
  - Background: `bg-white/90`
  - Border: `border border-sky-200`
  - Hover: `bg-sky-50/90`
  - Text color: `text-sky-700`
  - Padding: `px-6 py-3`
  - Border radius: `rounded-full`
  - Font weight: `font-medium`
  - Shadow: `shadow-sm shadow-sky-200/30`

### Form Elements
- **Input Fields**:
  - Background: `bg-white/70`
  - Border: `border border-slate-200`
  - Focus: `focus:ring-2 focus:ring-sky-400 focus:border-sky-400`
  - Border radius: `rounded-xl`
  - Padding: `p-3`
  - Width: `w-full`
  - Shadow inner: `shadow-inner shadow-slate-100`

- **Labels**:
  - Font weight: `font-medium`
  - Text color: `text-slate-700`
  - Margin bottom: `mb-2`
  - Font size: `text-sm`
  - Text transform: `tracking-wide`

- **Error Messages**:
  - Text color: `text-amber-600`
  - Font size: `text-sm`
  - Margin top: `mt-2`
  - Icon: Small cloud with lightning

### Loading States
- **Spinner**:
  - Animation: `animate-spin`
  - Border: `border-t-2 border-b-2 border-sky-500`
  - Size: `h-12 w-12`
  - Border radius: `rounded-full`
  - Additional: Cloud wisp animation around spinner

### Progress Indicators
- **Progress Bar**:
  - Background: `bg-slate-200/60`
  - Fill: `bg-gradient-to-r from-sky-400 to-sky-600`
  - Height: `h-4`
  - Border radius: `rounded-full`
  - Animation: Subtle flowing gradient animation

## Page-Specific Design Elements

### Dashboard
- Welcome section with user name and floating cloud illustrations
- Cards with soft shadows that appear to float above the background
- Quick access buttons with cloud hover effects
- Weather-themed status indicators for different features

### Career Roadmap
- Sky-to-horizon timeline visualization resembling altitude/flight path
- Cloud-shaped milestone markers at different heights
- Progress indicator showing career "altitude" as a percentage
- Interactive milestone clouds with completion toggle
- Resource links with cloud-themed icons

### Profile Page
- Resume upload with cloud storage visualization
- Resume analysis with animated rain/sunshine metrics
- Profile information display with layered cloud backgrounds

### Job Preferences
- Form-based interface with floating label animations
- Multi-select dropdowns appearing like expanding clouds
- Radio buttons designed as sun/moon toggles for preferences

## Animations & Effects

### Cloud Animations
- **Background Clouds**: Large, slow-moving clouds in the background (parallax effect)
- **Foreground Clouds**: Smaller, faster-moving clouds in the foreground
- **Interactive Clouds**: Cloud elements that react to hover/click
- **Weather Effects**: Occasional subtle rain or sunshine animations based on user achievements

### Scroll Effects
- Parallax scrolling with multi-layered clouds
- Content cards that float up as they enter the viewport
- Section transitions with altitude/cloud-density changes

## Responsive Design Breakpoints

- **Mobile**: Default styles with vertical stacking and simplified cloud effects
- **Tablet**: `md:` prefix (768px and above) with richer animations
- **Desktop**: `lg:` prefix (1024px and above) with full parallax effects
- **Large Desktop**: `xl:` prefix (1280px and above) with maximum cloud density

## Icons
- Cloud-themed custom SVG icon set
- Weather and sky elements incorporated into functional icons
- Common icon sizes: `h-6 w-6` or `h-8 w-8`
- Animation: Subtle floating or pulse effects on hover

## Animation
- Element transitions: `transition-all duration-300`
- Loading spinner: `animate-spin` with cloud wisps
- Cloud movements: CSS animations with varying durations (20s-120s)
- Button hover: Scale and glow effects

## Accessibility
- Appropriate color contrast ratios despite cloud theme
- Focus states with sky-blue outlines for interactive elements
- Screen reader compatible markup and aria labels
- Reduced motion option that disables parallax and complex animations
- Semantic HTML structure

## Design Patterns
- Layered UI with cloud-based depth perception
- Consistent floating card pattern for content
- Clear visual hierarchy using altitude metaphor
- Weather-inspired status indicators
- Mobile-first responsive design with progressive enhancement
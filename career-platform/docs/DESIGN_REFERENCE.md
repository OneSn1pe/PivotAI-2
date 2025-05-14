# PivotAI Career Platform - Design Reference

## Overview
PivotAI is a career platform that helps candidates with resume analysis and career roadmap generation. The application follows a modern, clean design approach using Tailwind CSS for styling and Next.js for the frontend framework.

## Color Palette

### Primary Colors
- **Blue**: Used for primary actions, navigation, and branding
  - Primary blue: `bg-blue-700` (#1d4ed8)
  - Light blue: `bg-blue-500` (#3b82f6)
  - Hover blue: `bg-blue-600` (#2563eb)
  - Lightest blue: `bg-blue-100` (#dbeafe)

### Secondary Colors
- **Red**: Used for destructive actions and errors
  - Primary red: `bg-red-600` (#dc2626)
  - Hover red: `bg-red-700` (#b91c1c)
  - Light red: `bg-red-100` (#fee2e2)

### Neutral Colors
- **Gray**: Used for text, backgrounds, and borders
  - Background: `bg-gray-100` (#f3f4f6)
  - Card background: `bg-white` (#ffffff)
  - Text primary: `text-gray-800` (#1f2937)
  - Text secondary: `text-gray-600` (#4b5563)
  - Text tertiary: `text-gray-400` (#9ca3af)
  - Border: `border-gray-200` (#e5e7eb)

### Accent Colors
- **Green**: Used for success states and completed items
  - Primary green: `bg-green-500` (#22c55e)
  - Text green: `text-green-600` (#16a34a)

## Typography

### Font Family
- Default font: System UI font stack
- No custom fonts are currently used

### Font Sizes
- Extra large (page titles): `text-3xl` (1.875rem)
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

## Layout Components

### Navbar
- Fixed at the top of the page
- Contains logo, navigation links, and user information
- Responsive design with mobile hamburger menu
- Background color: `bg-blue-700`
- Height: `h-16` (4rem)

### Main Content Area
- Centered with maximum width: `max-w-6xl`
- Padding: `p-6`
- Background color: `bg-gray-100`
- Min height: `min-h-screen`

### Cards
- Background: `bg-white`
- Border radius: `rounded-lg`
- Shadow: `shadow-lg`
- Padding: `p-6`
- Margin bottom: `mb-6`

## UI Components

### Buttons
- **Primary Button**:
  - Background: `bg-blue-600`
  - Hover: `bg-blue-700`
  - Text color: `text-white`
  - Padding: `px-4 py-2`
  - Border radius: `rounded-md` or `rounded-lg`
  - Font weight: `font-medium`

- **Destructive Button**:
  - Background: `bg-red-600`
  - Hover: `bg-red-700`
  - Text color: `text-white`
  - Padding: `px-4 py-2`
  - Border radius: `rounded-md`
  - Font weight: `font-medium`

- **Secondary Button**:
  - Background: `bg-white`
  - Border: `border border-gray-300`
  - Hover: `bg-gray-50`
  - Text color: `text-gray-700`
  - Padding: `px-4 py-2`
  - Border radius: `rounded-md`
  - Font weight: `font-medium`

### Form Elements
- **Input Fields**:
  - Border: `border border-gray-300`
  - Focus: `focus:ring-2 focus:ring-blue-500 focus:border-blue-500`
  - Border radius: `rounded`
  - Padding: `p-2`
  - Width: `w-full`

- **Labels**:
  - Font weight: `font-medium`
  - Text color: `text-gray-700`
  - Margin bottom: `mb-1`
  - Font size: `text-sm`

- **Error Messages**:
  - Text color: `text-red-600`
  - Font size: `text-sm`
  - Margin top: `mt-1`

### Loading States
- **Spinner**:
  - Animation: `animate-spin`
  - Border: `border-t-2 border-b-2 border-blue-500`
  - Size: `h-12 w-12`
  - Border radius: `rounded-full`

### Progress Indicators
- **Progress Bar**:
  - Background: `bg-gray-200`
  - Fill: `bg-blue-600`
  - Height: `h-3`
  - Border radius: `rounded-full`

## Page-Specific Design Elements

### Dashboard
- Welcome section with user name
- Cards for different features
- Quick access buttons to key functionality

### Career Roadmap
- Timeline visualization of milestones
- Progress indicator showing completion percentage
- Interactive milestone cards with completion toggle
- Resource links with appropriate icons

### Profile Page
- Resume upload and management
- Resume analysis visualization
- Profile information display

### Job Preferences
- Form-based interface for setting preferences
- Multi-select dropdowns for industries and roles
- Radio buttons for remote work preferences

## Responsive Design Breakpoints

- **Mobile**: Default styles
- **Tablet**: `md:` prefix (768px and above)
- **Desktop**: `lg:` prefix (1024px and above)
- **Large Desktop**: `xl:` prefix (1280px and above)

## Icons
- SVG icons are used throughout the application
- Icons are inline SVG elements with appropriate sizing
- Common icon sizes: `h-5 w-5` or `h-6 w-6`

## Animation
- Button hover transitions: `transition-colors`
- Loading spinner: `animate-spin`
- Mobile menu transitions (not explicitly defined)

## Accessibility
- Appropriate color contrast ratios
- Focus states for interactive elements
- Screen reader compatible markup
- Semantic HTML structure

## Design Patterns
- Card-based UI for content organization
- Consistent spacing and alignment
- Clear visual hierarchy
- Mobile-first responsive design 
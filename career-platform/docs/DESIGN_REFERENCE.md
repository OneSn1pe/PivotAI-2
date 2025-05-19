# PivotAI Career Quest - Modern Design System

## Overview
PivotAI Career Quest transforms career development into an engaging, goal-oriented experience. Users become "Career Professionals" who enhance their skills, complete career objectives, and track achievements on their journey to professional growth. The platform reimagines job searching and career development as a structured path with the user as the central focus of their own professional development journey.

## Core Platform Mechanics

### Profile System
- **Career Paths**: Users select a professional focus (Technology, Business, Creative, etc.)
- **Professional Attributes**: Six core professional metrics with visual indicators
  - **Knowledge**: Learning capacity and specialized expertise
  - **Communication**: Networking and interpersonal abilities
  - **Execution**: Project management and deadline adherence
  - **Adaptability**: Problem-solving and flexibility
  - **Strategy**: Decision-making and long-term planning
  - **Balance**: Work-life integration and wellbeing
- **Career Level**: Overall professional development tier (1-60)
- **Progress Points**: Earned through completing tasks, updating skills, and career milestones

### Objective System
- **Major Objectives**: Significant career milestones (certification completion, job applications, interviews)
- **Minor Objectives**: Smaller professional development tasks (networking events, skill-building)
- **Daily Tasks**: Regular career maintenance activities (application follow-ups, learning tasks)
- **Task Manager**: Organized objective tracking with reward indicators and deadlines
- **Progress Paths**: Series of related professional development activities

### Progression System
- **Skill Framework**: Visual skill development paths with branching specializations
- **Accomplishments**: Badges and credentials for career achievements
- **Resources**: Professional templates, tools, and learning materials
- **Specialization**: Focus areas within specific career domains

## Color Palette

### Primary Colors
- **Deep Teal**: Used for primary actions and main UI elements
  - Deep teal: `#134e4a` (equivalent to tailwind: `teal-900`)
  - Medium teal: `#0f766e` (equivalent to tailwind: `teal-700`)
  - Hover teal: `#115e59` (equivalent to tailwind: `teal-800`)
  - Light teal: `#99f6e4` (equivalent to tailwind: `teal-200`)
  - Lightest teal: `#ccfbf1` (equivalent to tailwind: `teal-100`)

### Secondary Colors
- **Warm Amber**: Used for achievements, rewards and premium features
  - Rich amber: `#d97706` (equivalent to tailwind: `amber-600`)
  - Hover amber: `#b45309` (equivalent to tailwind: `amber-700`)
  - Light amber: `#fef3c7` (equivalent to tailwind: `amber-100`)

### Attribute Colors
- **Knowledge**: `#3b82f6` (equivalent to tailwind: `blue-500`)
- **Communication**: `#8b5cf6` (equivalent to tailwind: `violet-500`)
- **Execution**: `#ef4444` (equivalent to tailwind: `red-500`) 
- **Adaptability**: `#10b981` (equivalent to tailwind: `emerald-500`)
- **Strategy**: `#6366f1` (equivalent to tailwind: `indigo-500`)
- **Balance**: `#f97316` (equivalent to tailwind: `orange-500`)

### UI Colors
- **Task Dashboard**: `#f8fafc` (equivalent to tailwind: `slate-50`) with `#e2e8f0` (equivalent to tailwind: `slate-200`) borders
- **Profile Page**: `#f1f5f9` (equivalent to tailwind: `slate-100`) with `#cbd5e1` (equivalent to tailwind: `slate-300`) borders
- **Analytics Background**: `#334155` (equivalent to tailwind: `slate-700`) with interactive data points
- **Resource Library**: `#f3f4f6` (equivalent to tailwind: `gray-100`) with `#e5e7eb` (equivalent to tailwind: `gray-200`) borders
- **Community/Networking**: `#eef2ff` (equivalent to tailwind: `indigo-50`) with `#c7d2fe` (equivalent to tailwind: `indigo-200`) borders

## Typography

### Font Family
- Primary font: 'Inter', sans-serif (clean, modern font for headers)
- Secondary font: 'Source Sans Pro', sans-serif (readable font for body text)

### Font Sizes
- Page Headers: `2.25rem` (equivalent to tailwind: `text-4xl`) with subtle emphasis
- Dashboard Metrics: `1.5rem` (equivalent to tailwind: `text-2xl`) with icon accompaniment
- Objective Titles: `1.25rem` (equivalent to tailwind: `text-xl`) with completion indicators
- Body Text: `1rem` (equivalent to tailwind: `text-base`) for readable instructions
- Metrics and Data: `0.875rem` (equivalent to tailwind: `text-sm`) for numerical values
- Supporting Text: `0.75rem` (equivalent to tailwind: `text-xs`) for additional information

### Font Treatments
- Section headers: Subtle weight emphasis with letter-spacing
- Achievement notifications: Highlighted with accent color
- Level-up notifications: Clean, elevated card with subtle animation
- Premium content indicators: Accent color with subtle icon

## Layout Components

### Main Interface
- Clean, modern fixed components with responsive layout
- Profile snapshot and level in sidebar or header area
- Progress visualization in dashboard header
- Quick-access toolbar with common functions
- Task tracker persistently visible in sidebar

### Profile Dashboard
- Full-page layout with tabbed interface
- Professional metrics displayed as clean progress bars
- Skill visualization using modern node graphs
- Portfolio and resume section with categorized entries
- Achievement display with earned credentials

### Task Manager
- Clean, minimal scrollable interface
- Categorized objectives (Major, Minor, Daily)
- Task cards with objectives, outcomes, and priority indicators
- Progress indicators for multi-stage objectives
- Completion animations that are subtle and professional

### Networking Hub
- Professional networking interface
- Industry-specific groups to join
- Mentor/mentee matching system
- Professional reputation metrics
- Connection recommendations

### Career Roadmap
- Career journey visualized as interactive flowchart
- Different sections representing industry sectors
- Discovered job opportunities appear as cards
- Quick-access to previously explored career milestones
- Progressive disclosure for unexplored career areas

## UI Components

### Buttons
- **Primary Action Button**:
  - Background: `#0f766e` (teal-700)
  - Hover: `#115e59` (teal-800)
  - Text color: `#ffffff` (white)
  - Border: minimal or none
  - Border radius: `0.375rem` (rounded-md)
  - Text: Sentence case with medium weight
  - Hover effect: Subtle depth change

- **Task Accept Button**:
  - Background: `#d97706` (amber-600)
  - Hover: `#b45309` (amber-700)
  - Icon: Subtle check or plus icon
  - Border: none or subtle

- **Secondary Button**:
  - Background: `#f1f5f9` (slate-100)
  - Border: `#cbd5e1` (slate-300)
  - Hover: `#e2e8f0` (slate-200)
  - Text color: `#334155` (slate-700)
  - Style: Clean with subtle hover state

### Progress Indicators
- **Progress Bar**:
  - Background: `#e2e8f0` (slate-200)
  - Fill: `linear-gradient(to right, #0d9488, #14b8a6)` (teal-600 to teal-500)
  - Border: none
  - Animation: Subtle transition for updates
  - Tooltip: Shows exact progress percentage on hover

- **Skill Progress**:
  - Clean circular progress indicators
  - Background: `#f1f5f9` (slate-100)
  - Fill: Color-coded to skill type
  - Animation: Smooth fill animation

- **Task Progress**:
  - Step-based indicators for multi-stage tasks
  - Connected nodes with completed/current/pending states
  - Background: `#f1f5f9` (slate-100)
  - Completed: `#10b981` (emerald-500) with check icon
  - Current: `#0ea5e9` (sky-500) with subtle emphasis
  - Pending: `#e2e8f0` (slate-200)

### Metric Visualizations
- **Attribute Bars**:
  - Horizontal progress bars for each attribute
  - Background: `#f1f5f9` (slate-100)
  - Fill: Color-coded to attribute
  - Border: none
  - Value display: Current/Max (e.g., "75/100")
  - Improvement indicators showing growth potential

### Resource Library
- **Resume Components**:
  - Clean card-based layout with categorization
  - Basic: subtle border
  - Intermediate: subtle accent border
  - Advanced: medium accent border
  - Expert: prominent accent border
  - Premium: accent border with subtle highlight

- **Skill Indicators**:
  - Modern tag/chip design
  - Color-coded by skill category
  - Hover effects with skill description tooltip
  - Active/Inactive visual states

### Notification Elements
- **Task Dialog**:
  - Background: Clean white `#ffffff`
  - Border: Subtle `#e2e8f0` (slate-200)
  - Clean layout with clear hierarchy
  - Text appears with fade-in effect
  - Accept/Decline actions clearly displayed

- **Level-Up Notification**:
  - Elegant modal with `rgba(255,255,255,0.95)` background
  - Clean "Level Up" header with accent color
  - Metric increases displayed with before/after values
  - New capabilities highlighted
  - Subtle, professional animation

- **Achievement Alert**:
  - Minimal toast notification with `#ffffff` background
  - Simple icon with achievement name
  - Progress points reward displayed
  - Clean slide-in animation

## Engagement Features

### Onboarding System
- Interactive onboarding walkthrough with helpful tooltips
- Step-by-step introduction to platform features
- Contextual hints that appear for first-time feature usage
- "Skip Tour" option for experienced users
- Completion incentives to encourage full onboarding

### Retention Elements
- Streak tracking for consistent platform usage
- Daily objectives that refresh every 24 hours
- "Momentum boost" for returning users
- Weekly focus areas with enhanced outcomes

### Community Features
- Professional groups for networking
- Team formation for collaborative projects
- Mentor/mentee matching with mutual benefits
- Industry-specific leaderboards
- Group preparation for interviews and presentations

### Reward Systems
- **Points**: Professional development points for resource access
- **Resources**: Curated professional resources upon task completion
- **Achievement Tracking**: Progress measurement across all activities
- **Credentials**: Verifiable professional credentials displayed on profile
- **Visualizations**: Progress tracking representing career milestones

## Animation & Effects

### Interface Animations
- Subtle transitions between states
- Modest completion animations
- Level-up transition effect
- Path-specific visual elements

### Visual Feedback
- Clean, minimal loading states
- Success/error states with appropriate colors
- Progress visualization that updates in real-time
- Day/night mode representing user preferences

### UI Transitions
- Button hover effects with subtle state changes
- Task acceptance with clean confirmation
- Menu transitions with professional animation
- Notification effects with appropriate iconography

## Responsive Design

- **Mobile**: Streamlined interface with collapsible panels
- **Tablet**: Dual-panel layout with profile and task manager
- **Desktop**: Full interface with all elements appropriately placed
- **Large Desktop**: Enhanced data visualization and expanded roadmap

## Accessibility Features
- High contrast mode with enhanced readability
- Screen reader compatible task descriptions and instructions
- Customizable UI scaling and text size
- Option to reduce animations and effects
- Keyboard navigation support

## Page-Specific Elements

### Dashboard (Main Hub)
- Clean, organized hub with metrics and quick access panels
- Quick-access cards to different sections (Resume Builder, Job Search, etc.)
- Daily task list with priority indicators
- Notification center for updates and messages
- Activity log showing recent progress and milestones

### Career Roadmap (Skill Framework)
- Interactive career path visualization with node-based design
- Skill development system with connecting modules
- Path selection with branching options
- Progressive disclosure for specialized skills
- Location-based opportunities tied to job listings

### Profile Page
- Clean profile visualization with professional metrics
- Detailed attribute breakdown with tooltips
- Progress log showing history of earned points
- Achievement gallery with earned credentials
- Industry reputation metrics

### Job Applications (Opportunity Board)
- Job opportunities displayed as clean, modern cards
- Difficulty/match rating from 1-5 indicators
- Required skills/level listed as prerequisites
- Expected outcomes (salary, benefits) clearly displayed
- Application status with visual progress tracker

### Resume Builder
- Modern interface for building resume components
- Skill tag system for resume customization
- Preview mode showing completed resume
- Experience collection representing professional history
- Optimization system for improving existing resume components

## Technical Implementation Notes
- React components for modular UI elements
- Tailwind CSS for styling with custom atmospheric color extensions
- Local storage for saving progress and preferences
- Framer Motion for subtle, professional animations
- SVG assets for scalable, modern UI elements
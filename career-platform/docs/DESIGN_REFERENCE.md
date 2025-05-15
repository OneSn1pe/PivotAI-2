# PivotAI Career Quest - MMORPG Design System

## Overview
PivotAI Career Quest transforms the original cloud-themed career platform into an immersive MMORPG experience where career development becomes an epic adventure. Users become "Career Adventurers" who level up their professional skills, complete career quests, and unlock achievements on their journey to professional mastery. The platform reimagines job searching and career development as a heroic journey with the user as the protagonist of their own professional saga.

## Core Game Mechanics

### Character System
- **Character Classes**: Users select a professional archetype (Tech Wizard, Business Paladin, Creative Bard, etc.)
- **Character Stats**: Six core professional attributes with visual meters
  - **Intelligence**: Knowledge-based skills and learning capacity
  - **Charisma**: Communication and networking abilities
  - **Strength**: Project execution and deadline management
  - **Dexterity**: Adaptability and quick problem-solving
  - **Wisdom**: Decision-making and strategic thinking
  - **Constitution**: Work-life balance and burnout resistance
- **Character Level**: Overall professional development level (1-60)
- **Experience Points (XP)**: Earned through completing tasks, updating skills, and career milestones

### Quest System
- **Main Quests**: Major career milestones (certification completion, job applications, interviews)
- **Side Quests**: Smaller professional development tasks (networking events, skill-building)
- **Daily Quests**: Regular career maintenance activities (application follow-ups, learning tasks)
- **Quest Journal**: Organized task management with quest rewards and deadlines
- **Quest Chains**: Series of related professional development activities

### Progression System
- **Skill Trees**: Visual skill development paths with branching specializations
- **Achievements**: Badges and titles for career accomplishments
- **Unlockables**: Professional templates, resources, and tools
- **Profession Mastery**: Specialization in specific career domains

## Color Palette

### Primary Colors
- **Epic Purple**: Used for primary actions and main UI elements
  - Deep purple: `bg-purple-900` (#4c1d95)
  - Medium purple: `bg-purple-700` (#7e22ce)
  - Hover purple: `bg-purple-800` (#6b21a8)
  - Light purple: `bg-purple-200` (#e9d5ff)
  - Lightest purple: `bg-purple-100` (#f3e8ff)

### Secondary Colors
- **Guild Gold**: Used for achievements, rewards and premium features
  - Rich gold: `bg-amber-500` (#f59e0b)
  - Hover gold: `bg-amber-600` (#d97706)
  - Light gold: `bg-amber-100` (#fef3c7)

### Attribute Colors
- **Intelligence**: `bg-blue-500` (#3b82f6)
- **Charisma**: `bg-pink-500` (#ec4899)
- **Strength**: `bg-red-500` (#ef4444)
- **Dexterity**: `bg-green-500` (#22c55e)
- **Wisdom**: `bg-indigo-500` (#6366f1)
- **Constitution**: `bg-orange-500` (#f97316)

### UI Colors
- **Quest Log**: `bg-amber-50` (#fffbeb) with `border-amber-200` (#fde68a)
- **Character Sheet**: `bg-slate-50` (#f8fafc) with `border-slate-200` (#e2e8f0)
- **Map Background**: `bg-slate-800` (#1e293b) with interactive hotspots
- **Inventory**: `bg-gray-100` (#f3f4f6) with `border-gray-200` (#e5e7eb)
- **Chat/Guild**: `bg-indigo-50` (#eef2ff) with `border-indigo-200` (#c7d2fe)

## Typography

### Font Family
- Primary font: 'QuestFont', fantasy (stylized gaming font for headers)
- Secondary font: 'AdventurerSans', sans-serif (readable font for body text)

### Font Sizes
- Quest Titles: `text-4xl` (2.25rem) with decorative fantasy styling
- Character Stats: `text-2xl` (1.5rem) with icon accompaniment
- Quest Objectives: `text-xl` (1.25rem) with completion indicators
- Body Text: `text-base` (1rem) for readable instructions
- Stats and Meters: `text-sm` (0.875rem) for numerical values
- Tooltips: `text-xs` (0.75rem) for additional information

### Font Effects
- Quest headers: Subtle glow effect with `text-shadow`
- Achievement text: Gold gradient with sparkle animation
- Level-up text: Pulsing highlight animation
- Legendary items: Rainbow gradient animation

## Layout Components

### Main Game Interface
- Game HUD-style fixed components with medieval/fantasy styling
- Character portrait and level in top-left corner
- Mini-map in top-right corner showing career progression
- Action bar with quick-access abilities at bottom of screen
- Quest tracker persistently visible on right side

### Character Sheet
- Full-page modal with tabbed interface
- Character stats displayed as medieval-style meters
- Skill trees visualized as interconnected constellations
- Equipment slots for "gear" (resume templates, portfolio pieces)
- Achievement display with unlocked badges and titles

### Quest Journal
- Parchment-styled scrollable interface
- Categorized quests (Main, Side, Daily)
- Quest cards with objectives, rewards, and difficulty rating
- Progress indicators for multi-stage quests
- Animated completion effects

### Guild Hall/Networking
- Social space featuring connection opportunities
- Industry-specific "guilds" to join
- Mentor/mentee system with "party" formation
- Guild reputation meters and rank

### World Map
- Career journey visualized as fantasy world map
- Different regions representing industry sectors
- Discovered job opportunities appear as location markers
- Fast-travel to previously visited career milestones
- Fog of war effect for unexplored career areas

## UI Components

### Buttons
- **Primary Action Button**:
  - Background: `bg-gradient-to-r from-purple-600 to-purple-800`
  - Hover: `bg-gradient-to-r from-purple-700 to-purple-900`
  - Text color: `text-white`
  - Border: `border-2 border-purple-300`
  - Border radius: `rounded-lg`
  - Decoration: Fantasy-styled corners with subtle glow effect
  - Text: ALL CAPS with letterpress effect
  - Hover effect: Subtle pulse animation

- **Quest Accept Button**:
  - Background: `bg-gradient-to-r from-amber-400 to-amber-600`
  - Hover: `bg-gradient-to-r from-amber-500 to-amber-700`
  - Icon: Scroll with exclamation mark
  - Border: Ornate golden border

- **Secondary Button**:
  - Background: `bg-slate-700`
  - Border: `border border-slate-500`
  - Hover: `bg-slate-600`
  - Text color: `text-slate-200`
  - Style: Metal-plated appearance

### Progress Indicators
- **XP Bar**:
  - Background: `bg-slate-800`
  - Fill: `bg-gradient-to-r from-purple-500 via-purple-400 to-purple-600`
  - Border: `border-2 border-slate-600`
  - Animation: Pulsing glow when near level-up
  - Tooltip: Shows exact XP numbers on hover

- **Skill Progress**:
  - Circular progress indicators with fantasy styling
  - Background: `bg-slate-700`
  - Fill: Color-coded to skill type
  - Animation: Fills clockwise with particle effects

- **Quest Progress**:
  - Step-based indicators for multi-stage quests
  - Connected nodes with completed/current/locked states
  - Background: `bg-amber-100`
  - Completed: `bg-amber-500` with check mark
  - Current: `bg-amber-300` with pulsing glow
  - Locked: `bg-gray-400` with lock icon

### Stat Meters
- **Attribute Bars**:
  - Vertical or horizontal meters for each stat
  - Background: `bg-slate-700`
  - Fill: Color-coded to attribute
  - Border: Ornate styling specific to attribute
  - Value display: Current/Max (e.g., "75/100")
  - Level-up indicators showing increase potential

### Inventory/Collection System
- **Resume Components**:
  - Inventory slots with rarity-based borders
  - Common: `border-gray-400`
  - Uncommon: `border-green-400`
  - Rare: `border-blue-400`
  - Epic: `border-purple-400`
  - Legendary: `border-amber-400` with animated glow

- **Skill Badges**:
  - Hexagonal grid layout
  - Color-coded by skill category
  - Hover effects with skill description tooltip
  - Locked/Unlocked visual states

### Dialog Boxes
- **Quest Dialog**:
  - Background: Parchment texture with `bg-amber-50`
  - Border: `border-4 border-amber-800` with ornate corners
  - Character portrait on left
  - Text appears with typewriter effect
  - Accept/Decline buttons at bottom

- **Level-Up Notification**:
  - Full-screen overlay with `bg-black/70`
  - Large animated "LEVEL UP!" text with glow effects
  - Stat increases displayed with before/after values
  - New abilities/unlocks showcased
  - Particle effects and triumphant sound

- **Achievement Alert**:
  - Toast notification from top with `bg-amber-100`
  - Trophy icon with achievement name
  - XP reward displayed
  - Confetti animation

## Gamified Features

### Tutorial System
- Interactive tutorial quest line with "Guide" NPC
- Step-by-step introduction to platform features
- Tooltips that appear for first-time feature usage
- "Skip Tutorial" option for experienced users
- Tutorial rewards to encourage completion

### Daily Engagement
- Login rewards with increasing value for consecutive days
- Daily quests that refresh every 24 hours
- "Rested XP" bonus for returning users
- Weekly challenges with premium rewards

### Social Features
- "Guild" system for professional networking groups
- Party formation for collaborative projects
- Mentor/mentee matchmaking with XP bonuses
- Leaderboards for specific skills or industries
- "Raid" events for group interview preparation

### Reward Systems
- **Currency**: "Career Coins" for marketplace purchases
- **Loot Drops**: Random skill resources after completing tasks
- **Achievement Points**: Meta-progression across all activities
- **Titles**: Unlockable professional titles displayed by username
- **Mounts/Pets**: Visual companions representing career milestones

## Animation & Effects

### Character Animations
- Idle animation when dashboard is inactive
- Victory pose on completing quests/achievements
- Level-up transformation effect
- Class-specific emotes and animations

### Environment Effects
- Dynamic background that evolves with career level
- Weather effects based on recent performance (sunny for success, stormy for challenges)
- Day/night cycle representing work/life balance
- Seasonal events tied to industry hiring cycles

### UI Animations
- Button hover effects with magical glow
- Quest acceptance with unfurling scroll animation
- Menu transitions with fantasy-themed effects
- Notification effects with appropriate iconography

## Responsive Design

- **Mobile**: Simplified HUD with expandable panels
- **Tablet**: Dual-panel layout with character sheet and quest log
- **Desktop**: Full immersive interface with all elements visible
- **Large Desktop**: Enhanced visual effects and expanded world map

## Accessibility Features
- High contrast mode with enhanced readability
- Alternative UI that maintains game mechanics without fantasy visuals
- Screen reader compatible quest descriptions and instructions
- Customizable UI scaling and text size
- Option to reduce animations and effects

## Game-Specific Page Elements

### Dashboard/Home (Main Hub)
- Character standing in central hub with NPCs representing different features
- Quick-access portal icons to different "zones" (Resume Builder, Job Search, etc.)
- Daily quest board with flashing available quests
- Mailbox for notifications and messages
- Adventure log showing recent activities and progress

### Career Roadmap (Skill Tree & World Map)
- Interactive fantasy world map with different regions for career paths
- Skill constellation system with connecting nodes
- Path selection with branching progression options
- Discoverable hidden areas representing niche skills
- Location-based "quests" tied to job opportunities

### Profile Page (Character Sheet)
- Full character visualization with equipped items
- Detailed stat breakdown with tooltips
- Experience log showing history of earned XP
- Achievement gallery with unlocked badges
- Reputation meters with different "factions" (industries)

### Job Applications (Quest Board)
- Job opportunities displayed as quest scrolls on a board
- Difficulty rating from 1-5 stars
- Required skills/level listed as prerequisites
- Expected rewards (salary, benefits) as quest rewards
- Application status with visual progress tracker

### Resume Builder (Gear & Equipment Forge)
- Crafting-style interface for building resume components
- Skill gems that can be slotted into resume template
- Preview mode showing completed "equipment"
- Material collection representing experiences and skills
- Upgrade system for improving existing resume components

## Technical Implementation Notes
- React components for modular UI elements
- Tailwind CSS for styling with custom fantasy-themed extensions
- Local storage for saving progress and preferences
- Animation libraries for complex effects (Framer Motion)
- SVG assets for scalable fantasy UI elements
# Daily Streak Tracker Documentation

## Overview

The daily streak tracker is a gamification feature designed to encourage consistent user engagement with the career platform. It tracks consecutive days of platform usage, rewards users with XP bonuses and achievements, and provides visual feedback through various UI components.

## Core Architecture

### Data Model

The streak system is built on the following data structures defined in `src/types/user.ts`:

```typescript
interface UserProgress {
  streakDays: number;        // Current consecutive days count
  lastActiveDate: Date;      // Last login/activity date
  longestStreak: number;     // Historical best streak
  // ... other progress fields
}
```

### Key Components

1. **StreakSystem Component** (`src/components/gamification/StreakSystem.tsx`)
   - Main streak visualization and management interface
   - Displays current streak, longest streak, and weekly goals
   - Shows streak milestones and rewards
   - Provides streak tips and benefits information

2. **MinimalStreakWidget** (`src/components/dashboard/MinimalStreakWidget.tsx`)
   - Compact dashboard widget showing streak stats
   - Weekly progress bar visualization
   - Days until next milestone counter
   - Multiplier information display

## How It Works

### 1. Streak Calculation Logic

The core streak logic is implemented in `src/services/progressTracking.ts`:

```typescript
updateDailyActivity() {
  const lastActive = userProgress.lastActiveDate;
  const today = new Date();
  const daysDiff = calculateDaysDifference(lastActive, today);
  
  if (daysDiff === 0) {
    // Same day - no update needed
    return;
  } else if (daysDiff === 1) {
    // Next day - increment streak
    userProgress.streakDays += 1;
    awardStreakBonus();
  } else {
    // More than 1 day gap - reset streak
    userProgress.streakDays = 1;
  }
  
  userProgress.lastActiveDate = today;
  checkStreakAchievements();
}
```

### 2. Streak Milestones & Rewards

The system recognizes the following milestone achievements:

| Days | Achievement | Rarity | XP Bonus |
|------|-------------|--------|----------|
| 3 | Getting Started | Common | 50 XP |
| 7 | Week Warrior | Uncommon | 100 XP |
| 14 | Fortnight Fighter | Uncommon | 150 XP |
| 30 | Dedication Master | Rare | 300 XP |
| 50 | Streak Champion | Epic | 500 XP |
| 100 | Unstoppable Force | Legendary | 1000 XP |

### 3. Daily XP Bonuses

- **Daily Streak Bonus**: 10 XP per day for maintaining streak
- **Weekly Goal Bonus**: 75 XP for completing 7-day weekly goal
- **Multiplier Effect**: Streak provides a learning multiplier calculated as `1 + (streakDays / 50)`, capping at 2x at 50+ days

### 4. Data Flow

1. **User Login** → Dashboard page loads (`src/app/protected/candidate/dashboard/page.tsx`)
2. **Streak Update** → `ProgressTrackingService.updateDailyActivity()` is called
3. **Calculation** → Service checks last active date and updates streak accordingly
4. **Persistence** → Updated data is saved to Firebase Firestore
5. **UI Update** → Components receive new streak data and re-render
6. **Achievement Check** → System checks if any streak milestones were reached

### 5. Storage & Persistence

Streak data is stored in Firebase Firestore:
- **Collection**: `userProgress`
- **Document**: User's UID
- **Fields**: `streakDays`, `lastActiveDate`, `longestStreak`

## UI Components Integration

### Dashboard Integration
The main dashboard (`src/app/protected/candidate/dashboard/page.tsx`) integrates the streak system by:
1. Fetching user progress data on mount
2. Calling `updateDailyActivity()` to update streak
3. Displaying `MinimalStreakWidget` with current streak data
4. Calculating and showing the streak multiplier effect

### Analytics Integration
The analytics page (`src/app/protected/candidate/analytics/page.tsx`) provides:
- Streak pattern visualization over time
- Consistency metrics
- Streak-based recommendations
- Historical streak data analysis

### Social Features
Users can share their streak achievements through the social page (`src/app/protected/candidate/social/page.tsx`), creating engagement and friendly competition.

## Key Functions & Services

### ProgressTrackingService (`src/services/progressTracking.ts`)
- `updateDailyActivity()`: Core streak update logic
- `checkStreakAchievements()`: Awards streak-based achievements
- `getStreakMultiplier()`: Calculates current streak bonus multiplier

### AchievementEngine (`src/services/achievementEngine.ts`)
- Defines all streak-related achievements
- Manages achievement unlocking and notifications

### LevelProgressService (`src/services/levelProgressService.ts`)
- Calculates XP from streak bonuses
- Applies streak multipliers to learning activities

## Visual Feedback

The streak system provides rich visual feedback through:
1. **Flame animations** for active streaks
2. **Progress bars** for weekly goals
3. **Milestone badges** with different rarities
4. **Celebration animations** when hitting milestones
5. **Color-coded indicators** (green for active, gray for broken)

## Best Practices

1. **Streak Recovery**: Currently, there's no streak recovery mechanism. A broken streak resets to 1.
2. **Time Zones**: The system uses local device time for day calculations.
3. **Performance**: Streak updates are throttled to once per day per user.
4. **Offline Support**: Streak data syncs when the user comes back online.

## Future Enhancements

Potential improvements could include:
- Streak freeze tokens for planned breaks
- Weekend mode with different requirements
- Team streaks for collaborative motivation
- Push notifications for streak reminders
- Streak recovery options (limited per month)

## Technical Details

- **Framework**: React with TypeScript
- **State Management**: React hooks and context
- **Database**: Firebase Firestore
- **Styling**: Tailwind CSS with custom animations
- **Icons**: Lucide React icons

The daily streak tracker is a core engagement feature that successfully combines gamification principles with practical learning motivation, encouraging users to maintain consistent platform usage through immediate rewards and long-term benefits.
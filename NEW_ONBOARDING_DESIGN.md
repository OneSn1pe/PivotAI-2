# New Onboarding Setup Wizard Design

## Overview

A comprehensive setup wizard that guides new users through the required onboarding steps in a structured, sequential manner with clear navigation and progress tracking.

## Design Philosophy

- **Setup Wizard Pattern**: Traditional wizard interface with discrete steps
- **Linear Navigation**: Next/Previous buttons with validation
- **Progress Tracking**: Step counter and progress bar
- **Required Fields**: Clear marking of mandatory vs optional fields
- **Completion Gates**: Cannot proceed without completing required fields

## Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  SETUP WIZARD                           │
├─────────────────────────────────────────────────────────┤
│  Step 1 of 5: Welcome                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  [Previous] [Next] [Save & Exit] [Help]                │
└─────────────────────────────────────────────────────────┘
```

### Wizard Components
- **Header**: Current step title and number
- **Progress Bar**: Visual completion indicator
- **Content Area**: Step-specific forms and inputs
- **Navigation Bar**: Previous/Next/Save buttons
- **Side Panel** (optional): Step list with completion status

## Step-by-Step Flow

### Step 1: Welcome & Overview
**Purpose**: Introduction and setup overview

#### Screen Layout
```
┌─────────────────────────────────────────────────────────┐
│ Setup Wizard - Step 1 of 5: Welcome                     │
├─────────────────────────────────────────────────────────┤
│ Progress: ▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 20%       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   Welcome to PivotAI Setup Wizard                      │
│   ─────────────────────────────────                    │
│                                                         │
│   This wizard will guide you through setting up your   │
│   account in 5 easy steps:                             │
│                                                         │
│   1. Welcome (current)                                  │
│   2. Upload Resume                                      │
│   3. Set Career Goals                                  │
│   4. Select Target Companies                            │
│   5. Configure Preferences                              │
│                                                         │
│   Total time: Approximately 5-7 minutes                 │
│                                                         │
│   □ Don't show this wizard on next login              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ [Cancel]                    [Skip Wizard] [Next Step →] │
└─────────────────────────────────────────────────────────┘
```

#### Wizard Features
- Step indicator in title
- Progress bar with percentage
- Navigation controls
- Option to skip entire wizard
- Cancel with confirmation dialog

### Step 2: Resume Upload
**Purpose**: Capture professional background

#### Screen Layout
```
┌─────────────────────────────────────────┐
│         Upload Your Resume (1/4)         │
│         ●  ○  ○  ○                      │
│                                          │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │    📄 Drag & drop your resume    │  │
│  │         or click to browse        │  │
│  │                                   │  │
│  │    Supports: PDF, DOC, DOCX      │  │
│  └───────────────────────────────────┘  │
│                                          │
│  💡 We'll analyze your skills to       │
│     provide personalized guidance       │
│                                          │
│  [← Back]    [Skip]    [Continue →]     │
└─────────────────────────────────────────┘
```

#### Smart Features
- LinkedIn import option (if signed in with LinkedIn)
- Resume parser with real-time feedback
- Auto-save draft
- Progress persists if user closes modal

### Step 3: Career Goals
**Purpose**: Understand user objectives

#### Screen Layout
```
┌─────────────────────────────────────────┐
│      Set Your Career Goals (2/4)        │
│         ●  ●  ○  ○                      │
│                                          │
│  What's your primary goal?              │
│  ┌─────────────────────────────────┐    │
│  │ ○ Land a new job                │    │
│  │ ○ Skill up for promotion        │    │
│  │ ○ Career transition             │    │
│  │ ○ Explore opportunities         │    │
│  └─────────────────────────────────┘    │
│                                          │
│  Target timeline:                        │
│  [────────●────] 6 months               │
│                                          │
│  Current status:                         │
│  ┌─────────────────────────────────┐    │
│  │ ○ Actively job searching        │    │
│  │ ○ Passively looking             │    │
│  │ ○ Preparing to search           │    │
│  └─────────────────────────────────┘    │
│                                          │
│  [← Back]              [Continue →]      │
└─────────────────────────────────────────┘
```

### Step 4: Target Companies & Roles
**Purpose**: Define specific targets

#### Screen Layout
```
┌─────────────────────────────────────────┐
│    Target Companies & Roles (3/4)       │
│         ●  ●  ●  ○                      │
│                                          │
│  Add your dream companies (up to 3):    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ 🏢 Company: [_______________]   │    │
│  │ 💼 Role: [_________________]    │    │
│  │ [+ Add Company]                 │    │
│  └─────────────────────────────────┘    │
│                                          │
│  Or let AI suggest based on your        │
│  profile:                               │
│                                          │
│  [🤖 Get AI Suggestions]                │
│                                          │
│  Selected: 0/3                          │
│                                          │
│  [← Back]     [Skip]    [Continue →]    │
└─────────────────────────────────────────┘
```

#### Smart Features
- Auto-complete for company names
- Role suggestions based on resume
- AI recommendation button
- Industry/location filters

### Step 5: Preferences & Personalization
**Purpose**: Fine-tune recommendations

#### Screen Layout
```
┌─────────────────────────────────────────┐
│      Personalize Your Path (4/4)        │
│         ●  ●  ●  ●                      │
│                                          │
│  Work Environment:                       │
│  [Remote] [Hybrid] [On-site]            │
│                                          │
│  Company Size:                          │
│  [Startup] [Mid] [Enterprise] [Any]     │
│                                          │
│  What matters most? (drag to rank)      │
│  ┌─────────────────────────────────┐    │
│  │ ≡ Career Growth                 │    │
│  │ ≡ Work-Life Balance             │    │
│  │ ≡ Compensation                  │    │
│  │ ≡ Learning Opportunities        │    │
│  │ ≡ Company Culture               │    │
│  └─────────────────────────────────┘    │
│                                          │
│  Email me updates:                       │
│  [Weekly ▼] [✓ Enabled]                 │
│                                          │
│  [← Back]         [Generate Roadmap →]   │
└─────────────────────────────────────────┘
```

### Step 6: Completion & Roadmap Generation
**Purpose**: Save settings and generate roadmap

#### Screen Layout (Processing)
```
┌─────────────────────────────────────────────────────────┐
│ Setup Wizard - Completing Setup                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   Generating Your Personalized Roadmap                  │
│   ─────────────────────────────────────                   │
│                                                         │
│   ┌─────────────────────────────────────────────────┐ │
│   │                                                 │ │
│   │           ⚙️ Processing...                      │ │
│   │                                                 │ │
│   │    [███████████████░░░░░░] 75%              │ │
│   │                                                 │ │
│   │    Current Step: Analyzing skill gaps...       │ │
│   │                                                 │ │
│   └─────────────────────────────────────────────────┘ │
│                                                         │
│   Please don't close this window.                      │
│   This usually takes 30-60 seconds.                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Screen Layout (Success)
```
┌─────────────────────────────────────────────────────────┐
│ Setup Wizard - Complete!                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ✅ Setup Complete!                                    │
│   ─────────────────                                     │
│                                                         │
│   Your account has been successfully configured.        │
│                                                         │
│   What we've prepared for you:                         │
│   • Personalized career roadmap                        │
│   • Skill gap analysis                                 │
│   • Job recommendations                                │
│   • Learning resources                                 │
│                                                         │
│   Next Steps:                                          │
│   1. Review your personalized roadmap                  │
│   2. Start with recommended courses                    │
│   3. Track your progress on the dashboard              │
│                                                         │
│   ☑ Automatically close this wizard                    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│            [View Dashboard]    [View Roadmap]           │
└─────────────────────────────────────────────────────────┘
```

## Technical Implementation

### Wizard State Management
```typescript
interface SetupWizardState {
  currentStep: number;
  totalSteps: number;
  stepValidation: Record<number, boolean>;
  formData: {
    resume?: File;
    resumeAnalysis?: ResumeData;
    careerGoals: {
      primaryGoal?: string;
      timeline?: string;
      employmentStatus?: string;
    };
    targetCompanies: Array<{
      name: string;
      role: string;
      location?: string;
    }>;
    preferences: {
      workEnvironment: string[];
      companySize: string[];
      priorities: string[];
      emailNotifications: boolean;
      emailFrequency: string;
    };
  };
  isComplete: boolean;
  completedAt?: Date;
}
```

### Wizard Navigation
```typescript
interface WizardNavigation {
  canGoNext: boolean;
  canGoPrevious: boolean;
  canSaveAndExit: boolean;
  nextStep: () => void;
  previousStep: () => void;
  saveAndExit: () => Promise<void>;
  jumpToStep: (step: number) => void;
}
```

### Component Structure
```
/components/onboarding/
  ├── SetupWizard.tsx              // Main wizard container
  ├── SetupWizardProvider.tsx      // Context provider
  ├── steps/
  │   ├── WelcomeStep.tsx
  │   ├── ResumeUploadStep.tsx
  │   ├── CareerGoalsStep.tsx
  │   ├── TargetCompaniesStep.tsx
  │   ├── PreferencesStep.tsx
  │   └── CompletionStep.tsx
  ├── components/
  │   ├── WizardHeader.tsx         // Step counter & title
  │   ├── WizardProgress.tsx       // Progress bar
  │   ├── WizardNavigation.tsx     // Prev/Next buttons
  │   ├── WizardSidebar.tsx        // Optional step list
  │   └── ValidationMessage.tsx    // Error/warning display
  └── hooks/
      ├── useWizardState.ts
      ├── useWizardValidation.ts
      └── useWizardPersistence.ts
```

### Validation Rules
```typescript
const stepValidation = {
  1: () => true, // Welcome - always valid
  2: (data) => !!data.resume || data.skipResume,
  3: (data) => !!data.careerGoals.primaryGoal && !!data.careerGoals.timeline,
  4: (data) => data.targetCompanies.length >= 1 || data.openToAny,
  5: (data) => data.preferences.workEnvironment.length > 0
};
```

### Progress Persistence
- Auto-save form data to localStorage on each field change
- Save wizard state to database on "Save & Exit"
- Resume from last incomplete step on login
- Clear wizard data on successful completion

## Wizard Features

### Navigation & Controls
- Linear step progression with validation
- Previous/Next button state management
- Save & Exit functionality at any step
- Keyboard shortcuts (Enter for Next, Esc for Exit)
- Breadcrumb navigation for step jumping

### Form Validation
- Real-time field validation
- Clear error messaging
- Required field indicators (*)
- Validation summary before proceeding
- Progressive disclosure of optional fields

### Data Persistence
- Auto-save on every field change
- Session recovery after browser crash
- Draft state preservation
- Partial completion tracking

### User Assistance
- Contextual help tooltips
- Field-level guidance
- Example inputs
- Progress saving confirmation
- Exit confirmation dialog

## Wizard Analytics

### Tracking Points
- Step entry/exit timestamps
- Field interaction times
- Validation error frequency
- Save & Exit usage
- Help tooltip engagement
- AI suggestion adoption
- Completion paths

### Key Metrics
- Average time per step
- Field abandonment rates
- Error recovery success
- Browser/device completion rates
- Return session completion

## Wizard Responsiveness

### Mobile Adaptations
- Single column layout
- Larger touch targets (44px minimum)
- Sticky navigation bar
- Collapsible form sections
- Mobile-specific file upload UI

### Tablet Optimization
- Two-column layout option
- Side navigation panel
- Landscape orientation support
- Touch-friendly drag and drop

## Post-Wizard Experience

### Immediate Transition
- Auto-redirect to dashboard
- Welcome notification
- First-time user tour prompt
- Quick action suggestions

### Follow-up Actions
- Email confirmation with summary
- 24-hour check-in
- Weekly progress report
- Feature announcement integration

## Wizard Success Metrics

1. **Completion Rate**: >85% complete all required steps
2. **Time to Complete**: 5-7 minutes average
3. **Save & Return Rate**: <15% (lower is better)
4. **Validation Error Rate**: <2 per user
5. **Mobile Completion**: >60% on mobile devices

## Implementation Phases

### Phase 1: Core Wizard (Week 1-2)
- Basic step structure
- Form validation
- Navigation controls
- Progress persistence

### Phase 2: Enhanced UX (Week 3-4)
- AI recommendations
- Auto-complete features
- Help system
- Mobile optimization

### Phase 3: Analytics & Optimization (Week 5-6)
- Analytics integration
- A/B testing setup
- Performance optimization
- Accessibility audit
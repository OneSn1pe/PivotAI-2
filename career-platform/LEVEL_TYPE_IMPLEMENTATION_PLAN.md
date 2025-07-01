# Level Type Implementation Plan

## Overview
This document outlines the implementation plan for ensuring that each level in the PivotAI platform is assigned a specific type (Skill, Project, or Position) and that all milestones within a level strictly adhere to that type's description.

## Current State Analysis

### Existing System
- **Level Generation**: Currently generates levels progressively with mixed milestone types
- **Type Determination**: Already has an endpoint (`/api/determine-level-type`) that analyzes which type is needed
- **Typed Level Generation**: Has endpoint (`/api/generate-typed-level`) that can generate type-specific levels
- **Issue**: The main roadmap generation doesn't enforce type consistency across all milestones in a level

### Key Components to Modify
1. **Initial Roadmap Generation** (`/api/generate-roadmap`)
2. **Next Level Generation** (`/api/generate-next-level`)
3. **Type Definitions and Data Models**
4. **UI Components** (to display level types)

## Proposed Architecture

### Level Type Assignment Flow
```
Resume Upload → Resume Analysis → Initial Type Determination → Level 1 Generation (typed) → 
→ Progress Tracking → Next Level Type Determination → Level N Generation (typed)
```

### Type Definitions
- **Skill Level**: Focus on learning and mastering specific technical or soft skills
  - Milestones: Courses, certifications, theoretical learning
  - No project deliverables in milestones
  
- **Project Level**: Apply skills through hands-on implementation
  - Milestones: Build specific projects, create portfolios
  - No pure learning milestones
  
- **Position Level**: Career advancement and job preparation
  - Milestones: Interview prep, networking, job applications
  - No skill learning or project building

## Implementation Steps

### Phase 1: Data Model Updates

#### 1.1 Update Level Type Storage
- Add `levelType` field to the roadmap document structure
- Ensure type is stored at the level, not just milestone level

```typescript
interface Roadmap {
  id: string;
  candidateId: string;
  levels: {
    [levelNumber: string]: {
      levelType: 'skill' | 'project' | 'position';
      milestones: Milestone[];
      generatedAt: Timestamp;
    }
  };
  currentLevel: number;
  // ... other fields
}
```

#### 1.2 Update Milestone Validation
- Add validation to ensure milestone category matches level type
- Create mapping between level types and allowed milestone categories

```typescript
const LEVEL_TYPE_CATEGORY_MAP = {
  skill: ['technical', 'fundamental', 'soft'],
  project: ['technical', 'niche'],
  position: ['career', 'soft']
};
```

### Phase 2: API Modifications

#### 2.1 Modify `/api/generate-roadmap`
1. After resume analysis, call type determination logic
2. Pass determined type to roadmap generation
3. Update prompt to enforce type consistency
4. Store level type in database

#### 2.2 Modify `/api/generate-next-level`
1. Determine type for next level based on progression pattern
2. Use typed level generation instead of generic generation
3. Ensure all milestones match the level type

#### 2.3 Create Level Type Pattern
Implement a progression pattern (configurable):
```typescript
const DEFAULT_LEVEL_PATTERN = [
  'skill',    // Level 1: Foundation skills
  'skill',    // Level 2: Advanced skills
  'project',  // Level 3: Apply skills
  'skill',    // Level 4: New skill area
  'project',  // Level 5: Complex project
  'position', // Level 6: Career advancement
  // Pattern repeats...
];
```

### Phase 3: Prompt Engineering

#### 3.1 Update Roadmap Generation Prompt
Add type enforcement to the system prompt:
```
You are generating a {levelType} level. ALL milestones must be {levelType}-focused:
- Skill levels: Only learning activities, courses, certifications
- Project levels: Only hands-on projects and implementations
- Position levels: Only career advancement activities
```

#### 3.2 Add Validation Instructions
Include explicit validation in prompts:
```
CRITICAL: Verify each milestone matches the level type:
- For skill levels: No project deliverables or job applications
- For project levels: No pure learning or job search activities
- For position levels: No skill learning or project building
```

### Phase 4: UI Updates

#### 4.1 Display Level Type
- Add level type indicator to level cards
- Show type icon/badge on milestone lists
- Update progress tracking to show type progression

#### 4.2 User Feedback
- Explain why certain activities are grouped together
- Show upcoming level types in roadmap view

## Migration Strategy

### For Existing Users
1. Analyze existing milestones to infer level types
2. Run batch update to assign types to existing levels
3. Notify users of the enhancement

### For New Users
1. Implement new system immediately
2. All new roadmaps follow typed level structure

## Testing Plan

### Unit Tests
- Validate type assignment logic
- Test milestone-type matching validation
- Verify progression patterns

### Integration Tests
- End-to-end roadmap generation with types
- Level progression with type changes
- API response validation

### Manual Testing
- Generate roadmaps for different resume types
- Verify milestone consistency within levels
- Check UI displays types correctly

## Rollback Plan
If issues arise:
1. Feature flag to disable type enforcement
2. Fallback to mixed milestone generation
3. Keep type data but don't enforce in generation

## Success Metrics
- 100% of levels have assigned types
- 0% type mismatches in milestone generation
- Improved user progression (measured by completion rates)
- Positive user feedback on focused levels

## Timeline
- Phase 1: 2 days (Data model updates)
- Phase 2: 3 days (API modifications)
- Phase 3: 1 day (Prompt engineering)
- Phase 4: 2 days (UI updates)
- Testing: 2 days
- Total: ~10 days

## Next Steps
1. Review and approve this plan
2. Create feature branch for implementation
3. Begin with Phase 1 data model updates
4. Implement incrementally with testing at each phase
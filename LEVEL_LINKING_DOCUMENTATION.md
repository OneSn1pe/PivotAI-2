# Level Linking in PivotAI Prompts

## Overview

PivotAI uses a progressive level system where each level builds upon previous achievements. This document explains how levels are linked together through the prompt engineering system.

## Level Generation Flow

### 1. Initial Level Generation (Levels 1-6)

When a user first creates their roadmap, the system generates levels 1-6 using the roadmap generation prompt:

```
POST /api/generate-roadmap
```

**Key characteristics:**
- Level 1: Foundational skills only
- Each level increases in difficulty (1-5 scale)
- Estimated hours scale: 20-40 hours (Level 1) → 60-100 hours (Level 6)
- All levels generated based on initial resume analysis

### 2. Dynamic Level Generation (Level 7+)

When a user completes all milestones in a level, new levels are generated dynamically:

```
POST /api/generate-next-level
```

## How Levels Link Together

### 1. Context Preservation Through Completion History

The next level generation prompt explicitly includes all previously completed milestones:

```javascript
// From generate-next-level/route.ts
const prompt = `Generate Level ${nextLevel} milestones building on previous progress.

Previous completions:
${existingMilestones.filter((m: Milestone) => m.level < nextLevel).map((m: Milestone) => `- ${m.title}`).join('\n')}

Create 3-5 milestones that advance toward: ${targetCompanies.map((c: any) => c.name).join(', ')}
```

This ensures:
- New milestones don't repeat completed work
- Skills progressively build on foundations
- Clear progression toward target companies

### 2. Progressive Difficulty Scaling

Each level increases difficulty through multiple mechanisms:

```javascript
// Difficulty scales with level (capped at 5)
"difficulty": ${Math.min(nextLevel, 5)}

// Estimated hours increase by 10 per level
"estimatedHours": ${40 + (nextLevel * 10)}
```

**Scaling Pattern:**
- Level 1: 40-50 hours, difficulty 1
- Level 5: 80-90 hours, difficulty 5
- Level 10: 130-140 hours, difficulty 5 (capped)

### 3. Skill Progression Chain

Each level's skills build on previous levels:

**Example Progression:**
```
Level 1: JavaScript Fundamentals
  ↓
Level 2: React Basics (requires JavaScript)
  ↓
Level 3: Advanced React Patterns (requires React Basics)
  ↓
Level 4: Full-Stack Development (requires React + Backend)
  ↓
Level 5: System Architecture (requires Full-Stack experience)
```

### 4. Level Unlocking Mechanism

The `milestoneUnlockService.ts` enforces strict level progression:

```javascript
// A level is only unlocked if ALL milestones AND micro-milestones 
// from ALL previous levels are completed
export function calculateUnlockedLevel(
  milestones: Milestone[],
  userProgress: UserProgress
): number {
  // Check each level sequentially
  for (const level of levels) {
    // Verify all previous levels are fully completed
    let allPreviousLevelsComplete = true;
    
    for (let prevLevel = 1; prevLevel < level; prevLevel++) {
      // Check both milestones and micro-milestones
      if (!allMilestonesComplete || !allMicroMilestonesComplete) {
        allPreviousLevelsComplete = false;
        break;
      }
    }
  }
}
```

**Key Rules:**
- Level 1 is always unlocked
- Each subsequent level requires 100% completion of ALL previous levels
- No skipping levels allowed
- Both milestones and micro-milestones must be completed

## Prompt Linking Strategies

### 1. Explicit Reference to Previous Work

The prompt directly lists completed milestone titles, allowing the AI to:
- Avoid suggesting redundant skills
- Build appropriate prerequisites
- Maintain logical progression

### 2. Target Company Consistency

All level generation prompts reference the same target companies:
```javascript
Create 3-5 milestones that advance toward: ${targetCompanies}
```

This ensures every level moves the user closer to their career goals.

### 3. Professional Field Continuity

The professional field remains constant across all levels:
```javascript
"professionalField": "${professionalField}"
```

This maintains domain-specific relevance throughout the journey.

### 4. Resource Type Evolution

Resources evolve with level progression:
- **Early levels**: Free courses, documentation
- **Mid levels**: Books, paid courses, projects
- **Advanced levels**: Research papers, open source contributions

## Implementation Examples

### Level 1 Generation (Initial)
```json
{
  "milestones": [{
    "title": "JavaScript Fundamentals",
    "level": 1,
    "difficulty": 1,
    "estimatedHours": 40,
    "description": "Master core JavaScript concepts"
  }]
}
```

### Level 4 Generation (Dynamic)
```json
// Previous completions listed:
// - JavaScript Fundamentals
// - React Development
// - Node.js Backend

{
  "milestones": [{
    "title": "Full-Stack Application Architecture",
    "level": 4,
    "difficulty": 4,
    "estimatedHours": 70,
    "description": "Design and build scalable full-stack applications using React and Node.js"
  }]
}
```

## Benefits of This Approach

### 1. **Adaptive Learning Path**
- System adjusts based on completion speed
- Can generate unlimited levels as user progresses
- Responds to changing industry requirements

### 2. **Prevents Skill Gaps**
- Enforced sequential completion ensures solid foundations
- No jumping to advanced topics without prerequisites
- Comprehensive skill development

### 3. **Maintains Motivation**
- Clear progression visibility
- Achievable milestones at each level
- Increasing challenge maintains engagement

### 4. **Career Alignment**
- Every level moves toward target companies
- Skills remain relevant to career goals
- No wasted effort on irrelevant topics

## Technical Implementation Details

### 1. **State Management**
```javascript
// User progress tracks current level
userProgress: {
  levelsUnlocked: 4,  // Highest unlocked level
  completedMilestones: ["id1", "id2", ...],
  completedMicroMilestones: ["micro1", "micro2", ...]
}
```

### 2. **Level Completion Check**
```javascript
// From milestoneUnlockService.ts
async function checkAndUnlockMilestones(
  roadmapId: string,
  userId: string,
  completedLevel: number
): Promise<UnlockResult> {
  // Verify ALL milestones in level are complete
  // Verify ALL micro-milestones are complete
  // Only then unlock next level
}
```

### 3. **Prompt Temperature Settings**
- Initial roadmap: Temperature 0.2 (consistency)
- Next level generation: Temperature 0.7 (creativity)

This allows for:
- Predictable initial paths
- Creative variations in later levels
- Personalized learning experiences

## Summary

The level linking system in PivotAI creates a coherent, progressive learning journey through:

1. **Historical Context**: Each new level knows what came before
2. **Enforced Prerequisites**: Can't skip ahead without completing foundations
3. **Progressive Difficulty**: Challenges increase appropriately
4. **Goal Alignment**: Every level advances toward target companies
5. **Dynamic Generation**: Unlimited progression possibilities

This design ensures users build comprehensive skills systematically while maintaining flexibility for individual learning paths.
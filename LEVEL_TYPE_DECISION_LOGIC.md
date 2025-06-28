# Level Type Decision Logic in PivotAI

## Overview

PivotAI uses an intelligent two-step process for generating new levels. The first step determines what **type** of level the user needs based on their progress patterns, and the second step generates content specific to that type. This document explains how the system decides between skill-focused, project-focused, or position-focused levels.

## Level Types

### 1. **Skill Level**
- **Purpose**: Learn new technical or soft skills
- **Focus**: Knowledge acquisition and understanding
- **Resources**: Courses, documentation, tutorials
- **Success Criteria**: Can explain concepts, understands principles
- **Example**: "Master React Hooks and Context API"

### 2. **Project Level**
- **Purpose**: Apply learned skills through hands-on building
- **Focus**: Practical implementation and portfolio development
- **Resources**: Project guides, architecture references
- **Success Criteria**: Working applications, deployed projects
- **Example**: "Build a Full-Stack E-commerce Platform"

### 3. **Position Level**
- **Purpose**: Prepare for career transitions and role advancement
- **Focus**: Leadership, strategy, interview preparation
- **Resources**: Career guides, networking strategies
- **Success Criteria**: Updated portfolio, expanded network, interview readiness
- **Example**: "Transition to Senior Developer Role"

## Decision Factors

The AI analyzes multiple factors to determine the optimal level type:

### 1. **Recent Completion Patterns**

The system examines the last 2-3 levels completed:

```typescript
// Recent completions analysis
const recentCompletions = completedMilestones
  .filter(m => m.level >= currentLevel - 2)
  .map(m => ({
    title: m.title,
    levelType: m.levelType || 'skill'
  }));
```

**Decision Logic:**
- If last 2+ levels were "skill" → Suggest "project" (time to apply)
- If last level was "project" → Suggest "skill" or "position" 
- If approaching levels 5, 10, 15 → Consider "position" (career milestones)

### 2. **Current Progress Level**

Level ranges have natural progression patterns:

| Level Range | Typical Pattern | Reasoning |
|-------------|----------------|-----------|
| 1-3 | Mostly "skill" | Building foundations |
| 4-6 | Mix of "skill" and "project" | Applying basics |
| 7-9 | More "project", some "position" | Building expertise |
| 10+ | Balance all three | Senior development |

### 3. **Time Since Last Project**

The system tracks practical application:
- No project in last 3 levels → High priority for "project"
- Recent project success → Can continue with "skill" advancement
- Multiple projects completed → Ready for "position" growth

### 4. **Career Timeline Considerations**

Based on experience level and target companies:
- **Entry Level** (0-2 years): 70% skill, 25% project, 5% position
- **Mid Level** (2-5 years): 40% skill, 40% project, 20% position
- **Senior Level** (5+ years): 30% skill, 30% project, 40% position

### 5. **Target Company Alignment**

Different companies require different preparation:
- **FAANG/Big Tech**: More algorithmic skills and system design projects
- **Startups**: Full-stack projects and rapid skill acquisition
- **Enterprise**: Position-focused preparation and certifications

## AI Prompt Analysis

The determination prompt provides context for intelligent decision-making:

```javascript
const prompt = `Analyze the user's progress and determine what type of level they need next.

User Profile:
- Current Level: ${currentLevel}
- Target Companies: ${targetCompanies}
- Key Skills: ${skills}
- Experience Level: ${experience}

Recent Completions:
${recentCompletions}

Consider:
- Have they recently completed several skill-focused levels? (suggest project)
- Are they approaching a career transition point? (suggest position)
- Do they need to fill skill gaps? (suggest skill)
```

## Decision Examples

### Example 1: Skill Level Needed
```json
{
  "levelType": "skill",
  "reasoning": "User has completed 2 project levels recently but lacks advanced React patterns needed for target companies",
  "focus": "Advanced React patterns and performance optimization",
  "expectedOutcome": "Master complex React concepts required for senior roles"
}
```

### Example 2: Project Level Needed
```json
{
  "levelType": "project",
  "reasoning": "User has acquired Node.js and database skills in last 2 levels, time to integrate them",
  "focus": "Full-stack application with authentication and real-time features",
  "expectedOutcome": "Portfolio-ready application demonstrating backend expertise"
}
```

### Example 3: Position Level Needed
```json
{
  "levelType": "position",
  "reasoning": "User approaching Level 10 with strong technical skills, needs leadership development",
  "focus": "Technical leadership and team collaboration",
  "expectedOutcome": "Ready for tech lead interviews and responsibilities"
}
```

## Optimization Strategies

### 1. **Balanced Progression**
The system aims for a balanced distribution:
- Never more than 3 consecutive levels of the same type
- Ensures holistic development
- Prevents learning fatigue

### 2. **Adaptive Difficulty**
Level types influence difficulty scaling:
- Skill levels: Gradual complexity increase
- Project levels: Significant time investment
- Position levels: Soft skill challenges

### 3. **Feedback Loop**
The system learns from:
- Completion velocity (faster completion → can handle more challenge)
- Abandonment patterns (which types users struggle with)
- Success metrics (job placement, salary increases)

## Special Cases

### 1. **Fast Track Users**
Users completing levels quickly may get:
- Accelerated skill progression
- Larger, more complex projects
- Earlier position-level preparation

### 2. **Struggling Users**
Users taking longer may receive:
- More skill reinforcement
- Smaller, focused projects
- Delayed position challenges

### 3. **Career Changers**
Special consideration for those switching fields:
- Extended skill foundation (levels 1-5)
- Proof-of-concept projects
- Earlier position prep to address experience gap

## Future Enhancements

### 1. **User Preference Input**
Allow users to indicate preferences:
- "I learn best by doing" → More projects
- "I need interview prep" → More position levels
- "I want deep expertise" → More skill levels

### 2. **Market-Driven Decisions**
Real-time job market analysis:
- Surge in React jobs → Prioritize React skills
- New framework adoption → Early skill introduction
- Hiring freezes → Focus on skill depth

### 3. **Performance Metrics**
Track success by level type:
- Which types lead to job placement
- Correlation with salary increases
- User satisfaction ratings

## Summary

The level type decision system ensures users receive the right kind of challenge at the right time. By analyzing progress patterns, career goals, and market demands, PivotAI creates a personalized journey that balances learning, doing, and career advancement. This intelligent approach prevents both skill gaps and tutorial hell, keeping users engaged and progressing toward their career goals.
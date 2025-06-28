# Level Type Decision Logic in PivotAI

## Overview

PivotAI uses an intelligent two-step process for generating new levels. The first step determines what **type** of level the user needs based on their resume analysis and progress patterns, and the second step generates content specific to that type. This document explains how the system decides between skill-focused, project-focused, or position-focused levels.

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

### 1. **Resume Analysis (Most Critical)**

The system deeply analyzes the user's resume to identify critical gaps:

```typescript
// Resume-based decision factors
const resumeFactors = {
  hasSkillGaps: weaknesses.length > 0,
  needsPortfolio: !hasProjects && currentLevel < 3,
  readyForCareerMove: currentLevel >= 5 || experienceYears >= 2,
  experienceYears: experience.length,
  hasProjects: experience.includes('project' || 'built' || 'developed')
};
```

**Critical Decision Rules:**
1. **No Experience + Weak Skills** → "skill" (build foundation)
2. **Has Skills but No Portfolio** → "project" (need proof of ability)
3. **Approaching Job Search** → "position" (interview prep)
4. **Major Skill Gaps** → "skill" (fill critical gaps)
5. **Too Many Same Type** → Switch type (avoid monotony)

### 2. **Recent Completion Patterns**

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

The determination prompt now includes comprehensive resume analysis:

```javascript
const prompt = `Analyze the user's resume and progress to determine the MOST CRITICAL level type they need next.

Resume Analysis:
- Skills: ${resumeAnalysis.skills?.join(', ') || 'None listed'}
- Experience: ${resumeAnalysis.experience?.join('; ') || 'No experience listed'}
- Strengths: ${resumeAnalysis.strengths?.join(', ') || 'None identified'}
- Weaknesses/Gaps: ${resumeAnalysis.weaknesses?.join(', ') || 'None identified'}
- Experience Years: ${experienceYears}
- Has Portfolio Projects: ${hasProjects ? 'Yes' : 'No'}

CRITICAL DECISION FACTORS:
1. If user has NO EXPERIENCE and weak skills → "skill" (build foundation)
2. If user has skills but NO PORTFOLIO → "project" (need proof of ability)
3. If user approaching job search or career transition → "position" (interview prep)
4. If major skill gaps for target companies → "skill" (fill critical gaps)

Analyze the resume deeply. What is the SINGLE MOST CRITICAL thing blocking this user from their target companies?
```

## Decision Examples

### Example 1: Skill Level Needed (Resume-Based)
```json
{
  "levelType": "skill",
  "reasoning": "Resume shows no programming experience and lists 'lack of technical skills' as a weakness. Must build foundation before attempting projects.",
  "focus": "JavaScript fundamentals and basic web development",
  "expectedOutcome": "Gain essential programming skills to start building projects",
  "criticalGap": "No programming experience or technical skills"
}
```

### Example 2: Project Level Needed (Resume-Based)
```json
{
  "levelType": "project",
  "reasoning": "Resume lists React, Node.js, and Python skills but shows no projects or portfolio. Skills without proof won't convince employers.",
  "focus": "Full-stack web application showcasing all listed skills",
  "expectedOutcome": "Create tangible proof of abilities for potential employers",
  "criticalGap": "No portfolio or projects despite claiming technical skills"
}
```

### Example 3: Position Level Needed (Resume-Based)
```json
{
  "levelType": "position",
  "reasoning": "Resume shows 5+ years experience but targeting senior roles at FAANG. Needs interview prep and positioning strategy.",
  "focus": "FAANG interview preparation and personal branding",
  "expectedOutcome": "Ready to pass technical interviews and negotiate senior positions",
  "criticalGap": "Not prepared for rigorous FAANG interview process"
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

## Initial Level Type Determination

For new users, PivotAI includes a separate analysis endpoint (`/api/analyze-initial-level-type`) that determines the most critical starting point based solely on resume analysis:

### Resume Profile Categories

1. **Beginner**: No experience, few skills → Start with "skill"
2. **Intermediate**: Has skills but no portfolio → Start with "project"  
3. **Experienced**: Strong background → Start with "position"
4. **Career Changer**: Transitioning fields → Depends on transferable skills

### Initial Analysis Example

```json
{
  "levelType": "skill",
  "reasoning": "Entry-level candidate with no technical experience needs foundational skills first",
  "focus": "Core programming concepts and web development basics",
  "expectedOutcome": "Build foundation for future project work",
  "criticalGap": "Lack of any programming experience",
  "resumeProfile": "beginner"
}
```

## API Implementation

### 1. For Initial Roadmap Generation
```typescript
// First, analyze what type of Level 1 is needed
const levelTypeResponse = await fetch('/api/analyze-initial-level-type', {
  body: JSON.stringify({ resumeAnalysis, targetCompanies })
});

// Then generate appropriate Level 1 content
const roadmapResponse = await fetch('/api/generate-typed-level', {
  body: JSON.stringify({ 
    levelType: levelTypeResponse.levelType,
    level: 1
  })
});
```

### 2. For Subsequent Levels
```typescript
// Determine next level type based on resume + progress
const levelTypeResponse = await fetch('/api/determine-level-type', {
  body: JSON.stringify({ roadmapId, candidateId, currentLevel })
});

// Generate typed content
const nextLevelResponse = await fetch('/api/generate-typed-level', {
  body: JSON.stringify({
    levelType: levelTypeResponse.levelType,
    level: currentLevel + 1
  })
});
```

## Summary

The level type decision system ensures users receive the right kind of challenge at the right time. By deeply analyzing resumes to identify critical gaps, combined with progress patterns and career goals, PivotAI creates a personalized journey that addresses each user's most pressing needs. This resume-driven approach ensures that every user starts with what they need most - whether that's building skills, creating portfolio pieces, or positioning for career advancement.
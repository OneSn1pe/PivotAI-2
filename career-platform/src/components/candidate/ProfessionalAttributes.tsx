'use client';

import React from 'react';
import { ResumeAnalysis } from '@/types/user';

interface ProfessionalAttributesProps {
  resumeAnalysis: ResumeAnalysis | undefined;
}

const ProfessionalAttributes: React.FC<ProfessionalAttributesProps> = ({ resumeAnalysis }) => {
  // Calculate attributes from resume analysis
  const calculateAttributes = () => {
    if (!resumeAnalysis) {
      return {
        knowledge: 0,
        communication: 0,
        execution: 0,
        adaptability: 0,
        strategy: 0,
        balance: 0
      };
    }

    // Map technical skills to Knowledge
    const knowledgeKeywords = ['programming', 'software', 'development', 'code', 'java', 'python', 'javascript', 'react', 'angular', 'vue', 'node', 'database', 'sql', 'nosql', 'aws', 'cloud', 'docker', 'kubernetes', 'devops', 'ci/cd', 'git', 'algorithm'];
    
    // Map soft skills to Communication
    const communicationKeywords = ['communication', 'presentation', 'public speaking', 'writing', 'negotiation', 'collaboration', 'teamwork'];
    
    // Map to Execution
    const executionKeywords = ['project management', 'delivery', 'implementation', 'time management', 'organization', 'planning', 'execution'];
    
    // Map to Adaptability
    const adaptabilityKeywords = ['adaptability', 'flexibility', 'problem-solving', 'critical thinking', 'innovation', 'agile', 'learning'];
    
    // Map to Strategy
    const strategyKeywords = ['leadership', 'strategy', 'vision', 'analysis', 'decision-making', 'business acumen', 'research'];
    
    // Map to Balance
    const balanceKeywords = ['work-life balance', 'emotional intelligence', 'stress management', 'self-awareness', 'wellness', 'mindfulness'];

    const skills = resumeAnalysis.skills || [];
    let knowledgeCount = 0;
    let communicationCount = 0;
    let executionCount = 0;
    let adaptabilityCount = 0;
    let strategyCount = 0;
    let balanceCount = 0;

    skills.forEach(skill => {
      const lowerSkill = skill.toLowerCase();
      if (knowledgeKeywords.some(keyword => lowerSkill.includes(keyword))) {
        knowledgeCount++;
      }
      if (communicationKeywords.some(keyword => lowerSkill.includes(keyword))) {
        communicationCount++;
      }
      if (executionKeywords.some(keyword => lowerSkill.includes(keyword))) {
        executionCount++;
      }
      if (adaptabilityKeywords.some(keyword => lowerSkill.includes(keyword))) {
        adaptabilityCount++;
      }
      if (strategyKeywords.some(keyword => lowerSkill.includes(keyword))) {
        strategyCount++;
      }
      if (balanceKeywords.some(keyword => lowerSkill.includes(keyword))) {
        balanceCount++;
      }
    });

    // Calculate experience influence on execution and strategy
    const experienceLevel = resumeAnalysis.experience ? Math.min(resumeAnalysis.experience.length * 15, 75) : 0;
    executionCount += experienceLevel / 25; // Experience contributes to execution skills
    strategyCount += experienceLevel / 20;  // Experience contributes to strategic thinking
    
    // Calculate education influence on knowledge
    const educationLevel = resumeAnalysis.education ? Math.min(resumeAnalysis.education.length * 20, 60) : 0;
    knowledgeCount += educationLevel / 20;  // Education enhances knowledge
    
    // Calculate achievements based on strengths
    const achievementLevel = resumeAnalysis.strengths ? Math.min(resumeAnalysis.strengths.length * 15, 75) : 0;
    executionCount += achievementLevel / 30;  // Achievements show execution
    
    // Balance is hardest to calculate from a resume
    balanceCount = Math.max(balanceCount, 1); // Ensure a minimum score

    return {
      knowledge: Math.min(Math.round(knowledgeCount * 12), 100),
      communication: Math.min(Math.round(communicationCount * 15), 100),
      execution: Math.min(Math.round(executionCount * 10), 100),
      adaptability: Math.min(Math.round(adaptabilityCount * 15), 100),
      strategy: Math.min(Math.round(strategyCount * 12), 100),
      balance: Math.min(Math.round(balanceCount * 20), 100)
    };
  };

  const attributes = calculateAttributes();

  const renderAttributeBar = (name: string, value: number, color: string, description: string) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <div className="flex items-center">
          <span className={`w-3 h-3 rounded-full ${color} mr-2`}></span>
          <h4 className="font-medium text-slate-700 font-inter">{name}</h4>
        </div>
        <span className="text-sm text-slate-600 font-medium">{value}/100</span>
      </div>
      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full ${color} rounded-full`} 
          style={{ width: `${value}%` }}
        ></div>
      </div>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-card border border-slate-200">
      <h3 className="text-xl font-bold mb-4 text-slate-800 font-inter">Professional Attributes</h3>
      <p className="text-sm text-slate-500 mb-6">Based on your resume analysis</p>
      
      <div className="space-y-6">
        {renderAttributeBar(
          "Knowledge", 
          attributes.knowledge, 
          "bg-blue-500", 
          "Learning capacity and specialized expertise"
        )}
        
        {renderAttributeBar(
          "Communication", 
          attributes.communication, 
          "bg-violet-500", 
          "Networking and interpersonal abilities"
        )}
        
        {renderAttributeBar(
          "Execution", 
          attributes.execution, 
          "bg-red-500", 
          "Project management and deadline adherence"
        )}
        
        {renderAttributeBar(
          "Adaptability", 
          attributes.adaptability, 
          "bg-emerald-500", 
          "Problem-solving and flexibility"
        )}
        
        {renderAttributeBar(
          "Strategy", 
          attributes.strategy, 
          "bg-indigo-500", 
          "Decision-making and long-term planning"
        )}
        
        {renderAttributeBar(
          "Balance", 
          attributes.balance, 
          "bg-orange-500", 
          "Work-life integration and wellbeing"
        )}
      </div>
      
      {!resumeAnalysis && (
        <div className="text-center py-6 mt-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-slate-600">Upload your resume to see your professional attributes</p>
          <p className="text-sm text-slate-500 mt-2">These attributes help identify your strengths and areas for growth</p>
        </div>
      )}
    </div>
  );
};

export default ProfessionalAttributes; 
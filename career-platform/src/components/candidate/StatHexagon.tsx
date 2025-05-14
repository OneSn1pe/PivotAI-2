'use client';

import React, { useEffect, useRef } from 'react';
import { ResumeAnalysis } from '@/types/user';

interface StatHexagonProps {
  resumeAnalysis: ResumeAnalysis | undefined;
}

const StatHexagon: React.FC<StatHexagonProps> = ({ resumeAnalysis }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate stats from resume analysis
  const calculateStats = () => {
    if (!resumeAnalysis) {
      return {
        technicalSkills: 0,
        softSkills: 0,
        experience: 0,
        education: 0,
        achievements: 0,
        potential: 0
      };
    }

    // Count technical vs soft skills
    const technicalSkillKeywords = ['programming', 'software', 'development', 'code', 'java', 'python', 'javascript', 'react', 'angular', 'vue', 'node', 'database', 'sql', 'nosql', 'aws', 'cloud', 'docker', 'kubernetes', 'devops', 'ci/cd', 'git', 'algorithm'];
    const softSkillKeywords = ['communication', 'leadership', 'teamwork', 'collaboration', 'problem-solving', 'critical thinking', 'time management', 'adaptability', 'creativity', 'emotional intelligence', 'conflict resolution', 'negotiation', 'presentation', 'public speaking'];

    const skills = resumeAnalysis.skills || [];
    let technicalSkillCount = 0;
    let softSkillCount = 0;

    skills.forEach(skill => {
      const lowerSkill = skill.toLowerCase();
      if (technicalSkillKeywords.some(keyword => lowerSkill.includes(keyword))) {
        technicalSkillCount++;
      }
      if (softSkillKeywords.some(keyword => lowerSkill.includes(keyword))) {
        softSkillCount++;
      }
    });

    // Calculate experience level based on years or number of positions
    const experienceLevel = resumeAnalysis.experience ? Math.min(resumeAnalysis.experience.length * 20, 100) : 0;
    
    // Calculate education level
    const educationLevel = resumeAnalysis.education ? Math.min(resumeAnalysis.education.length * 25, 100) : 0;
    
    // Calculate achievements based on strengths
    const achievementLevel = resumeAnalysis.strengths ? Math.min(resumeAnalysis.strengths.length * 20, 100) : 0;
    
    // Calculate potential based on recommendations (inverse - fewer recommendations means higher potential)
    const potentialLevel = resumeAnalysis.recommendations ? 
      Math.max(100 - resumeAnalysis.recommendations.length * 10, 20) : 50;

    return {
      technicalSkills: Math.min(technicalSkillCount * 10, 100),
      softSkills: Math.min(softSkillCount * 15, 100),
      experience: experienceLevel,
      education: educationLevel,
      achievements: achievementLevel,
      potential: potentialLevel
    };
  };

  // Draw the hexagon on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate stats
    const stats = calculateStats();
    const { technicalSkills, softSkills, experience, education, achievements, potential } = stats;

    // Set up canvas
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 30;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background hexagon grid
    const drawGrid = () => {
      const levels = 5; // 5 levels from center (20%, 40%, 60%, 80%, 100%)
      
      for (let level = 1; level <= levels; level++) {
        const levelRadius = (radius * level) / levels;
        
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          const x = centerX + levelRadius * Math.cos(angle);
          const y = centerY + levelRadius * Math.sin(angle);
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)'; // Light slate color
        ctx.stroke();
      }
      
      // Draw axes
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)';
        ctx.stroke();
      }
    };

    // Draw stat hexagon
    const drawStatHexagon = () => {
      const stats = [
        technicalSkills, // Top
        softSkills,      // Top right
        experience,      // Bottom right
        education,       // Bottom
        achievements,    // Bottom left
        potential        // Top left
      ];
      
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const value = stats[i] / 100; // Convert to 0-1 scale
        const x = centerX + radius * value * Math.cos(angle);
        const y = centerY + radius * value * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(14, 165, 233, 0.2)'; // Sky blue with transparency
      ctx.fill();
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Add points at vertices
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const value = stats[i] / 100;
        const x = centerX + radius * value * Math.cos(angle);
        const y = centerY + radius * value * Math.sin(angle);
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(14, 165, 233, 1)';
        ctx.fill();
      }
    };

    // Draw labels
    const drawLabels = () => {
      const labels = [
        'Technical Skills',
        'Soft Skills',
        'Experience',
        'Education',
        'Achievements',
        'Potential'
      ];
      
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#334155'; // Slate-700
      ctx.textAlign = 'center';
      
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = centerX + (radius + 20) * Math.cos(angle);
        const y = centerY + (radius + 20) * Math.sin(angle);
        
        // Adjust vertical alignment based on position
        if (i === 0) { // Top
          ctx.textAlign = 'center';
          ctx.fillText(labels[i], x, y - 10);
        } else if (i === 3) { // Bottom
          ctx.textAlign = 'center';
          ctx.fillText(labels[i], x, y + 20);
        } else if (i === 1 || i === 2) { // Right side
          ctx.textAlign = 'left';
          ctx.fillText(labels[i], x + 5, y + 5);
        } else { // Left side
          ctx.textAlign = 'right';
          ctx.fillText(labels[i], x - 5, y + 5);
        }
      }
    };

    // Draw values
    const drawValues = () => {
      const values = [
        `${technicalSkills}%`,
        `${softSkills}%`,
        `${experience}%`,
        `${education}%`,
        `${achievements}%`,
        `${potential}%`
      ];
      
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#0284c7'; // Sky-700
      ctx.textAlign = 'center';
      
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const value = [technicalSkills, softSkills, experience, education, achievements, potential][i] / 100;
        const x = centerX + radius * value * Math.cos(angle);
        const y = centerY + radius * value * Math.sin(angle);
        
        // Position the values slightly away from the points
        const valueX = centerX + (radius * value + 15) * Math.cos(angle);
        const valueY = centerY + (radius * value + 15) * Math.sin(angle);
        
        ctx.fillText(values[i], valueX, valueY);
      }
    };

    // Execute all drawing functions
    drawGrid();
    drawStatHexagon();
    drawLabels();
    drawValues();

  }, [resumeAnalysis]);

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-xl font-bold mb-2 text-sky-800">Career Stats</h3>
      <p className="text-sm text-slate-500 mb-4">Based on your resume analysis</p>
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={300} 
          height={300} 
          className="max-w-full"
        />
        <div className="absolute -top-4 -right-4">
          <div className="cloud-sm opacity-30"></div>
        </div>
        <div className="absolute -bottom-2 -left-2">
          <div className="cloud-sm opacity-20"></div>
        </div>
      </div>
      {!resumeAnalysis && (
        <p className="text-center text-slate-500 mt-4">Upload your resume to see your career stats</p>
      )}
    </div>
  );
};

export default StatHexagon; 
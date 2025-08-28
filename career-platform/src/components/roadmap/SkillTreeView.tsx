'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Target,
  Lock,
  CheckCircle,
  Star,
  ChevronRight,
  Zap,
  Trophy,
  Code,
  BookOpen,
  Users,
  TrendingUp,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Milestone, UserProgress } from '@/types/user';

interface SkillNode {
  id: string;
  milestone: Milestone;
  position: { x: number; y: number };
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  connections: string[];
  level: number;
}

interface SkillTreeViewProps {
  milestones: Milestone[];
  userProgress: UserProgress;
  onMilestoneSelect?: (milestone: Milestone) => void;
  className?: string;
}

const LEVEL_COLORS = {
  1: 'from-green-400 to-green-600',
  2: 'from-blue-400 to-blue-600', 
  3: 'from-purple-400 to-purple-600',
  4: 'from-orange-400 to-orange-600',
  5: 'from-red-400 to-red-600'
};

const STATUS_COLORS = {
  locked: 'bg-gray-200 border-gray-300 text-gray-500',
  available: 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100',
  in_progress: 'bg-yellow-50 border-yellow-300 text-yellow-700',
  completed: 'bg-green-50 border-green-300 text-green-700'
};

export function SkillTreeView({ 
  milestones, 
  userProgress, 
  onMilestoneSelect,
  className = '' 
}: SkillTreeViewProps) {
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Build skill tree data structure
  const skillNodes = buildSkillTree(milestones, userProgress);

  const handleNodeClick = (node: SkillNode) => {
    setSelectedNode(node);
    onMilestoneSelect?.(node.milestone);
  };

  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className={`skill-tree-container ${className}`}>
      {/* Header Controls */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Skill Development Path
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleZoom(-0.1)}>-</Button>
              <span className="text-sm px-2">{Math.round(scale * 100)}%</span>
              <Button variant="outline" size="sm" onClick={() => handleZoom(0.1)}>+</Button>
              <Button variant="outline" size="sm" onClick={resetView}>Reset</Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Skill Tree Visualization */}
      <div 
        ref={containerRef}
        className={`relative overflow-hidden rounded-lg border bg-gray-50 ${
          isFullscreen ? 'fixed inset-4 z-50 bg-white' : 'h-96'
        }`}
      >
        <svg 
          className="w-full h-full"
          viewBox={`${-offset.x} ${-offset.y} ${800 / scale} ${600 / scale}`}
          style={{ transform: `scale(${scale})` }}
        >
          {/* Grid Background */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Connection Lines */}
          {skillNodes.map(node => 
            node.connections.map(targetId => {
              const targetNode = skillNodes.find(n => n.id === targetId);
              if (!targetNode) return null;

              const isUnlocked = node.status === 'completed' || targetNode.status !== 'locked';
              
              return (
                <motion.line
                  key={`${node.id}-${targetId}`}
                  x1={node.position.x + 30}
                  y1={node.position.y + 30}
                  x2={targetNode.position.x + 30}
                  y2={targetNode.position.y + 30}
                  stroke={isUnlocked ? '#3b82f6' : '#d1d5db'}
                  strokeWidth={isUnlocked ? 3 : 2}
                  strokeDasharray={isUnlocked ? 'none' : '5,5'}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              );
            })
          )}

          {/* Skill Nodes */}
          {skillNodes.map((node, index) => (
            <SkillNodeSVG
              key={node.id}
              node={node}
              isSelected={selectedNode?.id === node.id}
              onClick={() => handleNodeClick(node)}
              animationDelay={index * 0.1}
            />
          ))}
        </svg>

        {/* Legend */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4">
          <h4 className="font-semibold text-sm mb-2">Legend</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 border-2 border-gray-300"></div>
              <span>Locked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border-2 border-gray-400"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-50 border-2 border-gray-500"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 border-2 border-gray-600"></div>
              <span>Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Node Details */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-6"
          >
            <SkillNodeDetails 
              node={selectedNode} 
              onClose={() => setSelectedNode(null)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Summary */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {skillNodes.filter(n => n.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {skillNodes.filter(n => n.status === 'available').length}
              </div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {skillNodes.filter(n => n.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {skillNodes.filter(n => n.status === 'locked').length}
              </div>
              <div className="text-sm text-gray-600">Locked</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// SVG Skill Node Component
function SkillNodeSVG({ 
  node, 
  isSelected, 
  onClick, 
  animationDelay 
}: { 
  node: SkillNode; 
  isSelected: boolean; 
  onClick: () => void; 
  animationDelay: number; 
}) {
  const statusColor = STATUS_COLORS[node.status];
  const levelGradient = LEVEL_COLORS[node.level as keyof typeof LEVEL_COLORS] || LEVEL_COLORS[1];

  return (
    <g>
      {/* Node Circle */}
      <motion.circle
        cx={node.position.x + 30}
        cy={node.position.y + 30}
        r={isSelected ? 35 : 30}
        className={`cursor-pointer transition-all duration-300 ${statusColor}`}
        onClick={onClick}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: animationDelay, type: "spring", damping: 15 }}
        whileHover={{ scale: 1.1 }}
      />

      {/* Level Ring */}
      <motion.circle
        cx={node.position.x + 30}
        cy={node.position.y + 30}
        r={25}
        fill="none"
        stroke={`url(#gradient-${node.level})`}
        strokeWidth={3}
        initial={{ strokeDasharray: 0 }}
        animate={{ strokeDasharray: node.status === 'completed' ? 157 : 0 }}
        transition={{ delay: animationDelay + 0.5, duration: 1 }}
      />

      {/* Status Icon */}
      <foreignObject 
        x={node.position.x + 20} 
        y={node.position.y + 20} 
        width={20} 
        height={20}
      >
        <div className="flex items-center justify-center w-full h-full">
          {node.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
          {node.status === 'locked' && <Lock className="h-4 w-4 text-gray-400" />}
          {node.status === 'available' && <Target className="h-4 w-4 text-blue-600" />}
          {node.status === 'in_progress' && <Star className="h-4 w-4 text-yellow-600" />}
        </div>
      </foreignObject>

      {/* Level Badge */}
      <motion.circle
        cx={node.position.x + 45}
        cy={node.position.y + 15}
        r={8}
        className="fill-blue-500"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: animationDelay + 0.2 }}
      />
      <text
        x={node.position.x + 45}
        y={node.position.y + 19}
        textAnchor="middle"
        className="text-xs font-bold fill-white"
      >
        {node.level}
      </text>

      {/* Node Label */}
      <text
        x={node.position.x + 30}
        y={node.position.y + 80}
        textAnchor="middle"
        className="text-xs font-medium fill-gray-700"
        style={{ maxWidth: '60px' }}
      >
        {node.milestone.title.length > 15 
          ? `${node.milestone.title.substring(0, 15)}...` 
          : node.milestone.title}
      </text>


      {/* Gradients for level rings */}
      <defs>
        <linearGradient id={`gradient-${node.level}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
    </g>
  );
}

// Skill Node Details Panel
function SkillNodeDetails({ node, onClose }: { node: SkillNode; onClose: () => void }) {
  const CategoryIcon = {
    'technical': Code,
    'fundamental': BookOpen,
    'soft': Users,
    'career': Trophy
  }[node.milestone.category as string] || Target;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CategoryIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div>{node.milestone.title}</div>
              <div className="text-sm text-gray-600 font-normal">Level {node.level}</div>
            </div>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-700">{node.milestone.description}</p>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              +{(node.milestone as any).xpValue || 100} XP
            </Badge>
            <Badge variant="outline">
              {node.milestone.timeframe}
            </Badge>
            <Badge variant={
              node.status === 'completed' ? 'default' :
              node.status === 'available' ? 'secondary' : 'outline'
            }>
              {node.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          {node.milestone.skills.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Skills You'll Learn</h4>
              <div className="flex flex-wrap gap-2">
                {node.milestone.skills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Build skill tree data structure from milestones
function buildSkillTree(milestones: Milestone[], userProgress: UserProgress): SkillNode[] {
  const nodes: SkillNode[] = [];
  const levelGroups = groupBy(milestones, 'level');
  
  Object.entries(levelGroups || {}).forEach(([level, levelMilestones], levelIndex) => {
    levelMilestones.forEach((milestone, index) => {
      const x = (index * 150) + (levelIndex % 2 === 0 ? 0 : 75);
      const y = levelIndex * 120 + 50;
      
      const status = getMilestoneStatus(milestone, userProgress);
      const connections = getConnections(milestone, milestones);
      
      nodes.push({
        id: milestone.id,
        milestone,
        position: { x, y },
        status,
        connections,
        level: parseInt(level)
      });
    });
  });
  
  return nodes;
}

function getMilestoneStatus(milestone: Milestone, userProgress: UserProgress): SkillNode['status'] {
  if (userProgress.completedMilestones.includes(milestone.id)) {
    return 'completed';
  }
  
  if (milestone.prerequisites?.some(prereq => !userProgress.completedMilestones.includes(prereq))) {
    return 'locked';
  }
  
  // Check if milestone is currently being worked on (has some micro-milestones completed)
  const hasPartialProgress = milestone.microMilestones?.some(micro => 
    userProgress.completedMicroMilestones.includes(micro.id)
  );
  
  return hasPartialProgress ? 'in_progress' : 'available';
}

function getConnections(milestone: Milestone, allMilestones: Milestone[]): string[] {
  return allMilestones
    .filter(m => m.prerequisites?.includes(milestone.id))
    .map(m => m.id);
}

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}
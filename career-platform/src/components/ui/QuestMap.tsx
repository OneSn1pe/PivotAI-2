import React, { useState, useRef, useEffect } from 'react';
import { Quest } from '@/types/game';

export interface MapNode {
  id: string;
  x: number;
  y: number;
  quest: Quest;
  connections: string[];
}

interface QuestMapProps {
  nodes: MapNode[];
  onNodeClick: (questId: string) => void;
  currentQuestId?: string;
  className?: string;
}

const QuestMap: React.FC<QuestMapProps> = ({
  nodes,
  onNodeClick,
  currentQuestId,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mapWidth, setMapWidth] = useState(800);
  const [mapHeight, setMapHeight] = useState(600);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const container = svgRef.current.parentElement;
        if (container) {
          setMapWidth(container.clientWidth);
          setMapHeight(container.clientHeight);
        }
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle mouse events for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newScale = Math.max(0.5, Math.min(2, scale - e.deltaY * 0.001));
    setScale(newScale);
  };

  // Render connections between nodes
  const renderConnections = () => {
    const connections: JSX.Element[] = [];
    
    nodes.forEach(node => {
      node.connections.forEach(targetId => {
        const targetNode = nodes.find(n => n.id === targetId);
        if (targetNode) {
          // Determine if the path should be highlighted (both nodes are completed or in progress)
          const isNodeCompleted = node.quest.status === 'completed' || node.quest.status === 'in-progress';
          const isTargetCompleted = targetNode.quest.status === 'completed' || targetNode.quest.status === 'in-progress';
          const isPathActive = isNodeCompleted && isTargetCompleted;
          
          connections.push(
            <g key={`${node.id}-${targetId}`}>
              {/* Path shadow for depth effect */}
              <path
                d={`M ${node.x} ${node.y} L ${targetNode.x} ${targetNode.y}`}
                stroke="#000"
                strokeWidth="6"
                strokeOpacity="0.2"
                strokeLinecap="round"
                strokeDasharray={node.quest.status === 'locked' || targetNode.quest.status === 'locked' ? "5,5" : "none"}
              />
              {/* Actual path */}
              <path
                d={`M ${node.x} ${node.y} L ${targetNode.x} ${targetNode.y}`}
                stroke={isPathActive ? "#f59e0b" : "#94a3b8"}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={node.quest.status === 'locked' || targetNode.quest.status === 'locked' ? "5,5" : "none"}
              />
            </g>
          );
        }
      });
    });
    
    return connections;
  };

  // Render map nodes
  const renderNodes = () => {
    return nodes.map(node => {
      // Determine node appearance based on status
      let nodeColor = "#94a3b8"; // Default gray for locked
      let nodeSize = 20;
      let nodeIcon = "🔒";
      
      switch (node.quest.status) {
        case 'completed':
          nodeColor = "#22c55e"; // Green
          nodeIcon = "✓";
          break;
        case 'in-progress':
          nodeColor = "#3b82f6"; // Blue
          nodeIcon = "⚔️";
          break;
        case 'available':
          nodeColor = "#f59e0b"; // Amber
          nodeIcon = "!";
          break;
      }
      
      // Highlight current quest
      const isCurrentQuest = currentQuestId === node.quest.id;
      const strokeWidth = isCurrentQuest ? 4 : 2;
      const pulseAnimation = isCurrentQuest ? "animate-pulse" : "";
      
      return (
        <g 
          key={node.id} 
          onClick={() => onNodeClick(node.quest.id)}
          className="cursor-pointer transition-transform hover:scale-110"
          transform={`translate(${node.x - nodeSize/2}, ${node.y - nodeSize/2})`}
        >
          {/* Node background with glow effect for current quest */}
          {isCurrentQuest && (
            <circle
              cx={nodeSize/2}
              cy={nodeSize/2}
              r={nodeSize * 1.2}
              fill="url(#currentGlow)"
              className={pulseAnimation}
              opacity="0.7"
            />
          )}
          
          {/* Node difficulty indicator (stars) */}
          <g transform={`translate(0, ${-nodeSize - 5})`}>
            <foreignObject width={nodeSize * 2} height="20" x={-nodeSize/2} y="0">
              <div className="flex justify-center">
                {Array.from({ length: node.quest.difficulty }).map((_, i) => (
                  <span key={i} className="text-[8px] text-amber-500">★</span>
                ))}
              </div>
            </foreignObject>
          </g>
          
          {/* Main node circle */}
          <circle
            cx={nodeSize/2}
            cy={nodeSize/2}
            r={nodeSize}
            fill={nodeColor}
            stroke={isCurrentQuest ? "#f8fafc" : "#475569"}
            strokeWidth={strokeWidth}
            className={`${node.quest.status === 'locked' ? 'opacity-50' : ''}`}
          />
          
          {/* Node icon */}
          <foreignObject width={nodeSize} height={nodeSize} x="0" y="0">
            <div className="w-full h-full flex items-center justify-center text-white font-bold">
              {nodeIcon}
            </div>
          </foreignObject>
          
          {/* Node label */}
          <foreignObject width="120" height="40" x={-60 + nodeSize/2} y={nodeSize + 5}>
            <div className="text-center text-xs font-medium text-slate-800 bg-slate-100 bg-opacity-70 px-2 py-1 rounded">
              {node.quest.title}
            </div>
          </foreignObject>
        </g>
      );
    });
  };

  return (
    <div 
      className={`relative overflow-hidden border-4 border-amber-800 rounded-lg bg-slate-200 ${className}`}
      style={{ height: '500px' }}
    >
      {/* Map background with fantasy styling */}
      <div className="absolute inset-0 bg-[url('/images/parchment-bg.jpg')] bg-cover opacity-50"></div>
      
      {/* Compass rose */}
      <div className="absolute top-4 right-4 w-16 h-16 bg-[url('/images/compass-rose.svg')] bg-contain bg-no-repeat opacity-70"></div>
      
      {/* Map controls */}
      <div className="absolute bottom-4 right-4 flex space-x-2 z-10">
        <button 
          className="w-8 h-8 bg-slate-800 text-white rounded flex items-center justify-center"
          onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
        >
          +
        </button>
        <button 
          className="w-8 h-8 bg-slate-800 text-white rounded flex items-center justify-center"
          onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
        >
          -
        </button>
        <button 
          className="w-8 h-8 bg-slate-800 text-white rounded flex items-center justify-center"
          onClick={() => {
            setPan({ x: 0, y: 0 });
            setScale(1);
          }}
        >
          ⟲
        </button>
      </div>
      
      {/* SVG Map */}
      <svg
        ref={svgRef}
        width={mapWidth}
        height={mapHeight}
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {/* Gradient definitions */}
        <defs>
          <radialGradient id="currentGlow" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Map content with transformation for pan and zoom */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
          {/* Fantasy map decorative elements */}
          <g className="map-decorations">
            {/* Mountains */}
            <path
              d="M 100,100 L 150,50 L 200,120 L 250,70 L 300,110 Z"
              fill="#e2e8f0"
              stroke="#94a3b8"
              strokeWidth="2"
              opacity="0.5"
            />
            {/* Forest */}
            <circle cx="600" cy="400" r="80" fill="#d1fae5" stroke="#10b981" strokeWidth="2" opacity="0.3" />
            {/* Water */}
            <path
              d="M 50,400 Q 100,350 150,400 Q 200,450 250,400 Q 300,350 350,400 L 350,500 L 50,500 Z"
              fill="#bfdbfe"
              stroke="#60a5fa"
              strokeWidth="2"
              opacity="0.3"
            />
          </g>
          
          {/* Connections between nodes */}
          {renderConnections()}
          
          {/* Quest nodes */}
          {renderNodes()}
        </g>
      </svg>
      
      {/* Map legend */}
      <div className="absolute bottom-4 left-4 bg-slate-800 bg-opacity-70 p-2 rounded text-white text-xs">
        <div className="flex items-center mb-1">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
          <span>Completed</span>
        </div>
        <div className="flex items-center mb-1">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
          <span>In Progress</span>
        </div>
        <div className="flex items-center mb-1">
          <span className="inline-block w-3 h-3 rounded-full bg-amber-500 mr-2"></span>
          <span>Available</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-slate-400 mr-2"></span>
          <span>Locked</span>
        </div>
      </div>
    </div>
  );
};

export default QuestMap; 
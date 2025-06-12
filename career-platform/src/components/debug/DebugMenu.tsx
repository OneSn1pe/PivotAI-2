'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bug, 
  Zap, 
  FileText, 
  Database, 
  Settings, 
  TestTube, 
  Activity,
  ChevronRight,
  X,
  Code
} from 'lucide-react';

interface DebugMenuProps {
  isVisible?: boolean;
  onClose?: () => void;
}

export function DebugMenu({ isVisible = true, onClose }: DebugMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const debugTools = [
    {
      title: 'Milestone Generation Tester',
      description: 'Test and debug OpenAI milestone generation',
      href: '/protected/candidate/debug/milestone-tester',
      icon: <Zap className="h-5 w-5" />,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      title: 'Resume Analysis Debug',
      description: 'Debug resume analysis pipeline',
      href: '/protected/candidate/profile?debug=resume',
      icon: <FileText className="h-5 w-5" />,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'Database Inspector',
      description: 'View Firebase collections and documents',
      href: '/protected/candidate/debug/database',
      icon: <Database className="h-5 w-5" />,
      color: 'text-green-600 bg-green-100'
    },
    {
      title: 'API Test Suite',
      description: 'Test all API endpoints',
      href: '/protected/candidate/debug/api-tester',
      icon: <TestTube className="h-5 w-5" />,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      title: 'Performance Monitor',
      description: 'Monitor app performance metrics',
      href: '/protected/candidate/debug/performance',
      icon: <Activity className="h-5 w-5" />,
      color: 'text-red-600 bg-red-100'
    },
    {
      title: 'Environment Inspector',
      description: 'View environment variables and config',
      href: '/protected/candidate/debug/environment',
      icon: <Settings className="h-5 w-5" />,
      color: 'text-gray-600 bg-gray-100'
    }
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-3 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 max-h-96 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Code className="h-5 w-5 text-blue-600" />
                Debug Tools
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {debugTools.map((tool, index) => (
                <Link
                  key={index}
                  href={tool.href}
                  className="block p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                  onClick={() => setIsExpanded(false)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded ${tool.color}`}>
                      {tool.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 text-sm group-hover:text-blue-600 transition-colors">
                        {tool.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center">
                Development Environment Only
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bug className="h-5 w-5" />
        {!isExpanded && (
          <span className="text-sm font-medium hidden sm:block">Debug</span>
        )}
      </motion.button>
    </div>
  );
}

// Hook to easily add debug menu to any page
export function useDebugMenu() {
  const [showDebugMenu, setShowDebugMenu] = useState(true);

  const toggleDebugMenu = () => setShowDebugMenu(!showDebugMenu);
  const hideDebugMenu = () => setShowDebugMenu(false);

  return {
    showDebugMenu,
    toggleDebugMenu,
    hideDebugMenu,
    DebugMenuComponent: () => (
      <DebugMenu 
        isVisible={showDebugMenu} 
        onClose={hideDebugMenu} 
      />
    )
  };
}
import React, { useState, useEffect } from 'react';
import { Achievement } from '@/types/game';

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 500); // Allow exit animation to complete
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);
  
  if (!achievement) return null;
  
  return (
    <div 
      className={`fixed top-24 right-4 max-w-sm w-full transform transition-all duration-500 z-50 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-amber-50 border-2 border-amber-300 rounded-lg shadow-lg p-4 relative overflow-hidden">
        {/* Confetti effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#f59e0b', '#d97706', '#7e22ce', '#6366f1'][Math.floor(Math.random() * 4)],
                animation: `fall-confetti ${1 + Math.random() * 2}s linear forwards`,
                animationDelay: `${Math.random() * 0.5}s`
              }}
            />
          ))}
        </div>
        
        <div className="flex items-start">
          {/* Trophy icon */}
          <div className="mr-3 flex-shrink-0">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-2xl">
              {achievement.icon || '🏆'}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-amber-800 font-semibold">Achievement Unlocked!</h3>
                <h4 className="text-lg font-medium text-slate-800">{achievement.name}</h4>
              </div>
              
              <button 
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 500);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <p className="text-sm text-slate-600 mt-1">{achievement.description}</p>
            
            {/* XP reward */}
            <div className="mt-2 flex items-center text-purple-700 bg-purple-50 px-2 py-1 rounded text-xs font-medium w-fit">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              <span>+25 XP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementNotification; 
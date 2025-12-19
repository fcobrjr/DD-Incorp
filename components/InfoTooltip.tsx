
import React from 'react';

interface InfoTooltipProps {
  text: string;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ text, className = "", side = 'top' }) => {
  // Logic for positioning classes based on 'side'
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2"
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-900",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-900",
    left: "left-full top-1/2 -translate-y-1/2 border-l-gray-900",
    right: "right-full top-1/2 -translate-y-1/2 border-r-gray-900"
  };

  return (
    <div className={`group relative inline-block ml-1.5 align-middle ${className}`}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="14" 
        height="14" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="text-gray-400 hover:text-primary-600 cursor-help transition-colors"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
      
      {/* Tooltip box */}
      <div className={`absolute hidden group-hover:block w-48 p-2.5 bg-gray-900 text-white text-[11px] font-normal leading-relaxed rounded-lg shadow-2xl z-[100] pointer-events-none whitespace-normal ${positionClasses[side]}`}>
        {text}
        {/* Arrow */}
        <div className={`absolute border-[6px] border-transparent ${arrowClasses[side]}`}></div>
      </div>
    </div>
  );
};

export default InfoTooltip;

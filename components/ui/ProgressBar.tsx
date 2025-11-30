import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  colorClass?: string;
  heightClass?: string;
  showGlow?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  current, 
  total, 
  colorClass = "bg-gradient-to-r from-emerald-500 to-emerald-400",
  heightClass = "h-2",
  showGlow = true
}) => {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <div className={`w-full bg-zinc-800/50 rounded-full overflow-hidden ${heightClass} border border-white/5`}>
      <div 
        className={`${colorClass} h-full rounded-full transition-all duration-1000 ease-out relative`} 
        style={{ width: `${percentage}%` }}
      >
        {showGlow && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-full bg-white blur-[2px] opacity-50" />
        )}
      </div>
    </div>
  );
};
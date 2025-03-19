import React from 'react';

interface SplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
  vertical?: boolean;
  className?: string;
  leftWidth?: string;
  rightWidth?: string;
}

export function SplitView({
  left,
  right,
  vertical = false,
  className = '',
  leftWidth = "1fr",
  rightWidth = "1fr"
}: SplitViewProps) {
  if (vertical) {
    return (
      <div className={`grid grid-rows-2 gap-6 h-full ${className}`}>
        <div className="overflow-hidden">{left}</div>
        <div className="overflow-hidden">{right}</div>
      </div>
    );
  }

  return (
    <div 
      className={`grid gap-6 h-full ${className}`}
      style={{ 
        gridTemplateColumns: `${leftWidth} ${rightWidth}` 
      }}
    >
      <div className="overflow-hidden">{left}</div>
      <div className="overflow-hidden">{right}</div>
    </div>
  );
}
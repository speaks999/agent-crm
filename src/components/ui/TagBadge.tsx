'use client';

import React from 'react';
import { X } from 'lucide-react';

export interface TagBadgeProps {
  tag: string; // Tag name to display
  color?: string; // Hex color (default: '#A2B758')
  onRemove?: () => void; // If provided, show X button
  className?: string;
  size?: 'sm' | 'md'; // Text size variants
}

// Convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function TagBadge({ 
  tag, 
  color = '#A2B758', 
  onRemove, 
  className = '',
  size = 'md' 
}: TagBadgeProps) {
  const bgColor = hexToRgba(color, 0.15);
  const borderColor = hexToRgba(color, 0.3);
  const textColor = color;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
        color: textColor,
      }}
    >
      {tag}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-sm hover:bg-black/10 p-0.5 transition-colors"
          aria-label={`Remove ${tag} tag`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}


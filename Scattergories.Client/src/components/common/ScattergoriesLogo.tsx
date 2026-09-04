import { memo } from 'react';

/**
 * ScattergoriesLogo — Carbon Design System brand logo.
 * Renders the 4-tile brand glyph (S/A/Z/!) inspired by the original logo.
 * Supports multiple sizes via className prop.
 */

interface ScattergoriesLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-20 h-20',
  xl: 'w-32 h-32',
};

export const ScattergoriesLogo = memo(function ScattergoriesLogo({
  size = 'md',
  className = '',
}: ScattergoriesLogoProps) {
  const sizeClass = sizes[size];

  return (
    <div className={`relative ${sizeClass} ${className}`}>
      {/* 4-Tile Brand Glyph Grid */}
      <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5 bg-primary rounded-xl shadow-md transform rotate-2">
        {/* S Tile — Circle, White */}
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
          <span className="font-bold text-primary leading-none" style={{ fontSize: size === 'sm' ? '8px' : size === 'md' ? '11px' : '16px' }}>
            S
          </span>
        </div>
        {/* A Tile — Rectangle, Primary Container */}
        <div className="w-full h-full rounded-md bg-primary-container flex items-center justify-center">
          <span className="font-bold text-white leading-none" style={{ fontSize: size === 'sm' ? '8px' : size === 'md' ? '11px' : '16px' }}>
            A
          </span>
        </div>
        {/* Z Tile — Rectangle, Carbon Cyan */}
        <div className="w-full h-full rounded-md bg-carbon-cyan flex items-center justify-center">
          <span className="font-bold text-white leading-none" style={{ fontSize: size === 'sm' ? '8px' : size === 'md' ? '11px' : '16px' }}>
            Z
          </span>
        </div>
        {/* ! Tile — Circle, White with Primary Border */}
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
          <span className="font-bold text-primary leading-none" style={{ fontSize: size === 'sm' ? '8px' : size === 'md' ? '11px' : '16px' }}>
            !
          </span>
        </div>
      </div>
    </div>
  );
});

/**
 * ScattergoriesBrand — Full brand component with logo + text.
 * Used in headers, landing pages, and splash screens.
 */

interface ScattergoriesBrandProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ScattergoriesBrand({ size = 'md', className = '' }: ScattergoriesBrandProps) {
  const textSize = size === 'sm' ? 'text-[14px]' : size === 'md' ? 'text-[18px]' : 'text-[28px]';
  const subtitleSize = size === 'sm' ? 'text-[10px]' : 'text-[12px]';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ScattergoriesLogo size={size === 'lg' ? 'lg' : 'md'} />
      <div className="flex flex-col min-w-0">
        <span className={`font-headline-sm ${textSize} text-on-surface truncate leading-tight font-bold`}>
          Scattergories<span className="text-primary-container">!</span>
        </span>
        <span className={`${subtitleSize} text-on-surface-variant truncate uppercase tracking-wider`}>
          Word Rush Live
        </span>
      </div>
    </div>
  );
}

import React from 'react';

export interface BrandWatermarkProps {
  opacity?: number;
  className?: string;
  maxSize?: string;
}

/**
 * Bilaal Restaurant Fine Dining Crest Watermark
 * Subtle low-opacity (8-12%) vector watermark positioned centrally across viewport canvases
 */
export const BrandWatermark: React.FC<BrandWatermarkProps> = ({
  opacity = 0.10,
  className = '',
  maxSize = 'max-w-[550px]'
}) => {
  return (
    <div 
      className={`pointer-events-none absolute inset-0 flex items-center justify-center z-0 overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      <img
        src="/assets/menu-watermark.svg"
        alt="Bilaal Restaurant Fine Dining Crest"
        aria-hidden="true"
        referrerPolicy="no-referrer"
        style={{ opacity }}
        className={`grayscale invert brightness-75 w-4/5 max-h-[75vh] object-contain select-none pointer-events-none ${maxSize}`}
      />
    </div>
  );
};

export default BrandWatermark;

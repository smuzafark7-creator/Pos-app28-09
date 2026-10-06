import React from 'react';
import { OrderType } from '../types';

export interface BrandWatermarkProps {
  opacity?: number;
  className?: string;
  maxSize?: string;
  orderType?: OrderType;
}

/**
 * Bilaal Restaurant Fine Dining Crest Watermark
 * Fixed viewport-centered watermark positioned directly under the main container
 */
export const BrandWatermark: React.FC<BrandWatermarkProps> = ({
  opacity = 0.18,
  className = '',
  maxSize = 'max-w-[600px]',
  orderType = 'dine_in'
}) => {
  const normType = (orderType || 'dine_in').toLowerCase();
  const watermarkSrc =
    normType === 'takeaway'
      ? '/assets/watermark-takeaway.svg'
      : normType === 'delivery'
      ? '/assets/watermark-delivery.svg'
      : '/assets/watermark-dine-in.svg';

  return (
    <div 
      id="brand-watermark-fixed-container"
      className={`brand-watermark-fixed pointer-events-none fixed select-none ${className}`}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(600px, 80vw)',
        height: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <img
        src={watermarkSrc}
        alt="Bilaal Restaurant Fine Dining Crest"
        aria-hidden="true"
        referrerPolicy="no-referrer"
        style={{
          opacity,
          width: '100%',
          height: 'auto',
          maxHeight: '75vh',
          pointerEvents: 'none',
        }}
        className={`grayscale invert brightness-75 object-contain select-none pointer-events-none ${maxSize}`}
      />
    </div>
  );
};

export default BrandWatermark;

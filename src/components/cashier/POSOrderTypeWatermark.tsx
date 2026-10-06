import React from 'react';
import { OrderType } from '../../types';

export interface POSOrderTypeWatermarkProps {
  orderType: OrderType;
  opacity?: number;
  className?: string;
}

export const POSOrderTypeWatermark: React.FC<POSOrderTypeWatermarkProps> = ({
  orderType,
  opacity = 0.08,
  className = '',
}) => {
  const normType = (orderType || 'dine_in').toLowerCase();

  return (
    <div
      className={`pos-dynamic-watermark flex items-center justify-center pointer-events-none select-none text-white ${className}`}
      style={{ width: '320px', height: '320px', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      {normType === 'dine_in' && (
        <svg
          viewBox="0 0 600 600"
          width="320"
          height="320"
          style={{ width: '320px', height: '320px' }}
          className="w-[320px] h-[320px] object-contain drop-shadow-sm select-none pointer-events-none"
          fill="none"
          stroke="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Decorative Concentric Rings */}
          <circle cx="300" cy="300" r="280" strokeWidth="2.5" strokeOpacity="0.85" />
          <circle cx="300" cy="300" r="268" strokeWidth="1" strokeDasharray="6 6" strokeOpacity="0.65" />
          <circle cx="300" cy="300" r="256" strokeWidth="1.5" strokeOpacity="0.75" />

          {/* Top Stars & Cardinal Dots */}
          <g fill="currentColor" stroke="none" fillOpacity="0.9">
            <polygon points="300,56 304,68 316,68 306,75 310,87 300,80 290,87 294,75 284,68 296,68" />
            <polygon points="260,67 263,76 272,76 265,81 268,90 260,85 252,90 255,81 248,76 257,76" transform="scale(0.8) translate(65, 18)" />
            <polygon points="340,67 343,76 352,76 345,81 348,90 340,85 332,90 335,81 328,76 337,76" transform="scale(0.8) translate(85, 18)" />
            <circle cx="300" cy="36" r="4" />
            <circle cx="300" cy="564" r="4" />
            <circle cx="36" cy="300" r="4" />
            <circle cx="564" cy="300" r="4" />
          </g>

          {/* Laurel Wreath Left */}
          <g strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.8">
            <path d="M 180,440 C 130,380 130,220 180,160" />
            <path d="M 175,430 C 150,425 140,405 155,395 C 165,405 175,415 175,430 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 160,395 C 135,390 128,370 142,360 C 152,370 160,380 160,395 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 150,360 C 125,355 120,335 135,325 C 145,335 150,345 150,360 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 145,320 C 120,315 118,295 132,285 C 142,295 145,305 145,320 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 148,280 C 125,270 125,250 140,242 C 148,252 148,265 148,280 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 158,240 C 138,225 140,205 155,200 C 160,212 158,228 158,240 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 175,200 C 158,185 165,165 180,165 C 182,178 178,190 175,200 Z" fill="currentColor" fillOpacity="0.2" />
          </g>

          {/* Laurel Wreath Right */}
          <g strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.8">
            <path d="M 420,440 C 470,380 470,220 420,160" />
            <path d="M 425,430 C 450,425 460,405 445,395 C 435,405 425,415 425,430 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 440,395 C 465,390 472,370 458,360 C 448,370 440,380 440,395 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 450,360 C 475,355 480,335 465,325 C 455,335 450,345 450,360 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 455,320 C 480,315 482,295 468,285 C 458,295 455,305 455,320 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 452,280 C 475,270 475,250 460,242 C 452,252 452,265 452,280 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 442,240 C 462,225 460,205 445,200 C 440,212 442,228 442,240 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 425,200 C 442,185 435,165 420,165 C 418,178 422,190 425,200 Z" fill="currentColor" fillOpacity="0.2" />
          </g>

          {/* Chef Hat at Top Center */}
          <g strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9">
            <path d="M 240,200 C 220,195 215,160 240,145 C 240,115 280,110 300,130 C 320,110 360,115 360,145 C 385,160 380,195 360,200" fill="currentColor" fillOpacity="0.1" />
            <rect x="238" y="200" width="124" height="24" rx="4" fill="currentColor" fillOpacity="0.2" />
            <line x1="248" y1="212" x2="352" y2="212" strokeWidth="1" strokeDasharray="3 3" />
          </g>

          {/* Crossed Fork & Chef Knife */}
          <g strokeWidth="2.5" fill="currentColor" fillOpacity="0.15" strokeLinecap="round" strokeLinejoin="round">
            <g transform="rotate(45 300 290)">
              <path d="M 294,140 Q 306,170 306,250 L 294,250 Z" />
              <rect x="291" y="250" width="18" height="8" rx="2" />
              <rect x="293" y="258" width="14" height="75" rx="4" />
              <circle cx="300" cy="275" r="2.5" fill="currentColor" />
              <circle cx="300" cy="305" r="2.5" fill="currentColor" />
            </g>
            <g transform="rotate(-45 300 290)">
              <path d="M 288,140 L 288,190 Q 288,220 300,230 Q 312,220 312,190 L 312,140" fill="none" />
              <line x1="296" y1="140" x2="296" y2="190" />
              <line x1="304" y1="140" x2="304" y2="190" />
              <path d="M 300,230 L 300,258" />
              <rect x="293" y="258" width="14" height="75" rx="4" />
              <circle cx="300" cy="275" r="2.5" fill="currentColor" />
              <circle cx="300" cy="305" r="2.5" fill="currentColor" />
            </g>
          </g>

          {/* Cloche Dome & Platter */}
          <g strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Steam Swirls */}
            <path d="M 285,260 C 280,250 290,240 285,230" strokeWidth="1.5" strokeOpacity="0.7" />
            <path d="M 300,255 C 295,245 305,235 300,225" strokeWidth="1.5" strokeOpacity="0.7" />
            <path d="M 315,260 C 310,250 320,240 315,230" strokeWidth="1.5" strokeOpacity="0.7" />
            {/* Cloche Platter */}
            <ellipse cx="300" cy="320" rx="72" ry="12" fill="currentColor" fillOpacity="0.25" strokeWidth="2.5" />
            <path d="M 242,320 C 242,280 358,280 358,320 Z" fill="currentColor" fillOpacity="0.15" strokeWidth="2.5" />
            <circle cx="300" cy="275" r="6" fill="currentColor" fillOpacity="0.5" strokeWidth="2" />
          </g>

          {/* Decorative Ribbon Banner */}
          <g strokeWidth="2" fill="none" strokeOpacity="0.9">
            <path d="M 180,445 L 205,435 L 395,435 L 420,445 L 405,465 L 395,455 L 205,455 L 195,465 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 180,445 L 205,455 L 205,435" />
            <path d="M 420,445 L 395,455 L 395,435" />
          </g>

          {/* Typography Inscriptions */}
          <g fill="currentColor" stroke="none" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800">
            <text x="300" y="375" fontSize="13" letterSpacing="3" fillOpacity="0.95">BILAAL RESTAURANT</text>
            <text x="300" y="396" fontSize="10" letterSpacing="2" fillOpacity="0.8">FINE DINING</text>
            <text x="300" y="449" fontSize="12" letterSpacing="4" fillOpacity="0.98">DINE IN</text>
            <text x="300" y="485" fontSize="9" letterSpacing="2.5" fillOpacity="0.75">TABLE SERVICE • EST. 2024</text>
          </g>
        </svg>
      )}

      {normType === 'takeaway' && (
        <svg
          viewBox="0 0 600 600"
          width="320"
          height="320"
          style={{ width: '320px', height: '320px' }}
          className="w-[320px] h-[320px] object-contain drop-shadow-sm select-none pointer-events-none"
          fill="none"
          stroke="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Decorative Concentric Rings */}
          <circle cx="300" cy="300" r="280" strokeWidth="2.5" strokeOpacity="0.85" />
          <circle cx="300" cy="300" r="268" strokeWidth="1" strokeDasharray="6 6" strokeOpacity="0.65" />
          <circle cx="300" cy="300" r="256" strokeWidth="1.5" strokeOpacity="0.75" />

          {/* Top Stars & Cardinal Dots */}
          <g fill="currentColor" stroke="none" fillOpacity="0.9">
            <polygon points="300,56 304,68 316,68 306,75 310,87 300,80 290,87 294,75 284,68 296,68" />
            <polygon points="260,67 263,76 272,76 265,81 268,90 260,85 252,90 255,81 248,76 257,76" transform="scale(0.8) translate(65, 18)" />
            <polygon points="340,67 343,76 352,76 345,81 348,90 340,85 332,90 335,81 328,76 337,76" transform="scale(0.8) translate(85, 18)" />
            <circle cx="300" cy="36" r="4" />
            <circle cx="300" cy="564" r="4" />
            <circle cx="36" cy="300" r="4" />
            <circle cx="564" cy="300" r="4" />
          </g>

          {/* Laurel Wreaths */}
          <g strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.8">
            {/* Left */}
            <path d="M 180,440 C 130,380 130,220 180,160" />
            <path d="M 175,430 C 150,425 140,405 155,395 C 165,405 175,415 175,430 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 160,395 C 135,390 128,370 142,360 C 152,370 160,380 160,395 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 150,360 C 125,355 120,335 135,325 C 145,335 150,345 150,360 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 145,320 C 120,315 118,295 132,285 C 142,295 145,305 145,320 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 148,280 C 125,270 125,250 140,242 C 148,252 148,265 148,280 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 158,240 C 138,225 140,205 155,200 C 160,212 158,228 158,240 Z" fill="currentColor" fillOpacity="0.2" />
            {/* Right */}
            <path d="M 420,440 C 470,380 470,220 420,160" />
            <path d="M 425,430 C 450,425 460,405 445,395 C 435,405 425,415 425,430 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 440,395 C 465,390 472,370 458,360 C 448,370 440,380 440,395 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 450,360 C 475,355 480,335 465,325 C 455,335 450,345 450,360 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 455,320 C 480,315 482,295 468,285 C 458,295 455,305 455,320 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 452,280 C 475,270 475,250 460,242 C 452,252 452,265 452,280 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 442,240 C 462,225 460,205 445,200 C 440,212 442,228 442,240 Z" fill="currentColor" fillOpacity="0.2" />
          </g>

          {/* Central Motif: Premium Takeaway Paper Bag & Parcel Box */}
          <g strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Bag Handle */}
            <path d="M 270,160 C 270,135 330,135 330,160" strokeWidth="3" />
            <path d="M 275,160 C 275,142 325,142 325,160" strokeWidth="2" strokeDasharray="3 3" />

            {/* Bag Fold Top Edge */}
            <polygon points="240,160 360,160 370,180 230,180" fill="currentColor" fillOpacity="0.2" strokeWidth="2.5" />

            {/* Main Bag Body */}
            <polygon points="230,180 370,180 358,310 242,310" fill="currentColor" fillOpacity="0.12" strokeWidth="2.5" />
            <line x1="242" y1="310" x2="358" y2="310" strokeWidth="3" />

            {/* Bag Accordion Side Folds */}
            <line x1="255" y1="180" x2="260" y2="310" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.6" />
            <line x1="345" y1="180" x2="340" y2="310" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.6" />

            {/* Cutlery / Fork & Spoon Badge on Bag */}
            <circle cx="300" cy="245" r="32" fill="currentColor" fillOpacity="0.25" strokeWidth="2" />
            <g transform="translate(300, 245) scale(0.6) translate(-300, -245)" strokeWidth="3">
              {/* Spoon */}
              <ellipse cx="288" cy="228" rx="8" ry="12" fill="currentColor" fillOpacity="0.6" />
              <line x1="288" y1="240" x2="288" y2="268" strokeWidth="3" />
              {/* Fork */}
              <path d="M 306,218 L 306,236 Q 312,242 312,250 L 312,268" />
              <line x1="312" y1="218" x2="312" y2="236" />
              <path d="M 318,218 L 318,236 Q 312,242 312,250" />
            </g>

            {/* Steam Swirls above Bag */}
            <path d="M 255,145 C 250,135 260,125 255,115" strokeWidth="1.5" strokeOpacity="0.7" />
            <path d="M 345,145 C 340,135 350,125 345,115" strokeWidth="1.5" strokeOpacity="0.7" />
          </g>

          {/* Decorative Ribbon Banner */}
          <g strokeWidth="2" fill="none" strokeOpacity="0.9">
            <path d="M 180,445 L 205,435 L 395,435 L 420,445 L 405,465 L 395,455 L 205,455 L 195,465 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 180,445 L 205,455 L 205,435" />
            <path d="M 420,445 L 395,455 L 395,435" />
          </g>

          {/* Typography Inscriptions */}
          <g fill="currentColor" stroke="none" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800">
            <text x="300" y="375" fontSize="13" letterSpacing="3" fillOpacity="0.95">BILAAL RESTAURANT</text>
            <text x="300" y="396" fontSize="10" letterSpacing="2" fillOpacity="0.8">PARCEL &amp; PICKUP</text>
            <text x="300" y="449" fontSize="12" letterSpacing="4" fillOpacity="0.98">TAKEAWAY</text>
            <text x="300" y="485" fontSize="9" letterSpacing="2.5" fillOpacity="0.75">EXPRESS COUNTER • EST. 2024</text>
          </g>
        </svg>
      )}

      {normType === 'delivery' && (
        <svg
          viewBox="0 0 600 600"
          width="320"
          height="320"
          style={{ width: '320px', height: '320px' }}
          className="w-[320px] h-[320px] object-contain drop-shadow-sm select-none pointer-events-none"
          fill="none"
          stroke="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Decorative Concentric Rings */}
          <circle cx="300" cy="300" r="280" strokeWidth="2.5" strokeOpacity="0.85" />
          <circle cx="300" cy="300" r="268" strokeWidth="1" strokeDasharray="6 6" strokeOpacity="0.65" />
          <circle cx="300" cy="300" r="256" strokeWidth="1.5" strokeOpacity="0.75" />

          {/* Top Stars & Cardinal Dots */}
          <g fill="currentColor" stroke="none" fillOpacity="0.9">
            <polygon points="300,56 304,68 316,68 306,75 310,87 300,80 290,87 294,75 284,68 296,68" />
            <polygon points="260,67 263,76 272,76 265,81 268,90 260,85 252,90 255,81 248,76 257,76" transform="scale(0.8) translate(65, 18)" />
            <polygon points="340,67 343,76 352,76 345,81 348,90 340,85 332,90 335,81 328,76 337,76" transform="scale(0.8) translate(85, 18)" />
            <circle cx="300" cy="36" r="4" />
            <circle cx="300" cy="564" r="4" />
            <circle cx="36" cy="300" r="4" />
            <circle cx="564" cy="300" r="4" />
          </g>

          {/* Laurel Wreaths */}
          <g strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.8">
            {/* Left */}
            <path d="M 180,440 C 130,380 130,220 180,160" />
            <path d="M 175,430 C 150,425 140,405 155,395 C 165,405 175,415 175,430 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 160,395 C 135,390 128,370 142,360 C 152,370 160,380 160,395 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 150,360 C 125,355 120,335 135,325 C 145,335 150,345 150,360 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 145,320 C 120,315 118,295 132,285 C 142,295 145,305 145,320 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 148,280 C 125,270 125,250 140,242 C 148,252 148,265 148,280 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 158,240 C 138,225 140,205 155,200 C 160,212 158,228 158,240 Z" fill="currentColor" fillOpacity="0.2" />
            {/* Right */}
            <path d="M 420,440 C 470,380 470,220 420,160" />
            <path d="M 425,430 C 450,425 460,405 445,395 C 435,405 425,415 425,430 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 440,395 C 465,390 472,370 458,360 C 448,370 440,380 440,395 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 450,360 C 475,355 480,335 465,325 C 455,335 450,345 450,360 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 455,320 C 480,315 482,295 468,285 C 458,295 455,305 455,320 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 452,280 C 475,270 475,250 460,242 C 452,252 452,265 452,280 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 442,240 C 462,225 460,205 445,200 C 440,212 442,228 442,240 Z" fill="currentColor" fillOpacity="0.2" />
          </g>

          {/* Central Motif: Express Delivery Scooter with Courier Parcel Box */}
          <g strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Speed motion lines behind scooter */}
            <line x1="175" y1="210" x2="205" y2="210" strokeWidth="2" strokeDasharray="6 4" strokeOpacity="0.7" />
            <line x1="160" y1="230" x2="210" y2="230" strokeWidth="2.5" strokeOpacity="0.8" />
            <line x1="170" y1="250" x2="200" y2="250" strokeWidth="2" strokeDasharray="5 3" strokeOpacity="0.7" />

            {/* Rear Wheel */}
            <circle cx="230" cy="275" r="26" strokeWidth="3" fill="currentColor" fillOpacity="0.1" />
            <circle cx="230" cy="275" r="14" strokeWidth="2" />
            <circle cx="230" cy="275" r="4" fill="currentColor" />

            {/* Front Wheel */}
            <circle cx="365" cy="275" r="26" strokeWidth="3" fill="currentColor" fillOpacity="0.1" />
            <circle cx="365" cy="275" r="14" strokeWidth="2" />
            <circle cx="365" cy="275" r="4" fill="currentColor" />

            {/* Scooter Body Chassis & Floorboard */}
            <path d="M 230,275 L 260,275 L 285,275 L 310,245 L 345,210" strokeWidth="3.5" />
            <path d="M 255,275 L 310,275 L 325,245" strokeWidth="3.5" />

            {/* Front Steering Column, Handlebar & Windshield */}
            <line x1="365" y1="275" x2="345" y2="195" strokeWidth="3.5" />
            <path d="M 335,190 L 358,190" strokeWidth="4" />
            <path d="M 345,190 L 350,165" strokeWidth="2" strokeOpacity="0.75" />
            {/* Headlight */}
            <path d="M 358,205 L 375,205" strokeWidth="3" />

            {/* Delivery Courier Cargo Box on Rear */}
            <rect x="220" y="165" width="56" height="52" rx="5" fill="currentColor" fillOpacity="0.25" strokeWidth="3" />
            <line x1="220" y1="185" x2="276" y2="185" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Fast Delivery Bolt / Star on Box */}
            <polygon points="248,172 254,172 246,182 252,182 244,196 250,188 244,188" fill="currentColor" stroke="none" />

            {/* Driver Seat & Cushion */}
            <path d="M 276,215 C 276,205 315,205 320,225" strokeWidth="3" fill="currentColor" fillOpacity="0.2" />

            {/* Road Speed Trail */}
            <line x1="180" y1="305" x2="420" y2="305" strokeWidth="2" strokeDasharray="16 8" strokeOpacity="0.6" />
          </g>

          {/* Decorative Ribbon Banner */}
          <g strokeWidth="2" fill="none" strokeOpacity="0.9">
            <path d="M 180,445 L 205,435 L 395,435 L 420,445 L 405,465 L 395,455 L 205,455 L 195,465 Z" fill="currentColor" fillOpacity="0.2" />
            <path d="M 180,445 L 205,455 L 205,435" />
            <path d="M 420,445 L 395,455 L 395,435" />
          </g>

          {/* Typography Inscriptions */}
          <g fill="currentColor" stroke="none" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800">
            <text x="300" y="375" fontSize="13" letterSpacing="3" fillOpacity="0.95">BILAAL RESTAURANT</text>
            <text x="300" y="396" fontSize="10" letterSpacing="2" fillOpacity="0.8">DOORSTEP DISPATCH</text>
            <text x="300" y="449" fontSize="12" letterSpacing="4" fillOpacity="0.98">DELIVERY</text>
            <text x="300" y="485" fontSize="9" letterSpacing="2.5" fillOpacity="0.75">FAST COURIER • EST. 2024</text>
          </g>
        </svg>
      )}
    </div>
  );
};

export default POSOrderTypeWatermark;

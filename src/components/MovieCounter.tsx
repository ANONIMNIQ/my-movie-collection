import React from 'react';
import FlipNumbers from 'react-flip-numbers';
import { useIsMobile } from '@/hooks/use-mobile';

interface MovieCounterProps {
  count: number;
}

const MovieCounter: React.FC<MovieCounterProps> = ({ count }) => {
  const isMobile = useIsMobile();
  const numberHeight = isMobile ? 60 : 90;
  // Increased width to give the font more space
  const numberWidth = isMobile ? 50 : 70;
  // Pad the number to always have at least 4 digits for a consistent look
  const numberString = String(count).padStart(4, '0');

  return (
    <div className="flex flex-col items-center my-4">
      <div className="relative font-orbitron font-bold text-primary tracking-wider">
        {/* Container to define the component's size */}
        <div style={{ height: `${numberHeight}px` }}>
          {/* Static background boxes that look like flip clock tiles */}
          <div className="flex gap-2">
            {numberString.split('').map((_, index) => (
              <div
                key={index}
                className="relative bg-[#1a1a1a] rounded-lg shadow-lg border border-white/10"
                style={{ height: `${numberHeight}px`, width: `${numberWidth}px` }}
              >
                {/* The horizontal split line */}
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-black/40 -translate-y-1/2 z-10" />
              </div>
            ))}
          </div>

          {/* The FlipNumbers component is overlaid on top with a transparent background */}
          <div className="absolute inset-0 custom-flip-wrapper">
            <FlipNumbers
              height={numberHeight}
              width={numberWidth}
              color="hsl(var(--primary))"
              background="transparent"
              play
              perspective={1000}
              numbers={numberString}
            />
          </div>
        </div>
      </div>
      <h2 className="text-xl md:text-2xl text-muted-foreground font-semibold tracking-widest mt-4 uppercase">
        Movies in Collection
      </h2>
    </div>
  );
};

export default MovieCounter;
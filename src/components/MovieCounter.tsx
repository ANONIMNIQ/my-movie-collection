import React from 'react';
import FlipNumbers from 'react-flip-numbers';
import { useIsMobile } from '@/hooks/use-mobile';

interface MovieCounterProps {
  count: number;
}

const MovieCounter: React.FC<MovieCounterProps> = ({ count }) => {
  const isMobile = useIsMobile();
  const numberHeight = isMobile ? 60 : 90;
  const numberWidth = isMobile ? 40 : 60;
  const numberString = String(count).padStart(4, '0');
  const gap = '0.5rem'; // 8px

  // Calculate the total width of the counter to ensure the container is sized correctly
  const totalWidth = `calc(${numberString.length} * ${numberWidth}px + ${numberString.length - 1} * ${gap})`;

  return (
    <div className="flex flex-col items-center my-4">
      <div
        className="relative font-roboto-mono font-bold text-primary tracking-wider"
        style={{ height: `${numberHeight}px`, width: totalWidth }}
      >
        {/* Static background boxes that look like flip clock tiles */}
        <div className="absolute inset-0 flex justify-center" style={{ gap }}>
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
      <h2 className="text-xl md:text-2xl text-muted-foreground font-semibold tracking-widest mt-4 uppercase">
        Movies in Collection
      </h2>
    </div>
  );
};

export default MovieCounter;
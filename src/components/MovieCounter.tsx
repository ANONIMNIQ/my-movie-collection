import React from 'react';
import FlipNumbers from 'react-flip-numbers';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils'; // Import cn utility

interface MovieCounterProps {
  count: number;
  numberColor?: string; // New prop for FlipNumbers color
  labelColor?: string;  // New prop for the "Movies in Collection" label color
}

const MovieCounter: React.FC<MovieCounterProps> = ({ count, numberColor, labelColor }) => {
  const isMobile = useIsMobile();
  const numberHeight = isMobile ? 60 : 90;
  const numberWidth = isMobile ? 40 : 60;
  const numberString = String(count).padStart(4, '0');

  return (
    <div className="flex flex-col items-center my-4">
      <div
        className="font-roboto-mono font-bold tracking-wider custom-flip-wrapper"
        style={{
          '--number-height': `${numberHeight}px`,
          '--number-width': `${numberWidth}px`,
        } as React.CSSProperties}
      >
        <FlipNumbers
          height={numberHeight}
          width={numberWidth}
          color={numberColor || "hsl(var(--primary))"} // Use numberColor prop or default
          background="transparent"
          play
          perspective={1000}
          numbers={numberString}
        />
      </div>
      <h2 className={cn(
        "text-xl md:text-2xl font-semibold tracking-widest mt-4 uppercase",
        labelColor ? `text-[${labelColor}]` : "text-muted-foreground" // Use labelColor prop or default
      )}>
        Movies in Collection
      </h2>
    </div>
  );
};

export default MovieCounter;
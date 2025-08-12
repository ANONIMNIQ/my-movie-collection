import React from 'react';
import FlipNumbers from 'react-flip-numbers';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils'; // Import cn utility

interface MovieCounterProps {
  count: number;
  numberColor?: string; // New prop for FlipNumbers color
  labelColor?: string;  // New prop for the "Movies in Collection" label color
  animateOnLoad?: boolean; // New prop to control animation start
}

const MovieCounter: React.FC<MovieCounterProps> = ({ count, numberColor, labelColor, animateOnLoad = true }) => {
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
          color={numberColor || "black"} // Use numberColor prop or default to black
          background="transparent"
          play={animateOnLoad} {/* Use animateOnLoad here */}
          perspective={1000}
          numbers={numberString}
        />
      </div>
      <h2 className={cn(
        "text-xl md:text-2xl font-semibold tracking-widest mt-4 uppercase",
        labelColor // labelColor is now expected to be a Tailwind class string
      )}>
        Movies in Collection
      </h2>
    </div>
  );
};

export default MovieCounter;
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
      <div className="font-orbitron font-bold text-primary tracking-wider custom-flip-wrapper">
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
      <h2 className="text-xl md:text-2xl text-muted-foreground font-semibold tracking-widest mt-4 uppercase">
        Movies in Collection
      </h2>
    </div>
  );
};

export default MovieCounter;
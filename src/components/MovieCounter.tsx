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

  return (
    <div className="flex flex-col items-center my-4">
      <div className="font-roboto-mono font-bold text-primary tracking-wider custom-flip-wrapper">
        <FlipNumbers
          height={numberHeight}
          width={numberWidth}
          color="hsl(var(--primary))"
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
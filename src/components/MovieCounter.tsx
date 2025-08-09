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

  return (
    <div className="flex flex-col items-center my-4">
      <div className="font-orbitron font-bold text-primary tracking-wider">
        <FlipNumbers
          height={numberHeight}
          width={numberWidth}
          color="hsl(var(--primary))"
          play
          perspective={1000}
          numbers={String(count)}
        />
      </div>
      <h2 className="text-xl md:text-2xl text-muted-foreground font-semibold tracking-widest mt-2 uppercase">
        Movies in Collection
      </h2>
    </div>
  );
};

export default MovieCounter;
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Movie } from '@/data/movies';

interface AlphabetFilterPopoverProps {
  movies: Movie[]; // The currently filtered movies to determine available letters
  onSelectLetter: (letter: string | null) => void;
  currentSelectedLetter: string | null;
}

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

const AlphabetFilterPopover: React.FC<AlphabetFilterPopoverProps> = ({
  movies,
  onSelectLetter,
  currentSelectedLetter,
}) => {
  const alphabet = useMemo(() => {
    const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
    return letters; // No 'All' here, 'All' is the trigger
  }, []);

  const availableFirstLetters = useMemo(() => {
    const firstLetters = new Set<string>();
    movies.forEach(movie => {
      if (movie.title && movie.title.length > 0) {
        firstLetters.add(movie.title.charAt(0).toUpperCase());
      }
    });
    return firstLetters;
  }, [movies]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-full text-white text-sm font-bold",
            "hover:bg-white/20 transition-colors",
            (currentSelectedLetter === null || currentSelectedLetter === 'All') && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => onSelectLetter(null)} // Click 'All' to clear filter
        >
          All
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2 bg-black/30 backdrop-blur-xl border-white/10 text-white flex flex-col items-center gap-2"
        side="right" // Appear to the right of the trigger
        align="start" // Align top of popover with top of trigger
        sideOffset={8} // Small offset from the trigger
      >
        {alphabet.map(letter => {
          const isActive = currentSelectedLetter === letter;
          const isDisabled = !availableFirstLetters.has(letter);

          return (
            <motion.div key={letter} variants={itemVariants} initial="hidden" animate="visible">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full text-white text-sm font-bold",
                  "hover:bg-white/20 transition-colors",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
                  isDisabled && "opacity-30 cursor-not-allowed"
                )}
                onClick={() => onSelectLetter(letter)}
                disabled={isDisabled}
              >
                {letter}
              </Button>
            </motion.div>
          );
        })}
      </PopoverContent>
    </Popover>
  );
};

export default AlphabetFilterPopover;
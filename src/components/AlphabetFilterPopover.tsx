import React, { useMemo, useState, useRef } from 'react';
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
  const [open, setOpen] = useState(false); // State to control popover open/close
  const timeoutRef = useRef<number | null>(null); // Ref for hover timeout

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

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setOpen(false);
    }, 100); // Small delay to allow moving mouse to content
  };

  const handleLetterClick = (letter: string | null) => {
    onSelectLetter(letter);
    setOpen(false); // Close popover after selection
  };

  return (
    <Popover open={open} onOpenChange={setOpen}> {/* Control open state */}
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-full text-white text-sm font-bold",
            "hover:bg-white/20 transition-colors",
            (currentSelectedLetter === null || currentSelectedLetter === 'All') && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onMouseEnter={handleMouseEnter} // Open on hover
          onMouseLeave={handleMouseLeave} // Close on leave (with delay)
          onClick={() => handleLetterClick(null)} // Click 'All' to clear filter
        >
          All
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2 bg-transparent border-none text-white flex flex-col items-center gap-2 shadow-none" // Removed background, border, shadow
        side="right" // Appear to the right of the trigger
        align="start" // Align top of popover with top of trigger
        sideOffset={8} // Small offset from the trigger
        onMouseEnter={handleMouseEnter} // Keep open when hovering over content
        onMouseLeave={handleMouseLeave} // Close on leave (with delay)
        style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }} // Max height and scrollability
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
                onClick={() => handleLetterClick(letter)}
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
import React, { useMemo, useState, useRef, useCallback } from 'react';
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
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null); // Ref for the scrollable content

  const alphabet = useMemo(() => {
    const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
    return letters;
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
    }, 100);
  };

  const handleLetterClick = (letter: string | null) => {
    onSelectLetter(letter);
    setOpen(false);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!contentRef.current) return;

    const { clientY } = e;
    const { top, height, scrollHeight } = contentRef.current.getBoundingClientRect();

    // Only scroll if content is actually overflowing
    if (scrollHeight <= height) return;

    // Calculate mouse position relative to the content area (0 to 1)
    const mouseY = clientY - top;
    const scrollPercentage = mouseY / height;

    // Calculate target scrollTop
    const targetScrollTop = scrollPercentage * (scrollHeight - height);

    // Apply smooth scroll
    contentRef.current.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth', // Smooth scrolling
    });
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-full text-white text-sm font-bold",
            "bg-black/30 backdrop-blur-xl shadow-lg", // Frosted glass for "All" button
            "hover:bg-white/20 transition-colors",
            (currentSelectedLetter === null || currentSelectedLetter === 'All') && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleLetterClick(null)}
        >
          All
        </Button>
      </PopoverTrigger>
      <PopoverContent
        ref={contentRef} // Assign ref here
        className="w-auto p-2 bg-transparent border-none text-white flex flex-col items-center gap-2 shadow-none hide-scrollbar" // Removed background, border, shadow, added hide-scrollbar
        side="bottom" // Position below the trigger
        align="center" // Center horizontally below the trigger
        sideOffset={8}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove} // Add mouse move handler
        style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }} // Changed to auto
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
                  "bg-black/30 backdrop-blur-xl shadow-lg", // Frosted glass for individual buttons
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
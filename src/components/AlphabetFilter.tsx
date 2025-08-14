import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Movie } from '@/data/movies';

interface AlphabetFilterProps {
  movies: Movie[]; // The currently filtered movies to determine available letters
  onSelectLetter: (letter: string | null) => void;
  currentSelectedLetter: string | null;
  headerHeight: number; // Height of the shrunken main header
  isVisible: boolean;
}

const AlphabetFilter: React.FC<AlphabetFilterProps> = ({
  movies,
  onSelectLetter,
  currentSelectedLetter,
  headerHeight,
  isVisible,
}) => {
  const alphabet = useMemo(() => {
    const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
    return ['All', ...letters];
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

  const containerVariants = {
    hidden: { opacity: 0, y: -10, transition: { duration: 0.15, ease: "easeOut" } },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut", staggerChildren: 0.02 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  // Calculate the top position for the alphabet filter
  const topPosition = headerHeight + 16 + 40 + 8; // Main header height + floating header top gap + floating header height + small gap

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="alphabet-filter"
          className="fixed left-4 z-[44] flex flex-col items-center gap-2 py-2 px-1 bg-black/30 backdrop-blur-xl rounded-lg shadow-lg"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={containerVariants}
          style={{ top: topPosition, maxHeight: `calc(100vh - ${topPosition + 16}px)`, overflowY: 'auto' }} // 16px for bottom padding
        >
          {alphabet.map(letter => {
            const isActive = currentSelectedLetter === letter || (currentSelectedLetter === null && letter === 'All');
            const isDisabled = letter !== 'All' && !availableFirstLetters.has(letter);

            return (
              <motion.div key={letter} variants={itemVariants}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-full text-white text-sm font-bold",
                    "hover:bg-white/20 transition-colors",
                    isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
                    isDisabled && "opacity-30 cursor-not-allowed"
                  )}
                  onClick={() => onSelectLetter(letter === 'All' ? null : letter)}
                  disabled={isDisabled}
                >
                  {letter}
                </Button>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlphabetFilter;
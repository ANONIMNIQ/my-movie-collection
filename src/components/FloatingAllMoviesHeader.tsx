import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import DynamicMovieCountHeader from './DynamicMovieCountHeader';

interface FloatingAllMoviesHeaderProps {
  count: number;
  searchQuery: string;
  sortAndFilter: string;
  allGenres: string[];
  allCountries: string[];
  isVisible: boolean;
  headerHeight: number; // This is the shrunken height of the main header
}

const FloatingAllMoviesHeader: React.FC<FloatingAllMoviesHeaderProps> = ({
  count,
  searchQuery,
  sortAndFilter,
  allGenres,
  allCountries,
  isVisible,
  headerHeight,
}) => {
  // Calculate the target Y position for the floating header, adding a small gap (e.g., 16px or 1rem)
  const targetY = headerHeight + 16; // 16px gap

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="floating-all-movies-header"
          className={cn(
            "fixed left-8 z-40", // Increased left padding from left-6 to left-8
            "flex items-center gap-2 bg-black/30 backdrop-blur-xl rounded-full p-2 shadow-lg w-fit", // Added rounded-full for pill shape
            "px-4 py-2" // Adjusted padding for better pill shape appearance
          )}
          initial={{ y: headerHeight, opacity: 0 }} // Start just below the header, invisible
          animate={{ y: targetY, opacity: 1 }} // Animate down to targetY and fade in
          exit={{ y: headerHeight, opacity: 0 }} // Exit back up to the bottom of the header
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ top: 0 }} // Initial top is 0, animation handles the slide down
        >
          <DynamicMovieCountHeader
            count={count}
            searchQuery={searchQuery}
            sortAndFilter={sortAndFilter}
            allGenres={allGenres}
            allCountries={allCountries}
            // Pass new styling props here for even smaller size
            titleClassName="text-base" // Make title even smaller
            numberClassName="text-base" // Make number container even smaller
            flipNumberHeight={16} // Smaller height for numbers
            flipNumberWidth={10}  // Smaller width for numbers
            flipNumberColor="white" // White color for numbers
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingAllMoviesHeader;
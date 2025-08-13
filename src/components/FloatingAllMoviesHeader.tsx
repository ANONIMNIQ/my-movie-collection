import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import DynamicMovieCountHeader from './DynamicMovieCountHeader';
import { Input } from '@/components/ui/input'; // Keep import for now, might be removed if not used elsewhere
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Keep import for now, might be removed if not used elsewhere
import { Separator } from '@/components/ui/separator'; // Keep import for now, might be removed if not used elsewhere

interface FloatingAllMoviesHeaderProps {
  count: number;
  searchQuery: string;
  sortAndFilter: string;
  allGenres: string[];
  allCountries: string[];
  isVisible: boolean;
  headerHeight: number;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
}

const FloatingAllMoviesHeader: React.FC<FloatingAllMoviesHeaderProps> = ({
  count,
  searchQuery,
  sortAndFilter,
  allGenres,
  allCountries,
  isVisible,
  headerHeight,
  isFilterOpen,
  setIsFilterOpen,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="floating-all-movies-header"
          className={cn(
            "fixed top-0 left-4 z-40",
            "flex items-center justify-between gap-2 bg-black/30 backdrop-blur-xl rounded-b-lg p-2 shadow-lg w-fit",
            isFilterOpen && "pointer-events-auto"
          )}
          initial={{ y: -headerHeight, opacity: 0 }}
          animate={{ y: headerHeight, opacity: 1 }}
          exit={{ y: -headerHeight, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ top: 0 }}
        >
          <DynamicMovieCountHeader
            count={count}
            searchQuery={searchQuery}
            sortAndFilter={sortAndFilter}
            allGenres={allGenres}
            allCountries={allCountries}
          />
          {/* Removed Input and Select from here */}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingAllMoviesHeader;
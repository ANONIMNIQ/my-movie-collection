import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import FlipNumbers from 'react-flip-numbers';
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile

interface DynamicMovieCountHeaderProps {
  count: number;
  searchQuery: string;
  sortAndFilter: string;
  allGenres: string[];
  allCountries: string[];
  selectedLetterFilter: string;
  titleClassName?: string;
  numberClassName?: string;
  flipNumberHeight?: number;
  flipNumberWidth?: number;
  flipNumberColor?: string;
}

const DynamicMovieCountHeader: React.FC<DynamicMovieCountHeaderProps> = ({
  count,
  searchQuery,
  sortAndFilter,
  allGenres,
  allCountries,
  selectedLetterFilter,
  titleClassName,
  numberClassName,
  flipNumberHeight,
  flipNumberWidth,
  flipNumberColor,
}) => {
  const isMobile = useIsMobile(); // Use the hook here

  const displayTitle = React.useMemo(() => {
    if (searchQuery) {
      return "Found Movies";
    }
    if (selectedLetterFilter !== "All") {
      return selectedLetterFilter;
    }
    if (allGenres.includes(sortAndFilter)) {
      return sortAndFilter;
    }
    if (allCountries.includes(sortAndFilter)) {
      return allCountries.find(c => c === sortAndFilter) || "All Movies";
    }
    return "All Movies";
  }, [searchQuery, sortAndFilter, allGenres, allCountries, selectedLetterFilter]);

  const numberString = String(count).padStart(4, '0');

  return (
    <div className="flex items-center gap-2">
      <h2 className={cn("text-xl md:text-3xl font-bold flex-shrink-0", titleClassName)}>
        {displayTitle}
      </h2>
      <div className={cn(
        "font-roboto-mono font-bold tracking-wider text-headerNumber flex-shrink-0",
        "text-xl md:text-3xl", // Default responsive font size
        numberClassName
      )}>
        <FlipNumbers
          height={flipNumberHeight || (isMobile ? 20 : 32)}
          width={flipNumberWidth || (isMobile ? 12 : 20)}
          color={flipNumberColor || "black"}
          background="transparent"
          play
          perspective={1000}
          numbers={numberString}
        />
      </div>
    </div>
  );
};

export default DynamicMovieCountHeader;
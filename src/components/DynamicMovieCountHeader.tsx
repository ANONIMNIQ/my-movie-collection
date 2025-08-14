import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import FlipNumbers from 'react-flip-numbers';

interface DynamicMovieCountHeaderProps {
  count: number;
  searchQuery: string;
  sortAndFilter: string;
  allGenres: string[];
  allCountries: string[];
  selectedLetter: string | null; // New prop for selected letter
  // New optional props for styling overrides
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
  selectedLetter, // Destructure new prop
  titleClassName,
  numberClassName,
  flipNumberHeight,
  flipNumberWidth,
  flipNumberColor,
}) => {
  const displayTitle = React.useMemo(() => {
    if (selectedLetter) { // Prioritize selected letter
      return `Movies starting with '${selectedLetter}'`;
    }
    if (searchQuery) {
      return "Found Movies";
    }
    if (allGenres.includes(sortAndFilter)) {
      return sortAndFilter;
    }
    if (allCountries.includes(sortAndFilter)) {
      return allCountries.find(c => c === sortAndFilter) || "All Movies";
    }
    return "All Movies";
  }, [searchQuery, sortAndFilter, allGenres, allCountries, selectedLetter]); // Add selectedLetter to dependencies

  const numberString = String(count).padStart(4, '0');

  return (
    <div className="flex items-center gap-2">
      <h2 className={cn("text-3xl font-bold", titleClassName)}>
        {displayTitle}
      </h2>
      <div className={cn("font-roboto-mono font-bold tracking-wider text-headerNumber text-3xl", numberClassName)}>
        <FlipNumbers
          height={flipNumberHeight || 32}
          width={flipNumberWidth || 20}
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
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
}

const DynamicMovieCountHeader: React.FC<DynamicMovieCountHeaderProps> = ({
  count,
  searchQuery,
  sortAndFilter,
  allGenres,
  allCountries,
}) => {
  const displayTitle = React.useMemo(() => {
    if (searchQuery) {
      return "Searched Movies";
    }
    if (allGenres.includes(sortAndFilter)) {
      return sortAndFilter; // Genre name
    }
    if (allCountries.includes(sortAndFilter)) {
      return sortAndFilter; // Country name
    }
    return "All Movies";
  }, [searchQuery, sortAndFilter, allGenres, allCountries]);

  const numberString = String(count).padStart(4, '0'); // Pad with leading zeros for consistent display

  return (
    <div className="flex items-center gap-2">
      <h2 className="text-3xl font-bold">
        {displayTitle}
      </h2>
      <div className="font-roboto-mono font-bold tracking-wider text-headerNumber text-3xl">
        (<FlipNumbers
          height={28} // Adjust height for smaller display
          width={18}  // Adjust width for smaller display
          color="#0F0F0F" // Black color for numbers
          background="transparent"
          play
          perspective={1000}
          numbers={numberString}
        />)
      </div>
    </div>
  );
};

export default DynamicMovieCountHeader;
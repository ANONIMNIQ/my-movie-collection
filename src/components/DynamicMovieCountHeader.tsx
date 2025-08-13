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
      return "Found Movies"; // Changed from "Searched Movies" to "Found Movies"
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
      <h2 className="text-2xl font-bold"> {/* Changed from text-3xl to text-2xl */}
        {displayTitle}
      </h2>
      <div className="font-roboto-mono font-bold tracking-wider text-white text-2xl"> {/* Changed text-headerNumber to text-white, and text-3xl to text-2xl */}
        <FlipNumbers
          height={24} // Adjusted height for smaller display
          width={16}  // Adjusted width for smaller display
          color="white" // Changed color to white
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
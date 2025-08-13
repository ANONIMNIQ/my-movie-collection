import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import DynamicMovieCountHeader from './DynamicMovieCountHeader';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface FloatingAllMoviesHeaderProps {
  count: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortAndFilter: string;
  setSortAndFilter: (filter: string) => void;
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
  setSearchQuery,
  sortAndFilter,
  setSortAndFilter,
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
            "fixed top-0 left-0 right-0 z-40 mx-auto",
            "flex items-center justify-between gap-2 bg-black/30 backdrop-blur-xl rounded-b-lg p-2 shadow-lg w-full max-w-7xl",
            isFilterOpen && "pointer-events-auto"
          )}
          initial={{ y: -headerHeight, opacity: 0 }}
          animate={{ y: headerHeight, opacity: 1 }}
          exit={{ y: -headerHeight, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ top: 0 }} // This will be overridden by animate.y
        >
          <DynamicMovieCountHeader
            count={count}
            searchQuery={searchQuery}
            sortAndFilter={sortAndFilter}
            allGenres={allGenres}
            allCountries={allCountries}
          />
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[200px] bg-transparent border-none focus:ring-0 !focus:outline-none !focus:border-transparent !focus-visible:ring-0 !focus-visible:outline-none !focus-visible:border-transparent text-white placeholder:text-gray-300 pl-4 custom-no-focus-outline"
            />
            <Select value={sortAndFilter} onValueChange={setSortAndFilter} onOpenChange={setIsFilterOpen}>
              <SelectTrigger className="w-[180px] bg-transparent border-none text-white focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Sort & Filter" />
              </SelectTrigger>
              <SelectContent className="bg-black/30 backdrop-blur-xl border-white/10 text-white">
                <SelectGroup>
                  <SelectLabel className="text-gray-400">Sort by</SelectLabel>
                  <SelectItem value="title-asc" className="focus:bg-white/20 focus:text-white">Title (A-Z)</SelectItem>
                  <SelectItem value="title-desc" className="focus:bg-white/20 focus:text-white">Title (Z-A)</SelectItem>
                  <SelectItem value="year-desc" className="focus:bg-white/20 focus:text-white">Release Date (Newest)</SelectItem>
                  <SelectItem value="year-asc" className="focus:bg-white/20 focus:text-white">Release Date (Oldest)</SelectItem>
                </SelectGroup>
                {allGenres.length > 0 && (
                  <>
                    <Separator className="my-1 bg-white/20" />
                    <SelectGroup>
                      <SelectLabel className="text-gray-400">Filter by Genre</SelectLabel>
                      {allGenres.map((genre) => (
                        <SelectItem key={genre} value={genre} className="focus:bg-white/20 focus:text-white">{genre}</SelectItem>
                      ))}
                    </SelectGroup>
                  </>
                )}
                {allCountries.length > 0 && (
                  <>
                    <Separator className="my-1 bg-white/20" />
                    <SelectGroup>
                      <SelectLabel className="text-gray-400">Filter by Country</SelectLabel>
                      {allCountries.map((country) => (
                        <SelectItem key={country} value={country} className="focus:bg-white/20 focus:text-white">{country}</SelectItem>
                      ))}
                    </SelectGroup>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingAllMoviesHeader;
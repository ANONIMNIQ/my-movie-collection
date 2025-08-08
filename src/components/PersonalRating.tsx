import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { showSuccess, showError } from '@/utils/toast';
import { useQueryClient } from '@tanstack/react-query';

interface PersonalRatingProps {
  movieId: string;
  initialRating?: number | null;
  readOnly?: boolean;
  onRatingChange?: (rating: number | null) => void; // New prop for form integration
}

const PersonalRating: React.FC<PersonalRatingProps> = ({ movieId, initialRating, readOnly = false, onRatingChange }) => {
  const { session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const [currentRating, setCurrentRating] = useState<number | null>(initialRating ?? null);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCurrentRating(initialRating ?? null);
    if (readOnly) {
      console.log(`PersonalRating (readOnly) for movie ${movieId}: initialRating =`, initialRating);
    }
  }, [initialRating, movieId, readOnly]);

  const handleRatingClick = async (ratingValue: number) => {
    if (readOnly || !userId || loading) return;

    setLoading(true);
    const newRating = ratingValue === currentRating ? null : ratingValue; // Toggle off if same rating clicked

    if (onRatingChange) {
      onRatingChange(newRating); // Notify parent component of change
      setCurrentRating(newRating); // Update local state immediately for responsiveness
      setLoading(false); // No async operation needed if handled by parent form submission
      return;
    }

    if (newRating === null) {
      // Delete existing rating
      const { error } = await supabase
        .from('user_ratings')
        .delete()
        .eq('user_id', userId)
        .eq('movie_id', movieId);

      if (error) {
        console.error("Error deleting rating:", error);
        showError("Failed to remove rating: " + error.message);
      } else {
        setCurrentRating(null);
        showSuccess("Rating removed!");
        queryClient.invalidateQueries({ queryKey: ['user_rating', movieId, userId] });
        queryClient.invalidateQueries({ queryKey: ['admin_user_rating', movieId, userId] }); // Invalidate admin rating too
      }
    } else {
      // Insert or update rating
      const { error } = await supabase
        .from('user_ratings')
        .upsert(
          { user_id: userId, movie_id: movieId, rating: newRating },
          { onConflict: 'user_id, movie_id' }
        );

      if (error) {
        console.error("Error saving rating:", error);
        showError("Failed to save rating: " + error.message);
      } else {
        setCurrentRating(newRating);
        showSuccess("Rating saved!");
        queryClient.invalidateQueries({ queryKey: ['user_rating', movieId, userId] });
        queryClient.invalidateQueries({ queryKey: ['admin_user_rating', movieId, userId] }); // Invalidate admin rating too
      }
    }
    setLoading(false);
  };

  const displayRating = currentRating !== null ? currentRating : (hoverRating > 0 ? hoverRating : null);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 10 }).map((_, index) => {
        const ratingValue = index + 1;
        const isFilled = readOnly
          ? ratingValue <= (initialRating ?? 0)
          : ratingValue <= (hoverRating || (currentRating ?? 0));

        return (
          <Star
            key={ratingValue}
            size={readOnly ? 14 : 20} {/* Changed size from 16 to 14 for readOnly */}
            className={cn(
              "transition-colors",
              isFilled
                ? "text-yellow-400"
                : "text-gray-400",
              !readOnly && "cursor-pointer hover:text-yellow-300 hover:scale-110", // Only apply interactive styles if not readOnly
              loading ? "opacity-50 cursor-not-allowed" : ""
            )}
            onMouseEnter={() => !readOnly && setHoverRating(ratingValue)}
            onMouseLeave={() => !readOnly && setHoverRating(0)}
            onClick={() => handleRatingClick(ratingValue)}
          />
        );
      })}
      {readOnly && typeof initialRating === 'number' && initialRating !== null && ( // Added typeof check for initialRating
        <span className="ml-1 text-sm font-medium text-muted-foreground">
          {initialRating.toFixed(1)}
        </span>
      )}
      {!readOnly && ( // Display "Rate it!" or current rating for interactive mode
        <span className="ml-2 text-sm font-medium">
          {typeof displayRating === 'number' ? displayRating.toFixed(1) : 'Rate it!'}
        </span>
      )}
    </div>
  );
};

export default PersonalRating;
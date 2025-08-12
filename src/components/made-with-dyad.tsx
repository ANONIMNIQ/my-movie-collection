import { Heart } from 'lucide-react'; // Import the Heart icon

export const MadeWithDyad = () => {
  return (
    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
      Made with <Heart className="inline-block h-4 w-4 text-red-500 align-middle mx-0.5" fill="currentColor" /> in Bulgaria with the help of{" "}
      <a
        href="https://www.dyad.sh/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-gray-700 dark:hover:text-gray-200 underline"
      >
        Dyad
      </a>
      , a collaboration between Georgi Pehlivanov & AI
    </div>
  );
};
import React, { useEffect } from 'react';

interface JustWatchWidgetProps {
  tmdbId: string;
}

// Declare JustWatchWidget on the window object for TypeScript
declare global {
  interface Window {
    JustWatchWidget: any;
  }
}

const JustWatchWidget: React.FC<JustWatchWidgetProps> = ({ tmdbId }) => {
  useEffect(() => {
    const initWidget = () => {
      if (window.JustWatchWidget) {
        const container = document.getElementById(`justwatch-widget-${tmdbId}`);
        if (container) {
          // Clear previous instance if any
          container.innerHTML = '';
          new window.JustWatchWidget({
            container: `#justwatch-widget-${tmdbId}`,
            objectType: 'movie',
            objectId: tmdbId,
            theme: 'dark',
          });
        }
      }
    };

    // The script is loaded asynchronously, so we need to check for its availability.
    if (window.JustWatchWidget) {
      initWidget();
    } else {
      // If the script isn't loaded yet, wait for it.
      const script = document.querySelector('script[src="https://widget.justwatch.com/justwatch-widget.js"]');
      script?.addEventListener('load', initWidget);
      
      // Cleanup the event listener
      return () => {
        script?.removeEventListener('load', initWidget);
      };
    }
  }, [tmdbId]);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">Where to Watch</h2>
      <div id={`justwatch-widget-${tmdbId}`}></div>
    </div>
  );
};

export default JustWatchWidget;
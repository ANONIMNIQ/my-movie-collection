import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface JustWatchWidgetProps {
  tmdbId: string;
  title: string;
}

// Declare JustWatchWidget on the window object for TypeScript
declare global {
  interface Window {
    JustWatchWidget: any;
  }
}

const JustWatchWidget: React.FC<JustWatchWidgetProps> = ({ tmdbId, title }) => {
  const [widgetFailed, setWidgetFailed] = useState(false);

  useEffect(() => {
    let timeoutId: number;

    const initWidget = () => {
      // Clear the timeout if the widget loads successfully
      clearTimeout(timeoutId);
      if (window.JustWatchWidget) {
        const container = document.getElementById(`justwatch-widget-${tmdbId}`);
        if (container) {
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

    // Set a timeout to check if the widget script has loaded.
    // If it hasn't loaded after 2 seconds, assume it was blocked.
    timeoutId = window.setTimeout(() => {
      if (!window.JustWatchWidget) {
        setWidgetFailed(true);
      }
    }, 2000);

    if (window.JustWatchWidget) {
      initWidget();
    } else {
      const script = document.querySelector('script[src="https://widget.justwatch.com/justwatch-widget.js"]');
      script?.addEventListener('load', initWidget);
      
      return () => {
        script?.removeEventListener('load', initWidget);
        clearTimeout(timeoutId);
      };
    }

    return () => clearTimeout(timeoutId);
  }, [tmdbId]);

  const justWatchUrl = `https://www.justwatch.com/search?q=${encodeURIComponent(title)}`;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">Where to Watch</h2>
      <div id={`justwatch-widget-${tmdbId}`}>
        {widgetFailed && (
          <div className="p-4 border border-dashed border-muted-foreground/50 rounded-lg text-center bg-card/50">
            <p className="text-muted-foreground mb-4">
              The "Where to Watch" widget couldn't be loaded. This might be due to a browser extension (like an ad blocker).
            </p>
            <Button asChild>
              <a href={justWatchUrl} target="_blank" rel="noopener noreferrer">
                Check on JustWatch.com <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JustWatchWidget;
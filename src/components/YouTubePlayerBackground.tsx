import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, VolumeX, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface YouTubePlayerBackgroundProps {
  videoId: string;
  delay?: number; // Delay in ms before auto-playing
}

// Declare YT globally for TypeScript
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const YouTubePlayerBackground: React.FC<YouTubePlayerBackgroundProps> = ({ videoId, delay = 0 }) => {
  const playerRef = useRef<any>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<number | null>(null);
  const [iframeDimensions, setIframeDimensions] = useState({ width: 0, height: 0 });
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  const calculateIframeDimensions = useCallback(() => {
    if (!parentRef.current) return;

    const parentWidth = parentRef.current.offsetWidth;
    const parentHeight = parentRef.current.offsetHeight;

    const parentAspectRatio = parentWidth / parentHeight;
    const targetVideoAspectRatio = 21 / 9;

    let newWidth, newHeight;

    if (parentAspectRatio > targetVideoAspectRatio) {
      newHeight = parentHeight;
      newWidth = parentHeight * targetVideoAspectRatio;
    } else {
      newWidth = parentWidth;
      newHeight = parentWidth / targetVideoAspectRatio;
    }

    setIframeDimensions({ width: newWidth, height: newHeight });
  }, []);

  const onPlayerReady = useCallback((event: any) => {
    setPlayerReady(true);
    event.target.mute();
    setIsMuted(true);
    setTimeout(() => {
      if (playerRef.current) {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    }, delay);
  }, [delay]);

  const onPlayerStateChange = useCallback((event: any) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
    } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
    }
  }, []);

  // Function to create the YouTube player
  const createYouTubePlayer = useCallback(() => {
    // Ensure YT API is loaded and the Player constructor is available
    if (!isApiLoaded || !window.YT || typeof window.YT.Player === 'undefined') {
      return;
    }

    // Ensure container ref is available and dimensions are calculated
    if (!iframeContainerRef.current || iframeDimensions.width === 0 || iframeDimensions.height === 0) {
      return;
    }

    // Destroy existing player if it exists to prevent multiple instances
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    playerRef.current = new window.YT.Player(iframeContainerRef.current, {
      videoId: videoId,
      width: iframeDimensions.width,
      height: iframeDimensions.height,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        loop: 1,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        playlist: videoId,
        mute: 1,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
  }, [isApiLoaded, videoId, iframeDimensions, onPlayerReady, onPlayerStateChange]);


  // Effect to load the YouTube Iframe API script
  useEffect(() => {
    // Define the global callback function for the YouTube API
    // This must be defined before the script loads, or immediately if it's already loaded.
    if (typeof window.onYouTubeIframeAPIReady === 'undefined') {
      window.onYouTubeIframeAPIReady = () => {
        setIsApiLoaded(true);
      };
    } else {
      // If it's already defined, ensure it also sets our state
      const originalOnReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        originalOnReady(); // Call any existing handler
        setIsApiLoaded(true);
      };
    }

    // Load YouTube API script only if it hasn't been loaded yet
    if (!document.getElementById('youtube-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    } else if (window.YT && typeof window.YT.Player !== 'undefined') {
      // If script is already loaded and YT.Player is available, set API loaded state immediately
      setIsApiLoaded(true);
    }

    // Add resize listener for responsive dimensions
    window.addEventListener('resize', calculateIframeDimensions);
    calculateIframeDimensions(); // Initial calculation on mount

    return () => {
      window.removeEventListener('resize', calculateIframeDimensions);
      // Cleanup player on unmount
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [calculateIframeDimensions]);

  // Effect to create the player when all conditions are met
  useEffect(() => {
    createYouTubePlayer();
  }, [createYouTubePlayer]);

  const togglePlayPause = useCallback(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const toggleMuteUnmute = useCallback(() => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
      } else {
        playerRef.current.mute();
      }
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleMouseEnter = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 2000); // Hide controls after 2 seconds of inactivity
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={parentRef}
    >
      <div
        ref={iframeContainerRef}
        style={{
          width: iframeDimensions.width,
          height: iframeDimensions.height,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      ></div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* Gradient overlay for bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/80 to-transparent"></div>

      {/* Controls */}
      {playerReady && (
        <div className={cn(
          "absolute bottom-4 left-4 flex gap-2 transition-opacity duration-300 z-50",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/20 hover:bg-white/30 text-white"
            onClick={togglePlayPause}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/20 hover:bg-white/30 text-white"
            onClick={toggleMuteUnmute}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        </div>
      )}
    </div>
  );
};

export default YouTubePlayerBackground;
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

const YouTubePlayerBackground: React.FC<YouTubePlayerBackgroundProps> = ({ videoId, delay = 3000 }) => {
  const playerRef = useRef<any>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null); // Reference to the div that will become the iframe
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<number | null>(null);

  const loadYouTubeAPI = useCallback(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        createPlayer();
      };
    } else {
      createPlayer();
    }
  }, [videoId]);

  const createPlayer = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.destroy(); // Destroy existing player if any
    }
    if (!iframeContainerRef.current) return;

    playerRef.current = new window.YT.Player(iframeContainerRef.current, {
      videoId: videoId,
      playerVars: {
        autoplay: 0, // Start paused, we'll control it with API
        controls: 0, // Hide default controls
        disablekb: 1, // Disable keyboard controls
        fs: 0, // Disable fullscreen button
        loop: 1, // Loop the video
        modestbranding: 1, // Hide YouTube logo
        rel: 0, // Do not show related videos
        showinfo: 0, // Hide video title and uploader info
        iv_load_policy: 3, // Hide video annotations
        playlist: videoId, // Required for looping
        mute: 1, // Start muted
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
  }, [videoId]);

  useEffect(() => {
    loadYouTubeAPI();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [loadYouTubeAPI]);

  const onPlayerReady = useCallback((event: any) => {
    setPlayerReady(true);
    event.target.mute(); // Ensure it's muted
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
      className="absolute inset-x-0 top-0 h-[60vh] overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {/* This div will be replaced by the iframe */}
        <div
          ref={iframeContainerRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.77vh] min-w-full h-[56.25vw] min-h-full"
        ></div>
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black opacity-70"></div>

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
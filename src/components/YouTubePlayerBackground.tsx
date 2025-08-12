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

const YouTubePlayerBackground: React.FC<YouTubePlayerBackgroundProps> = ({ videoId }) => {
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
  const [isInViewport, setIsInViewport] = useState(false);
  const [userPaused, setUserPaused] = useState(false); // Tracks if user manually paused

  const calculateIframeDimensions = useCallback(() => {
    if (!parentRef.current) return;
    const parentWidth = parentRef.current.offsetWidth;
    const parentHeight = parentRef.current.offsetHeight;
    const parentAspectRatio = parentWidth / parentHeight;
    const youtubePlayerAspectRatio = 16 / 9;
    let newWidth, newHeight;
    if (parentAspectRatio > youtubePlayerAspectRatio) {
      newWidth = parentWidth;
      newHeight = parentWidth / youtubePlayerAspectRatio;
    } else {
      newHeight = parentHeight;
      newWidth = parentHeight * youtubePlayerAspectRatio;
    }
    const zoomFactor = 1.35;
    setIframeDimensions({ width: newWidth * zoomFactor, height: newHeight * zoomFactor });
  }, []);

  const onPlayerReady = useCallback((event: any) => {
    setPlayerReady(true);
    event.target.mute(); // Ensure it's muted for autoplay on mobile
    setIsMuted(true);
  }, []);

  const onPlayerStateChange = useCallback((event: any) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
    } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
    }
  }, []);

  const createYouTubePlayer = useCallback(() => {
    if (!isApiLoaded || !window.YT || typeof window.YT.Player === 'undefined' || !iframeContainerRef.current || iframeDimensions.width === 0) {
      return;
    }
    // Destroy existing player if any
    if (playerRef.current) {
      playerRef.current.destroy();
    }
    // Create new player and assign to ref
    playerRef.current = new window.YT.Player(iframeContainerRef.current, {
      videoId: videoId,
      width: iframeDimensions.width,
      height: iframeDimensions.height,
      playerVars: { 
        autoplay: 1, // Set to 1 for automatic playback
        controls: 0, 
        disablekb: 1, 
        fs: 0, 
        loop: 1, 
        modestbranding: 1, 
        rel: 0, 
        showinfo: 0, 
        iv_load_policy: 3, 
        playlist: videoId, 
        mute: 1 // Ensure it's muted for autoplay
      },
      events: { onReady: onPlayerReady, onStateChange: onPlayerStateChange },
    });
  }, [isApiLoaded, videoId, iframeDimensions, onPlayerReady, onPlayerStateChange, iframeContainerRef]);

  // Helper function to attempt playing video with retry logic
  const attemptPlayVideo = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      // Check if already playing to avoid unnecessary calls
      if (playerRef.current.getPlayerState() !== window.YT.PlayerState.PLAYING) {
        playerRef.current.playVideo();
      }
    } else {
      // If player or method not ready, retry after a short delay
      setTimeout(() => {
        attemptPlayVideo();
      }, 100); // Retry after 100ms
    }
  }, []);

  useEffect(() => {
    // Load YouTube Iframe API script
    if (typeof window.onYouTubeIframeAPIReady === 'undefined') {
      window.onYouTubeIframeAPIReady = () => setIsApiLoaded(true);
    } else {
      const originalOnReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        originalOnReady();
        setIsApiLoaded(true);
      };
    }
    if (!document.getElementById('youtube-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    } else if (window.YT && typeof window.YT.Player !== 'undefined') {
      setIsApiLoaded(true);
    }

    // Intersection Observer for viewport visibility
    const observer = new IntersectionObserver(([entry]) => setIsInViewport(entry.isIntersecting), { threshold: 0 });
    const currentParentRef = parentRef.current;
    if (currentParentRef) observer.observe(currentParentRef);

    // Visibility change listener for tab focus/blur
    const handleVisibilityChange = () => {
      if (playerRef.current && playerReady) {
        if (document.hidden) {
          if (isPlaying) {
            playerRef.current.pauseVideo();
          }
        } else {
          if (isInViewport && !userPaused) {
            attemptPlayVideo(); // Use the retry function here
          }
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Resize listener for iframe dimensions
    window.addEventListener('resize', calculateIframeDimensions);
    calculateIframeDimensions();

    return () => {
      window.removeEventListener('resize', calculateIframeDimensions);
      if (currentParentRef) observer.unobserve(currentParentRef);
      if (playerRef.current) playerRef.current.destroy();
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [calculateIframeDimensions, isApiLoaded, isInViewport, isPlaying, playerReady, userPaused, videoId, attemptPlayVideo]);

  useEffect(() => {
    // This effect is responsible for creating/recreating the player
    createYouTubePlayer();
  }, [createYouTubePlayer]); // Depend on createYouTubePlayer

  useEffect(() => {
    // This effect is solely responsible for playing/pausing based on state
    if (playerReady && playerRef.current) {
      if (isInViewport && !userPaused) {
        attemptPlayVideo(); // Use the retry function here
      } else {
        // Pause if not in viewport or manually paused
        if (playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING) {
          playerRef.current.pauseVideo();
        }
      }
    }
  }, [isInViewport, playerReady, userPaused, videoId, attemptPlayVideo]); // Add attemptPlayVideo to dependencies

  const togglePlayPause = useCallback(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setUserPaused(true);
      } else {
        attemptPlayVideo(); // Use the retry function here
        setUserPaused(false);
      }
    }
  }, [isPlaying, attemptPlayVideo]);

  const toggleMuteUnmute = useCallback(() => {
    if (playerRef.current) {
      if (isMuted) playerRef.current.unMute();
      else playerRef.current.mute();
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleMouseEnter = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    controlsTimeoutRef.current = window.setTimeout(() => setShowControls(false), 2000);
  };

  return (
    <div className="absolute inset-0 overflow-hidden" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} ref={parentRef}>
      <div ref={iframeContainerRef} style={{ width: iframeDimensions.width, height: iframeDimensions.height, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}></div>
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      {playerReady && (
        <div className={cn("absolute bottom-4 left-4 flex gap-2 transition-opacity duration-300 z-50", showControls ? "opacity-100" : "opacity-0 pointer-events-none")}>
          <Button variant="ghost" size="icon" className="bg-white/20 hover:bg-white/30 text-white" onClick={togglePlayPause}>
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="bg-white/20 hover:bg-white/30 text-white" onClick={toggleMuteUnmute}>
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        </div>
      )}
    </div>
  );
};

export default YouTubePlayerBackground;
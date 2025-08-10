import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollManager = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Delay scrolling to the top to allow the page transition animation to finish.
    // The timeout is slightly longer than the animation duration to be safe.
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 550); // Animation is 0.5s (500ms)

    return () => {
      clearTimeout(timer);
    };
  }, [pathname]);

  return null;
};

export default ScrollManager;
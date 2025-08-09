import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

interface SessionContextType {
  session: Session | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // Start in loading state
  const navigate = useNavigate();
  const location = useLocation(); // Get current location

  useEffect(() => {
    console.log("SessionContext: useEffect running.");

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("SessionContext: onAuthStateChange event:", _event, "session:", session);
      setSession(session);
      setLoading(false); // Session state is now known

      const currentPath = location.pathname;
      console.log("SessionContext: Current path before redirect logic:", currentPath);

      // Redirect logic after auth state change
      if (session) {
        console.log("SessionContext: User is authenticated.");
        // If signed in and on the login page, redirect to home
        if (currentPath === '/login') {
          console.log("SessionContext: Redirecting from /login to /");
          navigate('/');
        }
      } else {
        console.log("SessionContext: User is NOT authenticated.");
        // If not signed in and trying to access protected routes, redirect to login
        const protectedRoutes = ['/add-movie', '/edit-movie', '/import-movies', '/import-ratings'];
        if (protectedRoutes.some(route => currentPath.startsWith(route))) {
          console.log("SessionContext: Redirecting from protected route to /login");
          navigate('/login');
        }
      }
    });

    // Initial session check on component mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("SessionContext: Initial getSession data:", session);
      setSession(session);
      setLoading(false); // Initial session loaded

      const currentPath = location.pathname;
      console.log("SessionContext: Initial check - Current path before redirect logic:", currentPath);

      // Apply redirect logic immediately after initial session check
      if (session) {
        console.log("SessionContext: Initial check - User is authenticated.");
        if (currentPath === '/login') {
          console.log("SessionContext: Initial check - Redirecting from /login to /");
          navigate('/');
        }
      } else {
        console.log("SessionContext: Initial check - User is NOT authenticated.");
        const protectedRoutes = ['/add-movie', '/edit-movie', '/import-movies', '/import-ratings'];
        if (protectedRoutes.some(route => currentPath.startsWith(route))) {
          console.log("SessionContext: Initial check - Redirecting from protected route to /login");
          navigate('/login');
        }
      }
    });

    return () => {
      console.log("SessionContext: Unsubscribing from auth state changes.");
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]); // Add location.pathname to dependencies

  if (loading) {
    console.log("SessionContext: Rendering loading screen.");
    // Render a global loading indicator while session is being determined
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading application...</p>
      </div>
    );
  }

  console.log("SessionContext: Rendering children with session:", session);
  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};
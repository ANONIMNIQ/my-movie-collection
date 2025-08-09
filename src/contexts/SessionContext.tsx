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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false); // Session state is now known

      // Redirect logic after auth state change
      if (session) {
        // If signed in and on the login page, redirect to home
        if (location.pathname === '/login') {
          navigate('/');
        }
      } else {
        // If not signed in and trying to access protected routes, redirect to login
        const protectedRoutes = ['/add-movie', '/edit-movie', '/import-movies', '/import-ratings'];
        if (protectedRoutes.some(route => location.pathname.startsWith(route))) {
          navigate('/login');
        }
      }
    });

    // Initial session check on component mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false); // Initial session loaded
      // Apply redirect logic immediately after initial session check
      if (session) {
        if (location.pathname === '/login') {
          navigate('/');
        }
      } else {
        const protectedRoutes = ['/add-movie', '/edit-movie', '/import-movies', '/import-ratings'];
        if (protectedRoutes.some(route => location.pathname.startsWith(route))) {
          navigate('/login');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]); // Add location.pathname to dependencies

  if (loading) {
    // Render a global loading indicator while session is being determined
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading application...</p>
      </div>
    );
  }

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
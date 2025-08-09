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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);

      const currentPath = location.pathname;

      if (session) {
        if (currentPath === '/login') {
          navigate('/');
        }
      } else {
        const protectedRoutes = ['/add-movie', '/edit-movie', '/import-movies', '/import-ratings'];
        if (protectedRoutes.some(route => currentPath.startsWith(route))) {
          navigate('/login');
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);

      const currentPath = location.pathname;

      if (session) {
        if (currentPath === '/login') {
          navigate('/');
        }
      } else {
        const protectedRoutes = ['/add-movie', '/edit-movie', '/import-movies', '/import-ratings'];
        if (protectedRoutes.some(route => currentPath.startsWith(route))) {
          navigate('/login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  if (loading) {
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
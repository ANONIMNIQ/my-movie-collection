import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { showError } from '@/utils/toast';

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db"; // Your specific User ID

const AuthRedirector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!sessionLoading) {
      const currentPath = location.pathname;
      const protectedRoutes = ['/add-movie', '/edit-movie', '/import-movies', '/import-ratings'];

      if (session) {
        // If authenticated, redirect from login page to home
        if (currentPath === '/login') {
          navigate('/');
        }
        // If authenticated but not admin, redirect from admin-only routes
        if (session.user?.id !== ADMIN_USER_ID && (currentPath === '/add-movie' || currentPath.startsWith('/edit-movie') || currentPath === '/import-movies')) {
          showError("You do not have permission to access this page.");
          navigate('/');
        }
      } else {
        // If not authenticated, redirect from protected routes to login
        if (protectedRoutes.some(route => currentPath.startsWith(route))) {
          navigate('/login');
        }
      }
    }
  }, [session, sessionLoading, navigate, location.pathname]);

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading authentication...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthRedirector;
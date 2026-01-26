import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useSessionMonitor = () => {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkSession = () => {
      const savedSession = localStorage.getItem('botai_session');

      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          const now = new Date().getTime();
          const sessionExpiry = new Date(session.expiresAt).getTime();

          // Session expired
          if (now >= sessionExpiry) {
            logout();
            // Optional: Show a notification that session expired
            console.log('Session expired. Please log in again.');
          }
        } catch (error) {
          // Invalid session data, logout
          logout();
        }
      } else {
        // No session data found, logout
        logout();
      }
    };

    // Check session immediately
    checkSession();

    // Check session every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, logout]);
};


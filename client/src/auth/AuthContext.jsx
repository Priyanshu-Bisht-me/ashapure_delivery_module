import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, loginUser, signupUser } from '../api/authApi';
import { clearStoredAuth, readStoredAuth, writeStoredAuth } from './authStorage';

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => readStoredAuth());
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const syncCurrentUser = async () => {
      if (!authState?.token) {
        if (isMounted) {
          setAuthReady(true);
        }
        return;
      }

      try {
        const response = await getCurrentUser();
        if (isMounted) {
          const nextState = {
            token: authState.token,
            user: response.user,
          };
          setAuthState(nextState);
          writeStoredAuth(nextState);
        }
      } catch {
        clearStoredAuth();
        if (isMounted) {
          setAuthState(null);
        }
      } finally {
        if (isMounted) {
          setAuthReady(true);
        }
      }
    };

    syncCurrentUser();

    const handleForceLogout = () => {
      clearStoredAuth();
      setAuthState(null);
      setAuthReady(true);
    };

    window.addEventListener('aasapure:logout', handleForceLogout);

    return () => {
      isMounted = false;
      window.removeEventListener('aasapure:logout', handleForceLogout);
    };
  }, [authState?.token]);

  const setAuthenticatedState = useCallback((response) => {
    const nextState = {
      token: response.token,
      user: response.user,
    };

    setAuthState(nextState);
    writeStoredAuth(nextState);
    setAuthReady(true);
  }, []);

  const login = useCallback(
    async (payload) => {
      const response = await loginUser(payload);
      setAuthenticatedState(response);
      return response;
    },
    [setAuthenticatedState]
  );

  const signup = useCallback(
    async (payload) => {
      const response = await signupUser(payload);
      setAuthenticatedState(response);
      return response;
    },
    [setAuthenticatedState]
  );

  const logout = useCallback(() => {
    clearStoredAuth();
    setAuthState(null);
    setAuthReady(true);
  }, []);

  const value = useMemo(
    () => ({
      authReady,
      isAuthenticated: Boolean(authState?.token && authState?.user),
      token: authState?.token || '',
      user: authState?.user || null,
      login,
      signup,
      logout,
    }),
    [authReady, authState, login, logout, signup]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
export default AuthProvider;

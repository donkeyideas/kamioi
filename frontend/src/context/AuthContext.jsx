/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from "react";
import { AuthAPI, setToken, getToken, clearToken, ROLES, getAdminMeSafe } from "../services/apiService";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const inactivityTimeoutRef = useRef(null);
  const sessionTimeoutRef = useRef(null);
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      
      // Get both tokens
      const userToken = getToken(ROLES.USER);
      const adminToken = getToken(ROLES.ADMIN);
      
      // Use the new unified endpoint to check both tokens simultaneously
      // This prevents one token check from affecting the other
      if (userToken || adminToken) {
        try {
          const headers = {
            'Content-Type': 'application/json'
          };
          
          // Send the primary token in Authorization header
          if (adminToken) {
            headers['Authorization'] = `Bearer ${adminToken}`;
            headers['X-Admin-Token'] = adminToken;
          } else if (userToken) {
            headers['Authorization'] = `Bearer ${userToken}`;
            headers['X-User-Token'] = userToken;
          }
          
          // Also send both tokens in custom headers if both exist
          if (adminToken && userToken) {
            headers['X-Admin-Token'] = adminToken;
            headers['X-User-Token'] = userToken;
          }
          
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'}/api/auth/check-all`, {
            method: 'GET',
            headers: headers
          });
          
          const data = await response.json();
          
          if (data.success) {
            // Set user if token is valid
            if (data.has_user && data.user) {
              console.log('?? AuthContext - Setting user from check-all:', data.user);
              setUser(data.user);
            } else if (userToken && !data.has_user) {
              // Try user token directly before clearing it
              try {
                const { data: meData } = await AuthAPI.meUser();
                if (meData && meData.user) {
                  setUser(meData.user);
                } else {
                  console.log('?? AuthContext - User token invalid, clearing...');
                  clearToken(ROLES.USER);
                }
              } catch (error) {
                console.log('?? AuthContext - User token invalid, clearing...');
                clearToken(ROLES.USER);
              }
            }
            
            // Set admin if token is valid
            if (data.has_admin && data.admin) {
              console.log('?? AuthContext - Setting admin from check-all:', data.admin);
              setAdmin(data.admin);
            } else if (adminToken && !data.has_admin) {
              // Admin token exists but is invalid - clear it
              console.log('?? AuthContext - Admin token invalid, clearing...');
              clearToken(ROLES.ADMIN);
            }
          } else {
            // If unified check fails, fall back to individual checks
            console.log('?? AuthContext - Unified check failed, falling back to individual checks');
            
            // Check user token individually
            if (userToken) {
              try {
                const { data } = await AuthAPI.meUser();
                if (data && data.user) {
                  setUser(data.user);
                } else {
                  clearToken(ROLES.USER);
                }
              } catch (error) {
                clearToken(ROLES.USER);
              }
            }
            
            // Check admin token individually
            if (adminToken) {
              try {
                const { data } = await getAdminMeSafe();
                if (data && data.user) {
                  setAdmin(data.user);
                } else {
                  clearToken(ROLES.ADMIN);
                }
              } catch (error) {
                clearToken(ROLES.ADMIN);
              }
            }
          }
        } catch (error) {
          console.error('?? AuthContext - Error checking auth:', error);
          // Fall back to individual checks on error
          if (userToken) {
            try {
              const { data } = await AuthAPI.meUser();
              if (data && data.user) {
                setUser(data.user);
              } else {
                clearToken(ROLES.USER);
              }
            } catch (err) {
              clearToken(ROLES.USER);
            }
          }
          
          if (adminToken) {
            try {
              const { data } = await getAdminMeSafe();
              if (data && data.user) {
                setAdmin(data.user);
              } else {
                clearToken(ROLES.ADMIN);
              }
            } catch (err) {
              clearToken(ROLES.ADMIN);
            }
          }
        }
      }
      
      setLoading(false);
      setIsInitialized(true);
    };
    init();
  }, []); // Keep empty dependency array for initialization

  const logoutUser = useCallback(() => { 
    clearToken(ROLES.USER); 
    setUser(null); 
  }, []);
  
  const logoutAdmin = useCallback(() => { 
    clearToken(ROLES.ADMIN); 
    setAdmin(null); 
  }, []);

  // Unified logout function that handles all logout types
  const logout = useCallback(async () => {
    try {
      console.log('?? Starting unified logout...');
      
      // Clear timers
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }
      
      if (user) {
        console.log('?? User logout...');
        logoutUser();
      } else if (admin) {
        console.log('?? Admin logout...');
        logoutAdmin();
      }
      
      // Clear all tokens
      clearToken(ROLES.USER);
      clearToken(ROLES.ADMIN);
      
      // Clear all user states
      setUser(null);
      setAdmin(null);
      
      console.log('? Unified logout successful');
      
      return { success: true };
    } catch (error) {
      console.error('? Unified logout error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }, [admin, logoutAdmin, logoutUser, user]);

  // Session timeout and inactivity handling
  useEffect(() => {
    if (!user && !admin) {
      // Clear timers if no user/admin
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }
      return;
    }

    const resetTimers = () => {
      // Clear existing timers
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }

      // Set session timeout (absolute) - 30 minutes from now
      sessionTimeoutRef.current = setTimeout(() => {
        console.log('Session timeout reached, logging out...');
        logout();
      }, SESSION_TIMEOUT);

      // Set inactivity timeout (relative to last activity) - 15 minutes of inactivity
      inactivityTimeoutRef.current = setTimeout(() => {
        console.log('Inactivity timeout reached, logging out...');
        logout();
      }, INACTIVITY_TIMEOUT);
    };

    // Activity event listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => {
      resetTimers();
    };

    // Initialize timers
    resetTimers();

    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }
    };
  }, [user, admin, logout, SESSION_TIMEOUT, INACTIVITY_TIMEOUT]);

  const loginUser = async (email, password) => {
    const { data } = await AuthAPI.loginUser(email, password);
    console.log('?? AuthContext - Login response:', data);
    if (data.success) {
      setToken(ROLES.USER, data.token);
      const me = await AuthAPI.meUser();
      console.log('?? AuthContext - /me after login:', me.data);
      if (me.data && me.data.user) {
        setUser(me.data.user);
        return { success: true, user: me.data.user };
      } else {
        setUser(data.user);
        return { success: true, user: data.user };
      }
    } else {
      throw new Error(data.error || 'Login failed');
    }
  };

  const loginAdmin = async (email, password) => {
    try {
      const { data } = await AuthAPI.loginAdmin(email, password);
      console.log('?? AuthContext - Admin login response:', data);
      if (data.success) {
        setToken(ROLES.ADMIN, data.token);
        
        // Try to get admin details, but don't fail if it doesn't work
        try {
          const me = await AuthAPI.meAdmin();
          console.log('?? AuthContext - Admin /me after login:', me.data);
          if (me.data && me.data.user) {
            setAdmin(me.data.user);
            return { success: true, user: me.data.user };
          }
        } catch (meError) {
          console.warn('?? AuthContext - Admin /me failed, using login response data:', meError);
        }
        
        // Fall back to user data from login response
        let adminUser = null;
        if (data.user) {
          adminUser = data.user;
        } else {
          // Create a basic admin object from the token
          const adminId = data.token ? parseInt(data.token.replace('admin_token_', '')) : null;
          adminUser = {
            id: adminId || 1,
            email: email,
            name: 'Admin',
            role: 'admin',
            dashboard: 'admin'
          };
        }
        
        // Set admin state
        setAdmin(adminUser);
        
        // Also store in localStorage for AdminRoute compatibility
        localStorage.setItem('kamioi_admin_user', JSON.stringify(adminUser));
        
        return { success: true, user: adminUser };
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('?? AuthContext - Admin login error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const ut = getToken(ROLES.USER);
      if (ut) {
        const { data } = await AuthAPI.meUser();
        console.log('?? AuthContext - Refresh user response:', data);
        if (data && data.user) {
          console.log('?? AuthContext - Updating user:', data.user);
          setUser(data.user);
          return { success: true, user: data.user };
        }
      }
      return { success: false, error: 'No user token found' };
    } catch (error) {
      console.error('?? AuthContext - Error refreshing user:', error);
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      admin, 
      loading, 
      isInitialized, 
      loginUser, 
      loginAdmin, 
      logoutUser, 
      logoutAdmin,
      logout, // Unified logout function
      refreshUser // Refresh user data from API
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// (optional) keep default export for compatibility
export default AuthProvider;

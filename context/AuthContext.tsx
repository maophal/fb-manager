'use client';

import React, { createContext, useReducer, useContext, useEffect, ReactNode } from 'react';

// Define action types
type AuthAction = { type: 'LOGIN'; payload: any } | { type: 'LOGOUT' } | { type: 'SET_HAS_PICKED_PLAN'; payload: string } | { type: 'SET_LOADING'; payload: boolean }; // Added SET_LOADING

// Define state type
interface AuthState {
  isLoggedIn: boolean;
  hasPickedPlan: boolean;
  user: any;
  isLoading: boolean; // Added isLoading
}

// Reducer function
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(action.payload));
      return { ...state, isLoggedIn: true, user: action.payload, hasPickedPlan: !!action.payload.plan_id, isLoading: false }; // Set isLoading to false on LOGIN
    case 'LOGOUT':
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('hasPickedPlan');
      localStorage.removeItem('user');
      return { ...state, isLoggedIn: false, hasPickedPlan: false, user: null, isLoading: false }; // Set isLoading to false on LOGOUT
    case 'SET_HAS_PICKED_PLAN':
      localStorage.setItem('hasPickedPlan', 'true');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser) {
        currentUser.plan_id = action.payload;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
      return { ...state, hasPickedPlan: true, user: { ...state.user, plan_id: action.payload } };
    case 'SET_LOADING': // Added SET_LOADING case
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

interface AuthContextType {
  isLoggedIn: boolean;
  hasPickedPlan: boolean;
  user: any;
  isLoading: boolean; // Added isLoading
  login: (userData: any) => void;
  logout: () => void;
  setHasPickedPlan: (planId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, { isLoggedIn: false, hasPickedPlan: false, user: null, isLoading: true }); // Initialize isLoading to true

  useEffect(() => {
    const storedIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');

    const fetchUserData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true }); // Set loading to true before fetch
      try {
        if (storedIsLoggedIn && storedUser) {
          const response = await fetch(`/api/user/me?id=${storedUser.id}`);
          if (response.ok) {
            const data = await response.json();
            dispatch({ type: 'LOGIN', payload: data.user });
          } else {
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        dispatch({ type: 'LOGOUT' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false }); // Set loading to false after fetch
      }
    };
    fetchUserData();
  }, []); // Empty dependency array to run only on mount

  const login = (userData: any) => {
    dispatch({ type: 'LOGIN', payload: userData });
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const setHasPickedPlan = (planId: string) => {
    dispatch({ type: 'SET_HAS_PICKED_PLAN', payload: planId });
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: state.isLoggedIn, hasPickedPlan: state.hasPickedPlan, user: state.user, isLoading: state.isLoading, login, logout, setHasPickedPlan }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
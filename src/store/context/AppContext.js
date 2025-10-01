import React, { createContext, useContext, useReducer } from 'react';

// Initial state
const initialState = {
  user: null,
  notification: null,
  loading: false,
  error: null,
  settings: null
};

// Action types
export const ActionTypes = {
  SET_USER: 'SET_USER',
  SET_NOTIFICATION: 'SET_NOTIFICATION',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_SETTINGS: 'SET_SETTINGS',
  CLEAR_NOTIFICATION: 'CLEAR_NOTIFICATION',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return { ...state, user: action.payload };
    case ActionTypes.SET_NOTIFICATION:
      return { ...state, notification: action.payload };
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    case ActionTypes.SET_SETTINGS:
      return { ...state, settings: action.payload };
    case ActionTypes.CLEAR_NOTIFICATION:
      return { ...state, notification: null };
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Context provider
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Actions
  const setUser = (user) => {
    dispatch({ type: ActionTypes.SET_USER, payload: user });
  };

  const setNotification = (notification) => {
    dispatch({ type: ActionTypes.SET_NOTIFICATION, payload: notification });
    // Auto-clear notification after 3 seconds
    setTimeout(() => {
      dispatch({ type: ActionTypes.CLEAR_NOTIFICATION });
    }, 3000);
  };

  const setLoading = (loading) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: ActionTypes.SET_ERROR, payload: error });
  };

  const setSettings = (settings) => {
    dispatch({ type: ActionTypes.SET_SETTINGS, payload: settings });
  };

  const clearNotification = () => {
    dispatch({ type: ActionTypes.CLEAR_NOTIFICATION });
  };

  const clearError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  };

  const value = {
    ...state,
    setUser,
    setNotification,
    setLoading,
    setError,
    setSettings,
    clearNotification,
    clearError
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook for using the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext; 
// frontend/src/context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Initialize theme from localStorage or system preference (runs before React renders)
const getInitialTheme = () => {
  if (typeof window === 'undefined') return false;
  
  const savedTheme = localStorage.getItem('jobfinder-theme');
  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme === 'dark';
  }
  
  // Fallback to system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }
  
  return false;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Initialize state from localStorage or system preference
    const initialTheme = getInitialTheme();
    // Apply to DOM immediately (before React renders)
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      if (initialTheme) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    return initialTheme;
  });

  // Apply theme when isDark changes and persist to localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('jobfinder-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('jobfinder-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const value = {
    isDark,
    toggleTheme,
    setIsDark,
    theme: isDark ? 'dark' : 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
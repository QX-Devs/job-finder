// frontend/src/components/ThemeToggle.js
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle-btn ${isDark ? 'dark-active' : ''}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'الوضع المضيء' : 'الوضع الداكن'}
    >
      {isDark ? (
        <Sun size={18} className="theme-icon" />
      ) : (
        <Moon size={18} className="theme-icon" />
      )}
    </button>
  );
};

export default ThemeToggle;
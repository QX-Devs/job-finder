// components/Navbar.js

import { useState, useEffect } from 'react';
import { Menu, X, LogIn, UserPlus, LayoutDashboard, LogOut } from 'lucide-react'; // Changed: Added new icons
import authService from '../services/authService'; // New: Import auth service
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');

  // New: Check authentication status
  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    setCurrentPath(window.location.pathname);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // New: Handle user logout
  const handleLogout = () => {
    authService.logout();
    // Redirect to home or login page and refresh to update state
    window.location.href = '/login'; 
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about-us' },
    { name: 'Contact', href: '/contact-us' },
    // New: Conditionally add Dashboard link if user is authenticated
    ...(isAuthenticated ? [{ name: 'Dashboard', href: '/dashboard' }] : []),
    { name: 'Privacy', href: '/privacy-policy' },
    { name: 'Terms', href: '/terms-of-service' }
  ];

  const isActiveLink = (href) => {
    return currentPath === href;
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <a href="/" className="navbar-logo">
          <span className="logo-text">GradJob</span>
        </a>

        <div className={`navbar-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {navLinks.map((link, index) => (
            <a 
              key={index} 
              href={link.href} 
              className={`nav-link ${isActiveLink(link.href) ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
              {isActiveLink(link.href) && (
                <div className="active-indicator">
                  <div className="active-line"></div>
                  <div className="active-glow"></div>
                </div>
              )}
            </a>
          ))}
          {/* New: Mobile menu actions */}
          <div className="mobile-actions">
            {isAuthenticated ? (
              <button onClick={handleLogout} className="nav-btn logout-btn">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            ) : (
              <>
                <a href="/login" className="nav-btn login-btn">
                  <LogIn size={18} />
                  <span>Login</span>
                </a>
                <a href="/signup" className="nav-btn signup-btn">
                  <UserPlus size={18} />
                  <span>Sign Up</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Changed: Desktop actions are now conditional */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            // User is logged in
            <>
              <a href="/dashboard" className="nav-btn login-btn">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </a>
              <button onClick={handleLogout} className="nav-btn signup-btn logout-btn">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            // User is a guest
            <>
              <a href="/login" className="nav-btn login-btn">
                <LogIn size={18} />
                <span>Login</span>
              </a>
              <a href="/signup" className="nav-btn signup-btn">
                <UserPlus size={18} />
                <span>Sign Up</span>
              </a>
            </>
          )}
        </div>

        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
import { useState, useEffect } from 'react';
import { Menu, X, LogIn, UserPlus, LayoutDashboard, LogOut } from 'lucide-react';
import authService from '../services/authService';
import { useTranslate } from '../utils/translate'; // <<< أضف هذا
import './Navbar.css';

const Navbar = () => {
  const { t, isRTL, language, toggleLanguage } = useTranslate(); // <<< استخدم الترجمة
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');

  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    setCurrentPath(window.location.pathname);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login'; 
  };

  const navLinks = [
    { name: t('home'), href: '/' },
    { name: t('about'), href: '/about-us' },
    { name: t('contact'), href: '/contact-us' },
    ...(isAuthenticated ? [{ name: t('dashboard'), href: '/dashboard' }] : []),
    { name: t('privacy'), href: '/privacy-policy' },
    { name: t('terms'), href: '/terms-of-service' }
  ];

  const isActiveLink = (href) => {
    return currentPath === href;
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
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
          
          {/* Language Toggle Button in Mobile Menu */}
          <div className="mobile-language-toggle">
            <button 
              className="language-toggle-btn"
              onClick={toggleLanguage}
            >
              {language === 'en' ? 'العربية' : 'English'}
            </button>
          </div>

          {/* Mobile menu actions */}
          <div className="mobile-actions">
            {isAuthenticated ? (
              <button onClick={handleLogout} className="nav-btn logout-btn">
                <LogOut size={18} />
                <span>{t('logout')}</span>
              </button>
            ) : (
              <>
                <a href="/login" className="nav-btn login-btn">
                  <LogIn size={18} />
                  <span>{t('login')}</span>
                </a>
                <a href="/signup" className="nav-btn signup-btn">
                  <UserPlus size={18} />
                  <span>{t('signup')}</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Desktop Actions with Language Toggle */}
        <div className="navbar-actions">
          {/* Language Toggle Button */}
          <button 
            className="language-toggle-btn"
            onClick={toggleLanguage}
          >
            {language === 'en' ? 'العربية' : 'English'}
          </button>

          {isAuthenticated ? (
            <>
              <a href="/dashboard" className="nav-btn login-btn">
                <LayoutDashboard size={18} />
                <span>{t('dashboard')}</span>
              </a>
              <button onClick={handleLogout} className="nav-btn signup-btn logout-btn">
                <LogOut size={18} />
                <span>{t('logout')}</span>
              </button>
            </>
          ) : (
            <>
              <a href="/login" className="nav-btn login-btn">
                <LogIn size={18} />
                <span>{t('login')}</span>
              </a>
              <a href="/signup" className="nav-btn signup-btn">
                <UserPlus size={18} />
                <span>{t('signup')}</span>
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
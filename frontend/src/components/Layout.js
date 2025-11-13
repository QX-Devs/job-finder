// src/components/Layout.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, User, LogOut, Briefcase, Bell, Settings, 
  Heart, BookmarkCheck, FileText, TrendingUp, ChevronDown,
  Search, Zap, Shield, HelpCircle, MessageSquare, Languages
} from 'lucide-react';
import AuthModal from './AuthModal';
import authService from '../services/authService';
import { useTranslate } from '../utils/translate'; // <<< أضف هذا
import './Layout.css';

// Footer Component
const Footer = () => {
  const navigate = useNavigate();
  const { t, isRTL, language } = useTranslate(); // <<< أضف الترجمة

  const footerLinks = {
    quickLinks: [
      { name: t('browseJobs'), path: '/find-jobs' },
      { name: t('companies'), path: '/companies' },
      { name: t('resumeBuilder'), path: '/cv-generator' },
      { name: t('careerAdvice'), path: '/career-advice' }
    ],
    resources: [
      { name: t('about'), path: '/about-us' },
      { name: t('blog'), path: '/blog' },
      { name: t('faq'), path: '/faq' },
      { name: t('contact'), path: '/contact-us' }
    ],
    legal: [
      { name: t('privacyPolicy'), path: '/privacy-policy' },
      { name: t('termsOfService'), path: '/terms-of-service' },
      { name: t('cookiePolicy'), path: '/cookies' },
      { name: t('accessibility'), path: '/accessibility' }
    ]
  };

  const socialLinks = [
    { name: 'Twitter', label: '𝕏', url: '#' },
    { name: 'LinkedIn', label: 'in', url: '#' },
    { name: 'Facebook', label: 'f', url: '#' },
    { name: 'Instagram', label: '📷', url: '#' }
  ];

  return (
    <footer className="footer" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="footer-container">
        <div className="footer-grid">
          {/* Company Info */}
          <div className="footer-column">
            <div className="footer-logo" onClick={() => navigate('/')}>
              <div className="footer-logo-icon">
                <Briefcase size={24} />
              </div>
              <span className="footer-logo-text">GradJob</span>
            </div>
            <p className="footer-description">
              {language === 'en' 
                ? 'Your AI-powered career companion. Find your dream job and build your future with confidence.'
                : 'رفيقك المهني المدعوم بالذكاء الاصطناعي. ابحث عن وظيفة أحلامك وابنِ مستقبلك بثقة.'
              }
            </p>
            <div className="footer-social">
              {socialLinks.map((social) => (
                <button
                  key={social.name}
                  className="social-btn"
                  aria-label={social.name}
                  onClick={() => window.open(social.url, '_blank')}
                >
                  {social.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-column">
            <h4>{t('quickLinks')}</h4>
            <ul>
              {footerLinks.quickLinks.map((link) => (
                <li key={link.path}>
                  <button onClick={() => navigate(link.path)}>
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-column">
            <h4>{t('resources')}</h4>
            <ul>
              {footerLinks.resources.map((link) => (
                <li key={link.path}>
                  <button onClick={() => navigate(link.path)}>
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="footer-column">
            <h4>{t('legal')}</h4>
            <ul>
              {footerLinks.legal.map((link) => (
                <li key={link.path}>
                  <button onClick={() => navigate(link.path)}>
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} GradJob. {t('allRightsReserved')}</p>
          <div className="footer-badges">
            <div className="badge-item">
              <Shield size={16} />
              <span>{t('secure')}</span>
            </div>
            <div className="badge-item">
              <Heart size={16} />
              <span>{t('madeWithLove')}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Layout Component
const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isRTL, language, toggleLanguage } = useTranslate(); // <<< أضف الترجمة

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(authService.isAuthenticated());
  const [currentUser, setCurrentUser] = useState(authService.getStoredUser());
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(true);
  
  const userDropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const languageRef = useRef(null);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      
      setIsScrolled(scrollTop > 20);
      setScrollProgress(scrollPercent);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsLoggedIn(authService.isAuthenticated());
    if (authService.isAuthenticated()) {
      authService.getCurrentUser().then((res) => {
        if (res?.success && res.data) {
          setCurrentUser(res.data);
          authService.setUser(res.data);
        }
      }).catch(() => {});
    } else {
      setCurrentUser(null);
    }
  }, [location.pathname]);

  // Sync auth state across tabs
  useEffect(() => {
    const syncAuth = () => setIsLoggedIn(authService.isAuthenticated());
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  // On mount, ensure we have the latest user profile
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const stored = authService.getStoredUser();
      setCurrentUser(stored);
      authService.getCurrentUser().then((res) => {
        if (res?.success && res.data) {
          setCurrentUser(res.data);
          authService.setUser(res.data);
        }
      }).catch(() => {});
    }
  }, []);

  // Mock notifications with translation
  const notifications = [
    {
      id: 1,
      title: language === 'en' ? 'New job match!' : 'وظيفة جديدة مناسبة!',
      message: language === 'en' 
        ? 'Senior Developer at Google matches your profile'
        : 'مطور كبير في Google يناسب ملفك الشخصي',
      time: language === 'en' ? '5 min ago' : 'منذ 5 دقائق',
      unread: true,
      icon: Zap,
      color: 'blue'
    },
    {
      id: 2,
      title: language === 'en' ? 'Application viewed' : 'تم عرض طلبك',
      message: language === 'en'
        ? 'Microsoft viewed your application for Software Engineer'
        : 'مايكروسوفت عرضت طلبك لوظيفة مهندس برمجيات',
      time: language === 'en' ? '1 hour ago' : 'منذ ساعة',
      unread: true,
      icon: FileText,
      color: 'green'
    },
    {
      id: 3,
      title: language === 'en' ? 'Profile suggestion' : 'اقتراح للملف الشخصي',
      message: language === 'en'
        ? 'Add 2 more skills to increase your visibility'
        : 'أضف مهارتين إضافيتين لزيادة ظهورك',
      time: language === 'en' ? '3 hours ago' : 'منذ 3 ساعات',
      unread: false,
      icon: TrendingUp,
      color: 'purple'
    }
  ];

  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    setIsLoggedIn(true);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setIsUserDropdownOpen(false);
    navigate('/');
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
    setIsNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    setIsUserDropdownOpen(false);
    if (isNotificationsOpen === false) {
      setHasNewNotifications(false);
    }
  };

  const navLinks = [
    { name: t('home'), path: '/', icon: Briefcase },
    { name: t('findJobs'), path: '/find-jobs', icon: Search },
    { name: t('resumeBuilder'), path: '/cv-generator', icon: FileText },
    { name: t('about'), path: '/about-us', icon: HelpCircle },
    { name: t('contact'), path: '/contact-us', icon: MessageSquare }
  ];

  const userMenuItems = [
    { name: t('dashboard'), path: '/dashboard', icon: User },
    { name: t('myApplications'), path: '/applications', icon: FileText },
    { name: t('savedJobs'), path: '/saved-jobs', icon: BookmarkCheck },
    { name: t('resumeBuilder'), path: '/cv-generator', icon: FileText },
    { name: t('settings'), path: '/settings', icon: Settings }
  ];

  const isActivePath = (path) => location.pathname === path;

  return (
    <div className="layout" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Scroll Progress Bar */}
      <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }}></div>

      {/* Enhanced Navbar */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          {/* Logo */}
          <div className="navbar-logo" onClick={() => navigate('/')}>
            <div className="logo-icon">
              <Briefcase size={28} />
              <div className="logo-pulse"></div>
            </div>
            <span className="logo-text">GradJob</span>
          </div>

          {/* Desktop Navigation */}
          <div className="navbar-links">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`nav-link ${isActivePath(link.path) ? 'active' : ''}`}
                >
                  <Icon size={18} className="nav-link-icon" />
                  {link.name}
                  {isActivePath(link.path) && <div className="nav-link-indicator"></div>}
                </button>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="navbar-actions">
            {/* Language Toggle */}
            <div className="language-toggle-wrapper" ref={languageRef}>
              <button
                onClick={toggleLanguage}
                className="icon-action-btn language-toggle"
                title={language === 'en' ? 'Switch to Arabic' : 'التغيير إلى الإنجليزية'}
              >
                <Languages size={20} />
                <span className="language-code">{language === 'en' ? 'AR' : 'EN'}</span>
              </button>
            </div>

            {isLoggedIn ? (
              <>
                {/* Notifications */}
                <div className="notification-wrapper" ref={notificationsRef}>
                  <button
                    onClick={toggleNotifications}
                    className="icon-action-btn notification-btn"
                  >
                    <Bell size={20} />
                    {hasNewNotifications && <span className="notification-badge"></span>}
                  </button>

                  {/* Notifications Dropdown */}
                  {isNotificationsOpen && (
                    <div className="notifications-dropdown">
                      <div className="notifications-header">
                        <h3>{t('notifications')}</h3>
                        <button className="mark-read-btn">{t('markAllRead')}</button>
                      </div>
                      <div className="notifications-list">
                        {notifications.map((notif) => {
                          const NotifIcon = notif.icon;
                          return (
                            <div
                              key={notif.id}
                              className={`notification-item ${notif.unread ? 'unread' : ''}`}
                            >
                              <div className={`notification-icon ${notif.color}`}>
                                <NotifIcon size={18} />
                              </div>
                              <div className="notification-content">
                                <h4>{notif.title}</h4>
                                <p>{notif.message}</p>
                                <span className="notification-time">{notif.time}</span>
                              </div>
                              {notif.unread && <div className="unread-dot"></div>}
                            </div>
                          );
                        })}
                      </div>
                      <div className="notifications-footer">
                        <button onClick={() => navigate('/notifications')}>
                          {t('viewAllNotifications')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="user-menu-wrapper" ref={userDropdownRef}>
                  <button
                    onClick={toggleUserDropdown}
                    className="user-menu-trigger"
                  >
                    <div className="user-avatar">
                      <User size={20} />
                    </div>
                    <span className="user-name">{currentUser?.fullName || t('me')}</span>
                    <ChevronDown
                      size={16}
                      className={`dropdown-arrow ${isUserDropdownOpen ? 'open' : ''}`}
                    />
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <div className="user-dropdown">
                      <div className="user-dropdown-header">
                        <div className="user-avatar-large">
                          <User size={24} />
                        </div>
                        <div className="user-info">
                          <h4>{currentUser?.fullName || t('myAccount')}</h4>
                          <p>{currentUser?.email || ''}</p>
                        </div>
                      </div>

                      <div className="user-dropdown-section">
                        {userMenuItems.map((item) => {
                          const ItemIcon = item.icon;
                          return (
                            <button
                              key={item.path}
                              onClick={() => {
                                navigate(item.path);
                                setIsUserDropdownOpen(false);
                              }}
                              className="user-dropdown-item"
                            >
                              <ItemIcon size={18} />
                              {item.name}
                            </button>
                          );
                        })}
                      </div>

                      <div className="user-dropdown-footer">
                        <button onClick={handleLogout} className="logout-btn">
                          <LogOut size={18} />
                          {t('logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('login')}
                  className="nav-btn-secondary"
                >
                  {t('login')}
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="nav-btn-primary"
                >
                  <Zap size={18} />
                  {t('signUpFree')}
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Enhanced Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="mobile-menu">
            <div className="mobile-menu-content">
              {/* Language Toggle in Mobile Menu */}
              <div className="mobile-language-toggle">
                <button
                  onClick={toggleLanguage}
                  className="mobile-language-btn"
                >
                  <Languages size={20} />
                  <span>{language === 'en' ? 'العربية' : 'English'}</span>
                </button>
              </div>

              {/* User Info (if logged in) */}
              {isLoggedIn && (
                <div className="mobile-user-info">
                  <div className="mobile-user-avatar">
                    <User size={24} />
                  </div>
                  <div className="mobile-user-details">
                    <h4>{currentUser?.fullName || t('myAccount')}</h4>
                    <p>{currentUser?.email || ''}</p>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="mobile-menu-section">
                <h5 className="mobile-menu-title">{t('navigation')}</h5>
                <div className="mobile-menu-links">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <button
                        key={link.path}
                        onClick={() => navigate(link.path)}
                        className={`mobile-nav-link ${isActivePath(link.path) ? 'active' : ''}`}
                      >
                        <Icon size={20} />
                        {link.name}
                        {isActivePath(link.path) && <div className="mobile-active-indicator"></div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* User Menu (if logged in) */}
              {isLoggedIn && (
                <div className="mobile-menu-section">
                  <h5 className="mobile-menu-title">{t('account')}</h5>
                  <div className="mobile-menu-links">
                    {userMenuItems.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <button
                          key={item.path}
                          onClick={() => navigate(item.path)}
                          className="mobile-nav-link"
                        >
                          <ItemIcon size={20} />
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Auth Buttons */}
              <div className="mobile-menu-auth">
                {isLoggedIn ? (
                  <button onClick={handleLogout} className="mobile-btn-outline">
                    <LogOut size={20} />
                    {t('logout')}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => openAuthModal('login')}
                      className="mobile-btn-secondary"
                    >
                      {t('login')}
                    </button>
                    <button
                      onClick={() => openAuthModal('signup')}
                      className="mobile-btn-primary"
                    >
                      <Zap size={18} />
                      {t('signUpFree')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        defaultTab={authModalTab}
        onSuccess={handleAuthSuccess}
      />

      {/* Page Content */}
      <main className="main-content">
        {children}
      </main>

      {/* Enhanced Footer */}
      <Footer />
    </div>
  );
};

export default Layout;
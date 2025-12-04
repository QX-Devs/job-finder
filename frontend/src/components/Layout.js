// src/components/Layout.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Menu, X, User, LogOut, Briefcase, Bell, Settings, 
  Heart, BookmarkCheck, FileText, TrendingUp, ChevronDown,
  Search, Zap, Shield, HelpCircle, MessageSquare, Languages
} from 'lucide-react';
import AuthModal from './AuthModal';
import CareerObjectiveModal from './CareerObjectiveModal';
import CareerObjectiveReminder from './CareerObjectiveReminder';
import { useAuth } from '../context/AuthContext';
import { useTranslate } from '../utils/translate'; // <<< أضف هذا
import ThemeToggle from './ThemeToggle';
import './Layout.css';

// Footer Component
const Footer = ({ isMobile = false }) => {
  const navigate = useNavigate();
  const { t, isRTL, language } = useTranslate(); // <<< أضف الترجمة
  const footerIconSize = isMobile ? 16 : 24;
  const footerBadgeIconSize = isMobile ? 12 : 16;

  const footerLinks = {
    quickLinks: [
      { name: t('resumeBuilder'), path: '/cv-generator' }
    ],
    resources: [
      { name: t('about'), path: '/about-us' },
      { name: t('contact'), path: '/contact-us' }
    ],
    legal: [
      { name: t('privacyPolicy'), path: '/privacy-policy' },
      { name: t('termsOfService'), path: '/terms-of-service' }
    ]
  };


  return (
    <footer className="footer" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="footer-container">
        <div className="footer-grid">
          {/* Company Info */}
          <div className="footer-column">
            <div className="footer-logo" onClick={() => navigate('/')}>
              <div className="footer-logo-icon">
                <Briefcase size={footerIconSize} />
              </div>
              <span className="footer-logo-text">GradJob</span>
            </div>
            <p className="footer-description">
              {language === 'en' 
                ? 'Your AI-powered career companion. Find your dream job and build your future with confidence.'
                : 'رفيقك المهني المدعوم بالذكاء الاصطناعي. ابحث عن وظيفة أحلامك وابنِ مستقبلك بثقة.'
              }
            </p>
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
                <Shield size={footerBadgeIconSize} />
                <span>{t('secure')}</span>
              </div>
              <div className="badge-item">
                <Heart size={footerBadgeIconSize} />
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, isRTL, language, toggleLanguage } = useTranslate(); // <<< أضف الترجمة
  const { user: currentUser, isAuthenticated: isLoggedIn, logout: handleLogoutContext, updateUser } = useAuth();

  const initialMobileState = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  const initialCompactState = typeof window !== 'undefined' ? window.innerWidth <= 480 : false;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [isMobileView, setIsMobileView] = useState(initialMobileState);
  const [isCompactView, setIsCompactView] = useState(initialCompactState);
  const navIconSize = isMobileView ? 18 : 28;
  const actionIconSize = isMobileView ? 16 : 20;
  const avatarIconSize = isMobileView ? 16 : 20;
  const logoIconSize = isMobileView ? 18 : 28;
  
  const userDropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const languageRef = useRef(null);
  const mobileMenuRef = useRef(null);

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

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobileView(width <= 768);
      setIsCompactView(width <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is inside dropdown (including buttons and SVGs inside)
      const clickedInsideUserDropdown = userDropdownRef.current?.contains(event.target) || 
                                        event.target.closest('.user-dropdown');
      const clickedInsideNotifications = notificationsRef.current?.contains(event.target) ||
                                         event.target.closest('.notifications-dropdown');
      const clickedInsideMobileMenu = mobileMenuRef.current?.contains(event.target) ||
                                      event.target.closest('.mobile-menu-content') ||
                                      event.target.closest('.mobile-menu-toggle');
      
      // Don't close if clicking inside the dropdown or mobile menu
      if (clickedInsideUserDropdown || clickedInsideNotifications || clickedInsideMobileMenu) {
        return;
      }
      
      // Close dropdowns if clicking outside
      setIsUserDropdownOpen(false);
      setIsNotificationsOpen(false);
      // Don't close mobile menu on outside click - let user close it explicitly
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Listen for auth logout events from API interceptor
  useEffect(() => {
    const handleAuthLogout = () => {
      // AuthContext will handle the logout, we just need to close modals
      setIsAuthModalOpen(false);
      setIsMobileMenuOpen(false);
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);

  // Update notification badge when user verification status changes
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      setHasNewNotifications(!currentUser.isVerified);
    } else {
      setHasNewNotifications(false);
    }
  }, [isLoggedIn, currentUser]);

  // Update user in context when user data changes (e.g., after profile update)
  useEffect(() => {
    if (currentUser) {
      updateUser(currentUser);
    }
  }, [currentUser, updateUser]);

  // Notifications - only show verification notification if user is not verified
  const notifications = useMemo(() => {
    const notifs = [];
    
    // Only show verification notification if user is logged in and not verified
    if (isLoggedIn && currentUser && !currentUser.isVerified) {
      notifs.push({
        id: 'verification',
        title: language === 'en' ? 'Verify Your Email' : 'تحقق من بريدك الإلكتروني',
        message: language === 'en'
          ? 'Please verify your email address to access all features'
          : 'يرجى التحقق من عنوان بريدك الإلكتروني للوصول إلى جميع الميزات',
        time: language === 'en' ? 'Action required' : 'إجراء مطلوب',
        unread: true,
        icon: Shield,
        color: 'orange',
        action: () => navigate('/dashboard')
      });
    }
    
    return notifs;
  }, [isLoggedIn, currentUser, language, navigate]);

  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    // Remove auth and redirect params from URL when closing
    if (searchParams.get('auth') === 'required') {
      searchParams.delete('auth');
      searchParams.delete('redirect');
      setSearchParams(searchParams);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    // Check if there's a redirect parameter
    const redirectPath = searchParams.get('redirect');
    if (redirectPath) {
      // Remove auth and redirect params from URL
      searchParams.delete('auth');
      searchParams.delete('redirect');
      setSearchParams(searchParams);
      navigate(redirectPath);
    } else {
      navigate('/dashboard');
    }
  };

  // Check for auth=required query parameter and open modal
  useEffect(() => {
    const authRequired = searchParams.get('auth');
    if (authRequired === 'required' && !isLoggedIn && !isAuthModalOpen) {
      // Open auth modal when auth is required
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
    }
  }, [searchParams, isLoggedIn, isAuthModalOpen, setSearchParams]);

  const handleLogout = () => {
    handleLogoutContext();
    setIsUserDropdownOpen(false);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
    setIsNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    setIsUserDropdownOpen(false);
    // Only clear notification badge if user is verified
    if (isNotificationsOpen === false && currentUser?.isVerified) {
      setHasNewNotifications(false);
    }
  };

  const navLinks = [
    { name: t('home'), path: '/', icon: Briefcase },
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
              <Briefcase size={logoIconSize} />
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
                  <Icon size={navIconSize} className="nav-link-icon" />
                  {link.name}
                  {isActivePath(link.path) && <div className="nav-link-indicator"></div>}
                </button>
              );
            })}
          </div>

          {/* Desktop Actions */}
          {!isMobileView && (
            <div className="navbar-actions">
              {/* Language Toggle */}
              <ThemeToggle />
              <div className="language-toggle-wrapper" ref={languageRef}>
                <button
                  onClick={toggleLanguage}
                  className="icon-action-btn language-toggle"
                  title={language === 'en' ? 'Switch to Arabic' : 'التغيير إلى الإنجليزية'}
                >
                <Languages size={actionIconSize} />
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
                    <Bell size={actionIconSize} />
                      {hasNewNotifications && <span className="notification-badge"></span>}
                    </button>

                    {/* Notifications Dropdown */}
                  {isNotificationsOpen && (
                    <div
                      className="notifications-dropdown"
                      style={{
                        width: isCompactView ? '92vw' : '380px',
                        right: isCompactView ? '4vw' : '0'
                      }}
                    >
                        <div className="notifications-header">
                          <h3>{t('notifications')}</h3>
                          <button className="mark-read-btn">{t('markAllRead')}</button>
                        </div>
                        <div className="notifications-list">
                          {notifications.length > 0 ? (
                            notifications.map((notif) => {
                              const NotifIcon = notif.icon;
                              return (
                                <div
                                  key={notif.id}
                                  className={`notification-item ${notif.unread ? 'unread' : ''}`}
                                  onClick={() => {
                                    if (notif.action) {
                                      notif.action();
                                      setIsNotificationsOpen(false);
                                    }
                                  }}
                                  style={{ cursor: notif.action ? 'pointer' : 'default' }}
                                >
                                <div className={`notification-icon ${notif.color}`}>
                                  <NotifIcon size={navIconSize} />
                                  </div>
                                  <div className="notification-content">
                                    <h4>{notif.title}</h4>
                                    <p>{notif.message}</p>
                                    <span className="notification-time">{notif.time}</span>
                                  </div>
                                  {notif.unread && <div className="unread-dot"></div>}
                                </div>
                              );
                            })
                          ) : (
                            <div className="notification-empty">
                              <p>{language === 'en' ? 'No notifications' : 'لا توجد إشعارات'}</p>
                            </div>
                          )}
                        </div>
                        <div className="notifications-footer">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/notifications');
                              setIsNotificationsOpen(false);
                            }}
                          >
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
                      <User size={avatarIconSize} />
                      </div>
                      <span className="user-name">{currentUser?.fullName || t('me')}</span>
                      <ChevronDown
                      size={isMobileView ? 12 : 16}
                        className={`dropdown-arrow ${isUserDropdownOpen ? 'open' : ''}`}
                      />
                    </button>

                    {/* User Dropdown Menu */}
                    {isUserDropdownOpen && (
                      <div className="user-dropdown">
                        <div className="user-dropdown-header">
                          <div className="user-avatar-large">
                          <User size={isMobileView ? 18 : 24} />
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(item.path);
                                  setIsUserDropdownOpen(false);
                                }}
                                className="user-dropdown-item"
                              >
                              <ItemIcon size={navIconSize} />
                                {item.name}
                              </button>
                            );
                          })}
                        </div>

                        <div className="user-dropdown-footer">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLogout();
                            }} 
                            className="logout-btn"
                          >
                          <LogOut size={navIconSize} />
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
                  <Zap size={actionIconSize} />
                    {t('signUpFree')}
                  </button>
                </>
              )}
            </div>
          )}

          {isMobileView && (
            <div className="navbar-mobile-actions">
              <button
                onClick={toggleLanguage}
                className="mobile-icon-btn"
                title={language === 'en' ? 'Switch to Arabic' : 'التغيير إلى الإنجليزية'}
                aria-label={language === 'en' ? 'Switch to Arabic' : 'التغيير إلى الإنجليزية'}
              >
                <Languages size={actionIconSize} />
              </button>
              {isLoggedIn ? (
                <button
                  className="mobile-icon-btn"
                  onClick={() => navigate('/dashboard')}
                  aria-label={t('dashboard')}
                >
                  <User size={avatarIconSize} />
                </button>
              ) : (
                <button
                  className="mobile-auth-btn"
                  onClick={() => openAuthModal('login')}
                >
                  {t('login')}
                </button>
              )}
              <button
                className="mobile-menu-toggle"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? (language === 'en' ? 'Close menu' : 'إغلاق القائمة') : (language === 'en' ? 'Open menu' : 'افتح القائمة')}
              >
            {isMobileMenuOpen ? <X size={actionIconSize} /> : <Menu size={actionIconSize} />}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Enhanced Mobile Menu - Outside navbar for proper positioning */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu" 
          ref={mobileMenuRef}
          onClick={(e) => {
            // Close menu when clicking the overlay (dark background)
            if (e.target === e.currentTarget || e.target.classList.contains('mobile-menu')) {
              setIsMobileMenuOpen(false);
            }
          }}
        >
          <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
              {/* Mobile Menu Header */}
              <div className="mobile-menu-header">
                {/* Language Toggle */}
                <ThemeToggle />
                <div className="mobile-language-toggle">
                  <button
                    onClick={toggleLanguage}
                    className="mobile-language-btn"
                  >
                    <Languages size={actionIconSize} />
                    <span>{language === 'en' ? 'العربية' : 'English'}</span>
                  </button>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mobile-close-btn"
                  aria-label="Close menu"
                >
                  <X size={22} />
                </button>
              </div>

              {/* User Info (if logged in) */}
              {isLoggedIn && (
                <div className="mobile-user-info">
                  <div className="mobile-user-avatar">
                    <User size={avatarIconSize} />
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
                      <Icon size={navIconSize} />
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
                          <ItemIcon size={navIconSize} />
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
                    <LogOut size={navIconSize} />
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
                      <Zap size={navIconSize} />
                      {t('signUpFree')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        defaultTab={authModalTab}
        onSuccess={handleAuthSuccess}
      />

      {/* Career Objective Modal - Global onboarding */}
      <CareerObjectiveModal />

      {/* Career Objective Reminder Banner */}
      <CareerObjectiveReminder />

      {/* Page Content */}
      <main className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>

      {/* Enhanced Footer */}
      <Footer isMobile={isMobileView} />
    </div>
  );
};

export default Layout;
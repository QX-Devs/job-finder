import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to dynamically update the page title based on the current route
 * @param {string} customTitle - Optional custom title to override the route-based title
 */
const usePageTitle = (customTitle) => {
  const location = useLocation();

  useEffect(() => {
    // Map of routes to page titles
    const routeTitles = {
      '/': 'Home',
      '/about-us': 'About Us',
      '/contact-us': 'Contact Us',
      '/privacy-policy': 'Privacy Policy',
      '/terms-of-service': 'Terms of Service',
      '/cv-prompt': 'CV Prompt',
      '/cv-generator': 'CV Generator',
      '/companies': 'Companies',
      '/career-advice': 'Career Advice',
      '/blog': 'Blog',
      '/faq': 'FAQ',
      '/cookies': 'Cookies Policy',
      '/accessibility': 'Accessibility',
      '/me': 'My Profile',
      '/dashboard': 'Dashboard',
      '/applications': 'Applications',
      '/saved-jobs': 'Saved Jobs',
      '/settings': 'Settings',
      '/notifications': 'Notifications',
    };

    // Get the title based on the current path
    let title = customTitle || routeTitles[location.pathname];

    // If no specific title found, create one from the pathname
    if (!title && location.pathname !== '/') {
      title = location.pathname
        .split('/')
        .filter(Boolean)
        .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '))
        .join(' - ');
    }

    // Set the document title with the app name suffix
    document.title = title ? `${title} | GradJob` : 'GradJob';
  }, [location.pathname, customTitle]);
};

export default usePageTitle;

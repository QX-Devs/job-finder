import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './CareerObjectiveReminder.css';

const CareerObjectiveReminder = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissedThisSession, setDismissedThisSession] = useState(false);

  // Pages where banner should NOT appear
  const excludedPaths = [
    '/cv-generator',
    '/cv-prompt',
    '/settings'
  ];

  useEffect(() => {
    // Show banner if:
    // 1. User is authenticated
    // 2. User doesn't have careerObjective
    // 3. Current path is not excluded
    // 4. Banner hasn't been dismissed in this session
    // 5. Modal was skipped (listen for custom event)
    if (isAuthenticated && user) {
      const hasCareerObjective = user.careerObjective && user.careerObjective.trim();
      const isExcluded = excludedPaths.some(path => 
        location.pathname === path || location.pathname.startsWith(path)
      );

      if (!hasCareerObjective && !isExcluded && !dismissedThisSession) {
        setShowBanner(true);
      } else {
        setShowBanner(false);
      }
    } else {
      setShowBanner(false);
    }
  }, [isAuthenticated, user, location.pathname, dismissedThisSession]);

  // Listen for skip event from modal
  useEffect(() => {
    const handleSkipEvent = () => {
      // Show banner when modal is skipped
      if (isAuthenticated && user && !user.careerObjective) {
        setShowBanner(true);
      }
    };

    window.addEventListener('careerObjectiveSkipped', handleSkipEvent);
    return () => window.removeEventListener('careerObjectiveSkipped', handleSkipEvent);
  }, [isAuthenticated, user]);

  // Reset dismissed state when user changes (login/logout)
  useEffect(() => {
    setDismissedThisSession(false);
  }, [user?.id]);

  const handleDismiss = () => {
    setDismissedThisSession(true);
    setShowBanner(false);
  };

  const handleGoToSettings = () => {
    navigate('/settings');
    handleDismiss();
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="career-objective-reminder">
      <div className="career-objective-reminder-content">
        <div className="career-objective-reminder-icon">
          <User size={20} />
        </div>
        <div className="career-objective-reminder-text">
          <strong>Complete your profile</strong>
          <span>Add your career objective to help us personalize your experience</span>
        </div>
        <div className="career-objective-reminder-actions">
          <button 
            className="career-objective-reminder-button"
            onClick={handleGoToSettings}
          >
            Add Now
            <ArrowRight size={16} />
          </button>
          <button 
            className="career-objective-reminder-close"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CareerObjectiveReminder;

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, User, Loader2 } from 'lucide-react';
import { Autocomplete, TextField, createFilterOptions } from '@mui/material';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import './CareerObjectiveModal.css';

const CareerObjectiveModal = () => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [careerObjective, setCareerObjective] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [skippedThisSession, setSkippedThisSession] = useState(false);
  const modalRef = useRef(null);

  // Career Objective suggestions
  const careerObjectiveOptions = [
    'Computer Science',
    'Software Engineering',
    'Full Stack Developer',
    'Backend Developer',
    'Frontend Developer',
    'Data Engineer',
    'AI & Machine Learning',
    'Cybersecurity',
    'Network Engineering',
    'Cloud Engineering',
    'DevOps',
    'Mobile App Development',
    'Game Development'
  ];

  // Pages where modal should NEVER appear
  const alwaysExcludedPaths = [
    '/cv-generator'
  ];

  const isAlwaysExcludedPath = alwaysExcludedPaths.some(path => 
    location.pathname === path || location.pathname.startsWith(path)
  );

  // Reset skipped state when user changes (login/logout)
  useEffect(() => {
    setSkippedThisSession(false);
  }, [user?.id]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showModal && !saving) {
        handleSkip();
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showModal, saving]);

  // Modal visibility logic - Show on every login until careerObjective is saved
  useEffect(() => {
    const userCareerObjective = user?.careerObjective || user?.professionalSummary || '';
    const hasCareerObjective = userCareerObjective && userCareerObjective.trim();
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 CareerObjectiveModal check:', {
        isAuthenticated,
        hasUser: !!user,
        hasCareerObjective,
        skippedThisSession,
        isAlwaysExcludedPath,
        currentPath: location.pathname,
        userCareerObjective: user?.careerObjective,
        userId: user?.id
      });
    }
    
    // Show modal if:
    // 1. User is authenticated
    // 2. User exists
    // 3. User doesn't have careerObjective
    // 4. Not on excluded paths
    // 5. Not skipped in this session (session-only, resets on login/logout)
    if (isAuthenticated && user && !hasCareerObjective && !isAlwaysExcludedPath && !skippedThisSession) {
      // Pre-fill if any value exists
      if (userCareerObjective) {
        setCareerObjective(userCareerObjective);
      }
      
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        setShowModal(true);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Showing CareerObjectiveModal');
        }
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setShowModal(false);
    }
  }, [isAuthenticated, user, location.pathname, isAlwaysExcludedPath, skippedThisSession]);

  const handleSave = async () => {
    if (!careerObjective || !careerObjective.trim()) {
      setError('Career Objective is required. Please select or enter your career objective.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const response = await authService.updateProfile({
        careerObjective: careerObjective.trim()
      });
      
      if (response?.success) {
        // Update user in context
        const updatedUser = { ...user, careerObjective: careerObjective.trim() };
        updateUser(updatedUser);
        
        // Show success animation
        setShowSuccess(true);
        
        // Close modal after animation
        setTimeout(() => {
          setShowModal(false);
          setShowSuccess(false);
        }, 800);
      } else {
        setError(response?.message || 'Failed to save career objective');
        setSaving(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to save career objective');
      setSaving(false);
    }
  };

  const handleSkip = () => {
    // Only hide for this session - will show again on next login
    setSkippedThisSession(true);
    setShowModal(false);
    
    // Trigger reminder banner by setting a session-only flag
    // The reminder banner will check this
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('careerObjectiveSkipped'));
    }
  };

  if (!showModal) {
    return null;
  }

  return (
    <div 
      className="career-objective-modal-overlay" 
      onClick={(e) => {
        // Don't close on overlay click
        e.stopPropagation();
      }}
    >
      <div 
        ref={modalRef}
        className={`career-objective-modal ${showSuccess ? 'success' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="career-objective-modal-header">
          <div className="career-objective-modal-icon">
            <User size={24} />
          </div>
          <h2>Career Objective</h2>
          <button 
            className="career-objective-modal-close"
            onClick={handleSkip}
            aria-label="Close"
            disabled={saving}
          >
            <X size={20} />
          </button>
        </div>

        <div className="career-objective-modal-body">
          <div className="career-objective-modal-input">
            <label>
              Career Objective / Professional Summary <span className="required">*</span>
            </label>
            <Autocomplete
              freeSolo
              disabled={saving}
              options={careerObjectiveOptions}
              value={careerObjective || null}
              onChange={(event, newValue) => {
                setCareerObjective(newValue || '');
                setError('');
              }}
              onInputChange={(event, newInputValue) => {
                setCareerObjective(newInputValue);
                setError('');
              }}
              filterOptions={(options, params) => {
                const filtered = createFilterOptions()(options, params);
                if (params.inputValue !== '' && !filtered.some(option => option === params.inputValue)) {
                  filtered.push(params.inputValue);
                }
                return filtered;
              }}
              disablePortal={false}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="e.g., Software Engineering, Full Stack Developer..."
                  variant="outlined"
                  size="small"
                  required
                  disabled={saving}
                  error={!!error}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      fontSize: '14px',
                      backgroundColor: '#fff',
                      '& fieldset': {
                        borderColor: error ? '#ef4444' : '#d1d5db',
                      },
                      '&:hover fieldset': {
                        borderColor: error ? '#ef4444' : '#9ca3af',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: error ? '#ef4444' : '#00a651',
                        borderWidth: '2px',
                      },
                      '&.Mui-disabled': {
                        backgroundColor: '#f9fafb',
                      },
                    },
                    '& .MuiInputBase-input': {
                      padding: '10px 14px',
                    },
                  }}
                />
              )}
              sx={{
                '& .MuiAutocomplete-listbox': {
                  padding: '4px',
                },
                '& .MuiAutocomplete-option': {
                  borderRadius: '6px',
                  margin: '2px 0',
                  padding: '8px 14px',
                  fontSize: '14px',
                  '&:hover': {
                    backgroundColor: '#f3f4f6',
                  },
                  '&[aria-selected="true"]': {
                    backgroundColor: '#e8f5e9',
                    color: '#00a651',
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Error message at bottom with fade animation */}
        {error && (
          <div className="career-objective-modal-error">
            {error}
          </div>
        )}

        <div className="career-objective-modal-footer">
          <button
            className="career-objective-modal-skip"
            onClick={handleSkip}
            disabled={saving}
          >
            Skip for now
          </button>
          <button
            className="career-objective-modal-save"
            onClick={handleSave}
            disabled={saving || !careerObjective?.trim()}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="spinner" />
                Saving...
              </>
            ) : (
              'Save & Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CareerObjectiveModal;

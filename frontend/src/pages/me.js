import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import authService from '../services/authService';
import { apiHelpers } from '../services/api';
import { sanitizeText } from '../utils/textSanitizer';
import './me.css';

function Me() {
  const { t, direction } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    employmentStatus: '',
    careerObjective: '',
    resumeVisibility: 'private'
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Sanitize text fields that may contain special characters
    const sanitizedValue = (name === 'careerObjective' || name === 'location') 
      ? sanitizeText(value) 
      : value;
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting to fetch user profile...');
      const response = await authService.getCurrentUser();
      
      console.log('Backend response:', response);
      
      if (response && response.success) {
        console.log('User data received:', response.data);
        setUser(response.data);
        setFormData({
          fullName: response.data.fullName || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          location: response.data.location || '',
          employmentStatus: response.data.employmentStatus || '',
          careerObjective: response.data.careerObjective || '',
          resumeVisibility: response.data.resumeVisibility || 'private'
        });
      } else {
        const errorMsg = response?.message || t('loadProfileFailed');
        console.error('Error in response:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message || t('loadProfileFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Sanitize text fields before submitting
      const sanitizedFormData = {
        ...formData,
        careerObjective: sanitizeText(formData.careerObjective || ''),
        location: sanitizeText(formData.location || '')
      };
      // Use apiHelpers for consistency with auth
      const response = await apiHelpers.put('/me', sanitizedFormData);
      
      console.log('Update response:', response.data);
      
      if (response.data.success) {
        setUser(response.data.data);
        setIsEditing(false);
        // Optional: Show success message
      } else {
        setError(response.data.message || t('updateProfileFailed'));
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || t('updateProfileFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  if (loading) {
    return (
      <div className="me-container">
        <div className="loading">{t('loading')}</div>
      </div>
    );
  }

  if (error && !isEditing) {
    return (
      <div className="me-container">
        <div className="error">
          {error}
          <button onClick={fetchUserProfile} style={{marginLeft: '10px'}}>
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  const educationCount = user?.education?.length || 0;
  const experienceCount = user?.experience?.length || 0;
  const skillsCount = user?.skills?.length || 0;
  const initials = (user?.fullName || 'U')
    .split(' ')
    .map(s => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="me-container">
      <div className="me-card">
        <div className="me-header">
          <div className="me-identity">
            <div className="me-avatar">{initials}</div>
            <div>
              <h1 className="me-title">{user?.fullName || t('myProfile')}</h1>
              <p className="me-subtitle">{user?.email}</p>
            </div>
          </div>
          <div className="me-actions">
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="btn-edit-primary">
                {t('editProfile')}
              </button>
            )}
            <button onClick={handleLogout} className="btn-logout">
              {t('logout')}
            </button>
          </div>
        </div>

        <div className="me-stats">
          <div className="stat-pill">
            <span className="pill-dot" />
            {educationCount} {t('education')}
          </div>
          <div className="stat-pill">
            <span className="pill-dot" />
            {experienceCount} {t('experience')}
          </div>
          <div className="stat-pill">
            <span className="pill-dot" />
            {skillsCount} {t('skills')}
          </div>
          <div className="stat-pill">
            <span className="pill-dot" />
            {t('visibility')}: {user?.resumeVisibility || 'private'}
          </div>
        </div>

        {error && isEditing && <div className="error-message">{error}</div>}

        {!isEditing ? (
          // View Mode
          <div className="me-content">
            <div className="profile-section">
              <h2>{t('personalInformation')}</h2>
              <div className="profile-grid">
                <div className="profile-item">
                  <label>{t('fullName')}</label>
                  <p>{user?.fullName || t('notProvided')}</p>
                </div>
                <div className="profile-item">
                  <label>{t('email')}</label>
                  <p>{user?.email || t('notProvided')}</p>
                </div>
                <div className="profile-item">
                  <label>{t('phone')}</label>
                  <p>{user?.phone || t('notProvided')}</p>
                </div>
                <div className="profile-item">
                  <label>{t('location')}</label>
                  <p>{user?.location || t('notProvided')}</p>
                </div>
                <div className="profile-item">
                  <label>{t('employmentStatus')}</label>
                  <p>{user?.employmentStatus || t('notProvided')}</p>
                </div>
                <div className="profile-item">
                  <label>{t('resumeVisibility')}</label>
                  <p className={`visibility ${user?.resumeVisibility}`}>
                    {user?.resumeVisibility || 'private'}
                  </p>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h2>{t('careerObjective')}</h2>
              <p className="career-objective">{user?.careerObjective || t('notProvided')}</p>
            </div>

            {user?.education && user.education.length > 0 && (
              <div className="profile-section">
                <h2>{t('education')}</h2>
                {user.education.map((edu, idx) => (
                  <div key={idx} className="list-item">
                    <h3>{edu.degree} {edu.major ? `${t('in')} ${edu.major}` : ''}</h3>
                    <div className="education-row">
                      <p className="education-institution">{edu.institution}</p>
                      {edu.graduationYear && (
                        <p className="year">{edu.graduationYear}</p>
                      )}
                    </div>
                    {edu.gpa && edu.gpa.trim() && (
                      <p style={{ marginTop: '4px', fontStyle: 'italic', color: '#6b7280', fontSize: '0.9rem' }}>
                        GPA: {edu.gpa}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {user?.experience && user.experience.length > 0 && (
              <div className="profile-section">
                <h2>{t('experience')}</h2>
                {user.experience.map((exp, idx) => (
                  <div key={idx} className="list-item">
                    <h3>{exp.jobTitle}</h3>
                    <p>{exp.company}</p>
                    <p className="dates">{exp.startDate} - {exp.isCurrentJob ? t('present') : exp.endDate}</p>
                    <p>{exp.description}</p>
                  </div>
                ))}
              </div>
            )}

            {user?.skills && user.skills.length > 0 && (
              <div className="profile-section">
                <h2>{t('skills')}</h2>
                <div className="skills-container">
                  {user.skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag">{skill.skillName}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Edit Mode
          <form onSubmit={handleSubmit} className="me-form">
            <div className="form-group">
              <label>{t('fullName')}</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('email')}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                title={t('emailCannotChange')}
              />
            </div>

            <div className="form-group">
              <label>{t('phone')}</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>{t('location')}</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder={t('locationPlaceholder')}
              />
            </div>

            <div className="form-group">
              <label>{t('employmentStatus')}</label>
              <select
                name="employmentStatus"
                value={formData.employmentStatus}
                onChange={handleInputChange}
              >
                <option value="">{t('selectStatus')}</option>
                <option value="Student">{t('student')}</option>
                <option value="Graduate">{t('graduate')}</option>
                <option value="Experienced">{t('experienced')}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t('resumeVisibility')}</label>
              <select
                name="resumeVisibility"
                value={formData.resumeVisibility}
                onChange={handleInputChange}
              >
                <option value="private">{t('private')}</option>
                <option value="public">{t('public')}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t('careerObjective')}</label>
              <textarea
                name="careerObjective"
                value={formData.careerObjective}
                onChange={handleInputChange}
                placeholder={t('careerObjectivePlaceholder')}
                rows="5"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save-primary" disabled={loading}>
                {loading ? t('saving') : t('saveChanges')}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Me;
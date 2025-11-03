import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import { apiHelpers } from '../services/api';
import './me.css';

function Me() {
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
  console.log('=== Me Page Mounted ===');
  console.log('Token:', authService.getToken()?.substring(0, 20) + '...');
  console.log('Stored User:', authService.getStoredUser());
  fetchUserProfile();
}, []);
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
        const errorMsg = response?.message || 'Failed to load profile';
        console.error('Error in response:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Use apiHelpers for consistency with auth
      const response = await apiHelpers.put('/me', formData);
      
      console.log('Update response:', response.data);
      
      if (response.data.success) {
        setUser(response.data.data);
        setIsEditing(false);
        // Optional: Show success message
      } else {
        setError(response.data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  if (loading) {
    return <div className="me-container"><div className="loading">Loading...</div></div>;
  }

  if (error && !isEditing) {
    return (
      <div className="me-container">
        <div className="error">
          {error}
          <button onClick={fetchUserProfile} style={{marginLeft: '10px'}}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="me-container">
      <div className="me-card">
        <div className="me-header">
          <h1>My Profile</h1>
          <div className="me-actions">
            {!isEditing && <button onClick={() => setIsEditing(true)} className="btn-edit">Edit Profile</button>}
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        </div>

        {error && isEditing && <div className="error-message">{error}</div>}

        {!isEditing ? (
          // View Mode
          <div className="me-content">
            <div className="profile-section">
              <h2>Personal Information</h2>
              <div className="profile-grid">
                <div className="profile-item">
                  <label>Full Name</label>
                  <p>{user?.fullName || 'Not provided'}</p>
                </div>
                <div className="profile-item">
                  <label>Email</label>
                  <p>{user?.email || 'Not provided'}</p>
                </div>
                <div className="profile-item">
                  <label>Phone</label>
                  <p>{user?.phone || 'Not provided'}</p>
                </div>
                <div className="profile-item">
                  <label>Location</label>
                  <p>{user?.location || 'Not provided'}</p>
                </div>
                <div className="profile-item">
                  <label>Employment Status</label>
                  <p>{user?.employmentStatus || 'Not provided'}</p>
                </div>
                <div className="profile-item">
                  <label>Resume Visibility</label>
                  <p className={`visibility ${user?.resumeVisibility}`}>
                    {user?.resumeVisibility || 'private'}
                  </p>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h2>Career Objective</h2>
              <p className="career-objective">{user?.careerObjective || 'Not provided'}</p>
            </div>

            {user?.education && user.education.length > 0 && (
              <div className="profile-section">
                <h2>Education</h2>
                {user.education.map((edu, idx) => (
                  <div key={idx} className="list-item">
                    <h3>{edu.degree} in {edu.major}</h3>
                    <p>{edu.institution}</p>
                    <p className="year">{edu.graduationYear}</p>
                  </div>
                ))}
              </div>
            )}

            {user?.experience && user.experience.length > 0 && (
              <div className="profile-section">
                <h2>Experience</h2>
                {user.experience.map((exp, idx) => (
                  <div key={idx} className="list-item">
                    <h3>{exp.jobTitle}</h3>
                    <p>{exp.company}</p>
                    <p className="dates">{exp.startDate} - {exp.isCurrentJob ? 'Present' : exp.endDate}</p>
                    <p>{exp.description}</p>
                  </div>
                ))}
              </div>
            )}

            {user?.skills && user.skills.length > 0 && (
              <div className="profile-section">
                <h2>Skills</h2>
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
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                title="Email cannot be changed"
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Amman, Jordan"
              />
            </div>

            <div className="form-group">
              <label>Employment Status</label>
              <select
                name="employmentStatus"
                value={formData.employmentStatus}
                onChange={handleInputChange}
              >
                <option value="">Select Status</option>
                <option value="Student">Student</option>
                <option value="Graduate">Graduate</option>
                <option value="Experienced">Experienced</option>
              </select>
            </div>

            <div className="form-group">
              <label>Resume Visibility</label>
              <select
                name="resumeVisibility"
                value={formData.resumeVisibility}
                onChange={handleInputChange}
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>

            <div className="form-group">
              <label>Career Objective</label>
              <textarea
                name="careerObjective"
                value={formData.careerObjective}
                onChange={handleInputChange}
                placeholder="Tell us about your career goals"
                rows="5"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Me;
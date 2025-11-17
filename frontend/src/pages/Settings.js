import React, { useEffect, useState, useRef } from 'react';
import ReactCountryFlag from 'react-country-flag';
import authService from '../services/authService';
import './Settings.css';

const countryCodes = [
  { code: '+962', country: 'Jordan', countryCode: 'JO' },
  { code: '+1', country: 'US/CA', countryCode: 'US' },
  { code: '+44', country: 'UK', countryCode: 'GB' },
  { code: '+91', country: 'IN', countryCode: 'IN' },
  { code: '+86', country: 'CN', countryCode: 'CN' },
  { code: '+81', country: 'JP', countryCode: 'JP' },
  { code: '+49', country: 'DE', countryCode: 'DE' },
  { code: '+33', country: 'FR', countryCode: 'FR' },
  { code: '+39', country: 'IT', countryCode: 'IT' },
  { code: '+34', country: 'ES', countryCode: 'ES' },
  { code: '+7', country: 'RU', countryCode: 'RU' },
  { code: '+61', country: 'AU', countryCode: 'AU' },
  { code: '+55', country: 'BR', countryCode: 'BR' },
  { code: '+82', country: 'KR', countryCode: 'KR' },
  { code: '+52', country: 'MX', countryCode: 'MX' },
  { code: '+31', country: 'NL', countryCode: 'NL' },
  { code: '+46', country: 'SE', countryCode: 'SE' },
  { code: '+47', country: 'NO', countryCode: 'NO' },
  { code: '+45', country: 'DK', countryCode: 'DK' },
  { code: '+41', country: 'CH', countryCode: 'CH' },
  { code: '+43', country: 'AT', countryCode: 'AT' },
  { code: '+32', country: 'BE', countryCode: 'BE' },
  { code: '+351', country: 'PT', countryCode: 'PT' },
  { code: '+30', country: 'GR', countryCode: 'GR' },
  { code: '+48', country: 'PL', countryCode: 'PL' },
  { code: '+420', country: 'CZ', countryCode: 'CZ' },
  { code: '+36', country: 'HU', countryCode: 'HU' },
  { code: '+40', country: 'RO', countryCode: 'RO' },
  { code: '+64', country: 'NZ', countryCode: 'NZ' },
  { code: '+65', country: 'SG', countryCode: 'SG' },
  { code: '+60', country: 'MY', countryCode: 'MY' },
  { code: '+66', country: 'TH', countryCode: 'TH' },
  { code: '+84', country: 'VN', countryCode: 'VN' },
  { code: '+63', country: 'PH', countryCode: 'PH' },
  { code: '+62', country: 'ID', countryCode: 'ID' },
  { code: '+971', country: 'AE', countryCode: 'AE' },
  { code: '+966', country: 'SA', countryCode: 'SA' },
  { code: '+972', country: 'IL', countryCode: 'IL' },
  { code: '+90', country: 'TR', countryCode: 'TR' },
  { code: '+20', country: 'EG', countryCode: 'EG' },
  { code: '+27', country: 'ZA', countryCode: 'ZA' },
  { code: '+234', country: 'NG', countryCode: 'NG' },
  { code: '+254', country: 'KE', countryCode: 'KE' },
  { code: '+54', country: 'AR', countryCode: 'AR' },
  { code: '+56', country: 'CL', countryCode: 'CL' },
  { code: '+57', country: 'CO', countryCode: 'CO' },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [profile, setProfile] = useState({ fullName: '', phone: '', github: '', linkedin: '', resumeVisibility: 'private' });
  const [countryCode, setCountryCode] = useState('+962');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [usernames, setUsernames] = useState({ github: '', linkedin: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [privacy, setPrivacy] = useState({ isPublic: false });
  const [isCountrySelectOpen, setIsCountrySelectOpen] = useState(false);
  const countrySelectRef = useRef(null);

  useEffect(() => {
    (async () => {
      const res = await authService.getCurrentUser();
      if (res?.success && res.data) {
        const u = res.data;
        
        // Parse phone number to extract country code and number
        let parsedCode = '+962';
        let parsedNumber = u.phone || '';
        
        if (u.phone) {
          const matchedCode = countryCodes.find(cc => u.phone.startsWith(cc.code));
          if (matchedCode) {
            parsedCode = matchedCode.code;
            parsedNumber = u.phone.substring(matchedCode.code.length).trim();
          }
        }
        
        setCountryCode(parsedCode);
        setPhoneNumber(parsedNumber);
        
        setProfile({
          fullName: u.fullName || '',
          phone: u.phone || '',
          github: u.github || '',
          linkedin: u.linkedin || '',
          resumeVisibility: u.resumeVisibility || 'private'
        });
        
        // Derive usernames from URLs
        const gh = (u.github || '').replace(/^https?:\/\/github\.com\//i, '').replace(/\/?$/, '');
        const li = (u.linkedin || '').replace(/^https?:\/\/([a-z]+\.)?linkedin\.com\/in\//i, '').replace(/\/?$/, '');
        setUsernames({ github: gh, linkedin: li });
        setPrivacy({ isPublic: (u.resumeVisibility === 'public') });
      }
    })();
  }, []);

  const showMsg = (m) => { setMessage(m); setTimeout(() => setMessage(''), 3000); };
  const showErr = (e) => { setError(e); setTimeout(() => setError(''), 4000); };

  // Close country select when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countrySelectRef.current && !countrySelectRef.current.contains(event.target)) {
        setIsCountrySelectOpen(false);
      }
    };

    if (isCountrySelectOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCountrySelectOpen]);

  const saveProfile = async () => {
    // Validation
    if (!profile.fullName || profile.fullName.trim() === '') {
      showErr('Full name is required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const fullPhone = phoneNumber ? `${countryCode}${phoneNumber}` : '';
      const payload = {
        fullName: profile.fullName.trim(),
        phone: fullPhone,
        countryCode: countryCode, // Send country code separately
        github: usernames.github ? `https://github.com/${usernames.github}` : '',
        linkedin: usernames.linkedin ? `https://linkedin.com/in/${usernames.linkedin}` : '',
      };
      const res = await authService.updateProfile(payload);
      if (res?.success) {
        showMsg('Profile updated successfully');
        // Update local storage with new user data
        if (res.data) {
          authService.setUser(res.data);
          // Update local state to reflect saved data
          setProfile(prev => ({
            ...prev,
            fullName: res.data.fullName || prev.fullName,
            phone: res.data.phone || prev.phone,
            github: res.data.github || prev.github,
            linkedin: res.data.linkedin || prev.linkedin
          }));
        }
      }
    } catch (e) {
      showErr(e.response?.data?.message || e.message || 'Failed to update profile');
    } finally { setLoading(false); }
  };

  const changePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword) {
      showErr('Please fill in all password fields');
      return;
    }
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      showErr('New passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 6) {
      showErr('New password must be at least 6 characters long');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await authService.changePassword(passwords.currentPassword, passwords.newPassword);
      if (res?.success) {
        showMsg('Password updated successfully');
        setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      }
    } catch (e) {
      showErr(e.response?.data?.message || e.message || 'Failed to change password');
    } finally { setLoading(false); }
  };

  const savePrivacy = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await authService.updateProfile({ resumeVisibility: privacy.isPublic ? 'public' : 'private' });
      if (res?.success) {
        showMsg('Privacy settings saved successfully');
        // Update local storage with new user data
        if (res.data) {
          authService.setUser(res.data);
          // Update local profile state
          setProfile(prev => ({ ...prev, resumeVisibility: res.data.resumeVisibility || 'private' }));
          setPrivacy({ isPublic: res.data.resumeVisibility === 'public' });
        }
      }
    } catch (e) {
      showErr(e.response?.data?.message || e.message || 'Failed to save privacy');
    } finally { setLoading(false); }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    try {
      setLoading(true);
      setError('');
      const res = await authService.deleteAccount();
      if (res?.success) {
        authService.clearAuth();
        window.location.href = '/';
      }
    } catch (e) {
      showErr(e.response?.data?.message || e.message || 'Failed to delete account');
    } finally { setLoading(false); }
  };

  return (
    <div className="settings-container">
      <div className="settings-card">
        <div className="settings-header">
          <h1>Settings</h1>
          <div className="settings-tabs">
            <button className={activeTab==='account'?'active':''} onClick={()=>setActiveTab('account')}>Account</button>
            <button className={activeTab==='security'?'active':''} onClick={()=>setActiveTab('security')}>Security</button>
            <button className={activeTab==='privacy'?'active':''} onClick={()=>setActiveTab('privacy')}>Privacy</button>
          </div>
        </div>

        {message && <div className="settings-success">{message}</div>}
        {error && <div className="settings-error">{error}</div>}

        {activeTab === 'account' && (
          <div className="settings-section">
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input value={profile.fullName} onChange={(e)=>setProfile({...profile, fullName:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <div className="phone-input-container">
                  <div className="custom-country-select-wrapper" ref={countrySelectRef}>
                    <button
                      type="button"
                      className="country-code-select"
                      onClick={() => setIsCountrySelectOpen(!isCountrySelectOpen)}
                    >
                      {(() => {
                        const selectedCountry = countryCodes.find(cc => cc.code === countryCode);
                        return selectedCountry ? (
                          <>
                            <ReactCountryFlag 
                              countryCode={selectedCountry.countryCode} 
                              svg 
                              style={{ width: '1.3em', height: '1.3em', marginRight: '8px' }} 
                            />
                            <span>{selectedCountry.code} {selectedCountry.country}</span>
                          </>
                        ) : (
                          <span>Select Country</span>
                        );
                      })()}
                    </button>
                    {isCountrySelectOpen && (
                      <div className="country-select-dropdown">
                        {countryCodes.map(cc => (
                          <button
                            key={cc.code}
                            type="button"
                            className={`country-select-option ${cc.code === countryCode ? 'selected' : ''}`}
                            onClick={() => {
                              setCountryCode(cc.code);
                              setIsCountrySelectOpen(false);
                            }}
                          >
                            <ReactCountryFlag 
                              countryCode={cc.countryCode} 
                              svg 
                              style={{ width: '1.3em', height: '1.3em', marginRight: '8px' }} 
                            />
                            <span>{cc.code} {cc.country}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input 
                    type="tel" 
                    className="phone-number-input"
                    value={phoneNumber} 
                    onChange={(e)=>setPhoneNumber(e.target.value.replace(/\D/g, ''))} 
                    placeholder="123456789"
                  />
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>GitHub Username</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ whiteSpace: 'nowrap', color: '#6b7280' }}>github.com/</span>
                  <input value={usernames.github} onChange={(e)=>setUsernames({...usernames, github:e.target.value.replace(/\s+/g,'')})} placeholder="username" />
                </div>
              </div>
              <div className="form-group">
                <label>LinkedIn Username</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ whiteSpace: 'nowrap', color: '#6b7280' }}>linkedin.com/in/</span>
                  <input value={usernames.linkedin} onChange={(e)=>setUsernames({...usernames, linkedin:e.target.value.replace(/\s+/g,'')})} placeholder="username" />
                </div>
              </div>
            </div>
            <div className="actions">
              <button className="btn-primary" onClick={saveProfile} disabled={loading}>{loading?'Saving...':'Save Changes'}</button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="settings-section">
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" value={passwords.currentPassword} onChange={(e)=>setPasswords({...passwords, currentPassword:e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={passwords.newPassword} onChange={(e)=>setPasswords({...passwords, newPassword:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" value={passwords.confirmNewPassword} onChange={(e)=>setPasswords({...passwords, confirmNewPassword:e.target.value})} />
              </div>
            </div>
            <div className="actions">
              <button className="btn-primary" onClick={changePassword} disabled={loading}>{loading?'Saving...':'Update Password'}</button>
              <button className="btn-danger" onClick={deleteAccount} disabled={loading}>Delete Account</button>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="settings-section">
            <div className="form-group inline">
              <label>Public Profile</label>
              <input type="checkbox" checked={privacy.isPublic} onChange={(e)=>setPrivacy({ isPublic: e.target.checked })} />
            </div>
            <div className="actions">
              <button className="btn-primary" onClick={savePrivacy} disabled={loading}>{loading?'Saving...':'Save Privacy'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

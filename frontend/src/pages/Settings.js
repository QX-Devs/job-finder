// frontend/src/pages/Settings.js
import React, { useEffect, useState, useRef } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { Autocomplete, TextField, createFilterOptions } from '@mui/material';
import authService from '../services/authService';
import { useTranslate } from '../utils/translate';
import { useLanguage } from '../context/LanguageContext';

import './Settings.css';

const countryCodes = [
  { code: '+962', country: 'الأردن', countryCode: 'JO' },
  { code: '+1', country: 'الولايات المتحدة/كندا', countryCode: 'US' },
  { code: '+44', country: 'المملكة المتحدة', countryCode: 'GB' },
  { code: '+91', country: 'الهند', countryCode: 'IN' },
  { code: '+86', country: 'الصين', countryCode: 'CN' },
  { code: '+81', country: 'اليابان', countryCode: 'JP' },
  { code: '+49', country: 'ألمانيا', countryCode: 'DE' },
  { code: '+33', country: 'فرنسا', countryCode: 'FR' },
  { code: '+39', country: 'إيطاليا', countryCode: 'IT' },
  { code: '+34', country: 'إسبانيا', countryCode: 'ES' },
  { code: '+7', country: 'روسيا', countryCode: 'RU' },
  { code: '+61', country: 'أستراليا', countryCode: 'AU' },
  { code: '+55', country: 'البرازيل', countryCode: 'BR' },
  { code: '+82', country: 'كوريا الجنوبية', countryCode: 'KR' },
  { code: '+52', country: 'المكسيك', countryCode: 'MX' },
  { code: '+31', country: 'هولندا', countryCode: 'NL' },
  { code: '+46', country: 'السويد', countryCode: 'SE' },
  { code: '+47', country: 'النرويج', countryCode: 'NO' },
  { code: '+45', country: 'الدنمارك', countryCode: 'DK' },
  { code: '+41', country: 'سويسرا', countryCode: 'CH' },
  { code: '+43', country: 'النمسا', countryCode: 'AT' },
  { code: '+32', country: 'بلجيكا', countryCode: 'BE' },
  { code: '+351', country: 'البرتغال', countryCode: 'PT' },
  { code: '+30', country: 'اليونان', countryCode: 'GR' },
  { code: '+48', country: 'بولندا', countryCode: 'PL' },
  { code: '+420', country: 'التشيك', countryCode: 'CZ' },
  { code: '+36', country: 'المجر', countryCode: 'HU' },
  { code: '+40', country: 'رومانيا', countryCode: 'RO' },
  { code: '+64', country: 'نيوزيلندا', countryCode: 'NZ' },
  { code: '+65', country: 'سنغافورة', countryCode: 'SG' },
  { code: '+60', country: 'ماليزيا', countryCode: 'MY' },
  { code: '+66', country: 'تايلاند', countryCode: 'TH' },
  { code: '+84', country: 'فيتنام', countryCode: 'VN' },
  { code: '+63', country: 'الفلبين', countryCode: 'PH' },
  { code: '+62', country: 'إندونيسيا', countryCode: 'ID' },
  { code: '+971', country: 'الإمارات', countryCode: 'AE' },
  { code: '+966', country: 'السعودية', countryCode: 'SA' },
  { code: '+972', country: 'إسرائيل', countryCode: 'IL' },
  { code: '+90', country: 'تركيا', countryCode: 'TR' },
  { code: '+20', country: 'مصر', countryCode: 'EG' },
  { code: '+27', country: 'جنوب أفريقيا', countryCode: 'ZA' },
  { code: '+234', country: 'نيجيريا', countryCode: 'NG' },
  { code: '+254', country: 'كينيا', countryCode: 'KE' },
  { code: '+54', country: 'الأرجنتين', countryCode: 'AR' },
  { code: '+56', country: 'تشيلي', countryCode: 'CL' },
  { code: '+57', country: 'كولومبيا', countryCode: 'CO' },
];

const Settings = () => {
  const { t, isRTL } = useTranslate();
  const { language } = useLanguage();
  
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [profile, setProfile] = useState({ 
    fullName: '', 
    phone: '', 
    github: '', 
    linkedin: '', 
    resumeVisibility: 'private',
    careerObjective: '',
    location: ''
  });
  const [countryCode, setCountryCode] = useState('+962');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [usernames, setUsernames] = useState({ github: '', linkedin: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [privacy, setPrivacy] = useState({ isPublic: false });
  const [isCountrySelectOpen, setIsCountrySelectOpen] = useState(false);
  const countrySelectRef = useRef(null);

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

  // Location suggestions
  const locationOptions = [
    'Amman, Jordan',
    'Irbid, Jordan',
    'Zarqa, Jordan',
    'Aqaba, Jordan',
    'Madaba, Jordan',
    'Riyadh, Saudi Arabia',
    'Jeddah, Saudi Arabia',
    'Dubai, UAE',
    'Abu Dhabi, UAE',
    'Doha, Qatar',
    'Kuwait City, Kuwait',
    'Manama, Bahrain',
    'Muscat, Oman',
    'Beirut, Lebanon',
    'Cairo, Egypt',
    'Alexandria, Egypt',
    'Damascus, Syria',
    'Baghdad, Iraq',
    'Istanbul, Turkey',
    'Ankara, Turkey',
    'London, UK',
    'Manchester, UK',
    'New York, USA',
    'San Francisco, USA',
    'Los Angeles, USA',
    'Toronto, Canada',
    'Vancouver, Canada',
    'Berlin, Germany',
    'Munich, Germany',
    'Paris, France',
    'Amsterdam, Netherlands',
    'Stockholm, Sweden',
    'Remote'
  ];

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
          resumeVisibility: u.resumeVisibility || 'private',
          careerObjective: u.careerObjective || u.professionalSummary || '',
          location: u.location || ''
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
      showErr(t('fullNameRequired'));
      return;
    }
    
    if (!phoneNumber || phoneNumber.trim() === '') {
      showErr(t('phoneRequired') || 'Phone number is required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const fullPhone = `${countryCode}${phoneNumber}`;
      const payload = {
        fullName: profile.fullName.trim(),
        phone: fullPhone,
        countryCode: countryCode,
        github: usernames.github ? `https://github.com/${usernames.github}` : '',
        linkedin: usernames.linkedin ? `https://linkedin.com/in/${usernames.linkedin}` : '',
        careerObjective: profile.careerObjective || '',
        location: profile.location || ''
      };
      const res = await authService.updateProfile(payload);
      if (res?.success) {
        showMsg(t('profileUpdated'));
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
      showErr(e.response?.data?.message || e.message || t('updateProfileFailed'));
    } finally { setLoading(false); }
  };

  const changePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword) {
      showErr(t('requiredField'));
      return;
    }
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      showErr(t('passwordsDoNotMatch'));
      return;
    }
    if (passwords.newPassword.length < 6) {
      showErr(t('passwordTooShort'));
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await authService.changePassword(passwords.currentPassword, passwords.newPassword);
      if (res?.success) {
        showMsg(t('passwordUpdated'));
        setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      }
    } catch (e) {
      showErr(e.response?.data?.message || e.message || t('changePasswordFailed'));
    } finally { setLoading(false); }
  };

  const savePrivacy = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await authService.updateProfile({ resumeVisibility: privacy.isPublic ? 'public' : 'private' });
      if (res?.success) {
        showMsg(t('privacySettingsSaved'));
        // Update local storage with new user data
        if (res.data) {
          authService.setUser(res.data);
          // Update local profile state
          setProfile(prev => ({ ...prev, resumeVisibility: res.data.resumeVisibility || 'private' }));
          setPrivacy({ isPublic: res.data.resumeVisibility === 'public' });
        }
      }
    } catch (e) {
      showErr(e.response?.data?.message || e.message || t('savePrivacyFailed'));
    } finally { setLoading(false); }
  };

  const deleteAccount = async () => {
    if (!window.confirm(t('deleteAccountConfirm'))) return;
    try {
      setLoading(true);
      setError('');
      const res = await authService.deleteAccount();
      if (res?.success) {
        authService.clearAuth();
        window.location.href = '/';
      }
    } catch (e) {
      showErr(e.response?.data?.message || e.message || t('deleteAccountFailed'));
    } finally { setLoading(false); }
  };

  return (
    <div className={`settings-container ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="settings-card">
        <div className="settings-header">
          <h1>{t('settings')}</h1>
          <div className="settings-tabs">
            <button 
              className={activeTab==='account'?'active':''} 
              onClick={()=>setActiveTab('account')}
            >
              {t('account')}
            </button>
            <button 
              className={activeTab==='security'?'active':''} 
              onClick={()=>setActiveTab('security')}
            >
              {t('security')}
            </button>
            <button 
              className={activeTab==='privacy'?'active':''} 
              onClick={()=>setActiveTab('privacy')}
            >
              {t('privacy')}
            </button>
          </div>
        </div>

        {message && <div className="settings-success">{message}</div>}
        {error && <div className="settings-error">{error}</div>}

        {activeTab === 'account' && (
          <div className="settings-section">
            <div className="form-row">
              <div className="form-group">
                <label>{t('fullName')}</label>
                <input 
                  value={profile.fullName} 
                  onChange={(e)=>setProfile({...profile, fullName:e.target.value})} 
                  placeholder={t('enterFullName')}
                />
              </div>
              <div className="form-group">
                <label>{t('phoneNumber')}</label>
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
                              style={{ 
                                width: '1.3em', 
                                height: '1.3em', 
                                marginRight: isRTL ? '0' : '8px',
                                marginLeft: isRTL ? '8px' : '0'
                              }} 
                            />
                            <span>{selectedCountry.code} {selectedCountry.country}</span>
                          </>
                        ) : (
                          <span>{t('select')}</span>
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
                              style={{ 
                                width: '1.3em', 
                                height: '1.3em', 
                                marginRight: isRTL ? '0' : '8px',
                                marginLeft: isRTL ? '8px' : '0'
                              }} 
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
                    placeholder={t('phonePlaceholder')}
                  />
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('githubUsername')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ whiteSpace: 'nowrap', color: '#6b7280' }}>github.com/</span>
                  <input 
                    value={usernames.github} 
                    onChange={(e)=>setUsernames({...usernames, github:e.target.value.replace(/\s+/g,'')})} 
                    placeholder={t('username')} 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>{t('linkedinUsername')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ whiteSpace: 'nowrap', color: '#6b7280' }}>linkedin.com/in/</span>
                  <input 
                    value={usernames.linkedin} 
                    onChange={(e)=>setUsernames({...usernames, linkedin:e.target.value.replace(/\s+/g,'')})} 
                    placeholder={t('username')} 
                  />
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('careerObjective') || 'Career Objective / Professional Summary'}</label>
                <Autocomplete
                  freeSolo
                  options={careerObjectiveOptions}
                  value={profile.careerObjective || null}
                  onChange={(event, newValue) => {
                    setProfile({...profile, careerObjective: newValue || ''});
                  }}
                  onInputChange={(event, newInputValue) => {
                    setProfile({...profile, careerObjective: newInputValue});
                  }}
                  filterOptions={(options, params) => {
                    const filtered = createFilterOptions()(options, params);
                    // If user typed something that doesn't match, allow it as custom
                    if (params.inputValue !== '' && !filtered.some(option => option === params.inputValue)) {
                      filtered.push(params.inputValue);
                    }
                    return filtered;
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Type or select career objective (e.g., Software Engineering, Full Stack Developer...)"
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          fontSize: '16px',
                          '& fieldset': {
                            borderColor: '#d1d5db',
                          },
                          '&:hover fieldset': {
                            borderColor: '#9ca3af',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#00a651',
                            borderWidth: '2px',
                          },
                        },
                        '& .MuiInputBase-input': {
                          padding: '12px 14px',
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
                      padding: '10px 16px',
                      fontSize: '15px',
                      '&:hover': {
                        backgroundColor: '#f3f4f6',
                      },
                      '&[aria-selected="true"]': {
                        backgroundColor: '#e8f5e9',
                        color: '#00a651',
                        '&.Mui-focused': {
                          backgroundColor: '#e8f5e9',
                        },
                      },
                    },
                  }}
                />
              </div>
              
              <div className="form-group">
                <label>{t('location') || 'Location'}</label>
                <Autocomplete
                  freeSolo
                  options={locationOptions}
                  value={profile.location || null}
                  onChange={(event, newValue) => {
                    setProfile({...profile, location: newValue || ''});
                  }}
                  onInputChange={(event, newInputValue) => {
                    setProfile({...profile, location: newInputValue});
                  }}
                  filterOptions={(options, params) => {
                    const filtered = createFilterOptions()(options, params);
                    // If user typed something that doesn't match, allow it as custom
                    if (params.inputValue !== '' && !filtered.some(option => option === params.inputValue)) {
                      filtered.push(params.inputValue);
                    }
                    return filtered;
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Type or select location (e.g., Amman, Dubai, Remote...)"
                      variant="outlined"
                     sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          fontSize: '16px',
                          '& fieldset': {
                            borderColor: '#d1d5db',
                          },
                          '&:hover fieldset': {
                            borderColor: '#9ca3af',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#00a651',
                            borderWidth: '2px',
                          },
                        },
                        '& .MuiInputBase-input': {
                          padding: '12px 14px',
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
                      padding: '10px 16px',
                      fontSize: '15px',
                      '&:hover': {
                        backgroundColor: '#f3f4f6',
                      },
                      '&[aria-selected="true"]': {
                        backgroundColor: '#e8f5e9',
                        color: '#00a651',
                        '&.Mui-focused': {
                          backgroundColor: '#e8f5e9',
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
            <div className="actions">
              <button className="btn-primary" onClick={saveProfile} disabled={loading}>
                {loading ? t('saving') : t('saveChanges')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="settings-section">
            <div className="form-group">
              <label>{t('currentPassword')}</label>
              <input 
                type="password" 
                value={passwords.currentPassword} 
                onChange={(e)=>setPasswords({...passwords, currentPassword:e.target.value})} 
                placeholder={t('enterCurrentPassword')}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('newPassword')}</label>
                <input 
                  type="password" 
                  value={passwords.newPassword} 
                  onChange={(e)=>setPasswords({...passwords, newPassword:e.target.value})} 
                  placeholder={t('enterNewPassword')}
                />
              </div>
              <div className="form-group">
                <label>{t('confirmNewPassword')}</label>
                <input 
                  type="password" 
                  value={passwords.confirmNewPassword} 
                  onChange={(e)=>setPasswords({...passwords, confirmNewPassword:e.target.value})} 
                />
              </div>
            </div>
            <div className="actions">
              <button className="btn-primary" onClick={changePassword} disabled={loading}>
                {loading ? t('saving') : t('updatePassword')}
              </button>
              <button className="btn-danger" onClick={deleteAccount} disabled={loading}>
                {t('deleteAccount')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="settings-section">
            <div className="form-group inline">
              <label>{t('publicProfile')}</label>
              <input 
                type="checkbox" 
                checked={privacy.isPublic} 
                onChange={(e)=>setPrivacy({ isPublic: e.target.checked })} 
              />
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '8px' }}>
              {t('publicProfileDescription')}
            </p>
            <div className="actions">
              <button className="btn-primary" onClick={savePrivacy} disabled={loading}>
                {loading ? t('saving') : t('savePrivacy')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import authService from '../services/authService';
import './Settings.css';

const countryCodes = [
  { code: '+962', country: 'Jordan', flag: '🇯🇴' },
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+39', country: 'IT', flag: '🇮🇹' },
  { code: '+34', country: 'ES', flag: '🇪🇸' },
  { code: '+7', country: 'RU', flag: '🇷🇺' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+55', country: 'BR', flag: '🇧🇷' },
  { code: '+82', country: 'KR', flag: '🇰🇷' },
  { code: '+52', country: 'MX', flag: '🇲🇽' },
  { code: '+31', country: 'NL', flag: '🇳🇱' },
  { code: '+46', country: 'SE', flag: '🇸🇪' },
  { code: '+47', country: 'NO', flag: '🇳🇴' },
  { code: '+45', country: 'DK', flag: '🇩🇰' },
  { code: '+41', country: 'CH', flag: '🇨🇭' },
  { code: '+43', country: 'AT', flag: '🇦🇹' },
  { code: '+32', country: 'BE', flag: '🇧🇪' },
  { code: '+351', country: 'PT', flag: '🇵🇹' },
  { code: '+30', country: 'GR', flag: '🇬🇷' },
  { code: '+48', country: 'PL', flag: '🇵🇱' },
  { code: '+420', country: 'CZ', flag: '🇨🇿' },
  { code: '+36', country: 'HU', flag: '🇭🇺' },
  { code: '+40', country: 'RO', flag: '🇷🇴' },
  { code: '+64', country: 'NZ', flag: '🇳🇿' },
  { code: '+65', country: 'SG', flag: '🇸🇬' },
  { code: '+60', country: 'MY', flag: '🇲🇾' },
  { code: '+66', country: 'TH', flag: '🇹🇭' },
  { code: '+84', country: 'VN', flag: '🇻🇳' },
  { code: '+63', country: 'PH', flag: '🇵🇭' },
  { code: '+62', country: 'ID', flag: '🇮🇩' },
  { code: '+971', country: 'AE', flag: '🇦🇪' },
  { code: '+966', country: 'SA', flag: '🇸🇦' },
  { code: '+972', country: 'IL', flag: '🇮🇱' },
  { code: '+90', country: 'TR', flag: '🇹🇷' },
  { code: '+20', country: 'EG', flag: '🇪🇬' },
  { code: '+27', country: 'ZA', flag: '🇿🇦' },
  { code: '+234', country: 'NG', flag: '🇳🇬' },
  { code: '+254', country: 'KE', flag: '🇰🇪' },
  { code: '+54', country: 'AR', flag: '🇦🇷' },
  { code: '+56', country: 'CL', flag: '🇨🇱' },
  { code: '+57', country: 'CO', flag: '🇨🇴' },
];

const Settings = () => {
  const { t, direction } = useLanguage();
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

  const saveProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const fullPhone = phoneNumber ? `${countryCode}${phoneNumber}` : '';
      const payload = {
        fullName: profile.fullName,
        phone: fullPhone,
        github: usernames.github ? `https://github.com/${usernames.github}` : '',
        linkedin: usernames.linkedin ? `https://linkedin.com/in/${usernames.linkedin}` : '',
      };
      const res = await authService.updateProfile(payload);
      if (res?.success) showMsg(t('profileUpdated'));
    } catch (e) {
      showErr(e.message || t('updateProfileFailed'));
    } finally { setLoading(false); }
  };

  const changePassword = async () => {
    if (!passwords.newPassword || passwords.newPassword !== passwords.confirmNewPassword) {
      showErr(t('passwordsDoNotMatch'));
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
      showErr(e.message || t('changePasswordFailed'));
    } finally { setLoading(false); }
  };

  const savePrivacy = async () => {
    try {
      setLoading(true);
      const res = await authService.updateProfile({ resumeVisibility: privacy.isPublic ? 'public' : 'private' });
      if (res?.success) showMsg(t('privacySettingsSaved'));
    } catch (e) {
      showErr(e.message || t('savePrivacyFailed'));
    } finally { setLoading(false); }
  };

  const deleteAccount = async () => {
    if (!window.confirm(t('deleteAccountConfirm'))) return;
    try {
      setLoading(true);
      const res = await authService.deleteAccount();
      if (res?.success) {
        authService.clearAuth();
        window.location.href = '/';
      }
    } catch (e) {
      showErr(e.message || t('deleteAccountFailed'));
    } finally { setLoading(false); }
  };

  return (
    <div className="settings-container">
      <div className="settings-card">
        <div className="settings-header">
          <h1>{t('settings')}</h1>
          <div className="settings-tabs">
            <button className={activeTab==='account'?'active':''} onClick={()=>setActiveTab('account')}>
              {t('account')}
            </button>
            <button className={activeTab==='security'?'active':''} onClick={()=>setActiveTab('security')}>
              {t('security')}
            </button>
            <button className={activeTab==='privacy'?'active':''} onClick={()=>setActiveTab('privacy')}>
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
                  <select 
                    className="country-code-select" 
                    value={countryCode} 
                    onChange={(e)=>setCountryCode(e.target.value)}
                  >
                    {countryCodes.map(cc => (
                      <option key={cc.code} value={cc.code}>
                        {cc.flag} {cc.code} {cc.country}
                      </option>
                    ))}
                  </select>
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
                  placeholder={t('confirmNewPassword')}
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
            <p className="privacy-description">
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
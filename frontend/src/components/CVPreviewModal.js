import React from 'react';
import { X, Download, ExternalLink, User, Briefcase, GraduationCap, Code, Globe, Github, Linkedin, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import './CVPreviewModal.css';

const CVPreviewModal = ({ resume, isOpen, onClose, onDownload, onEdit }) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  if (!isOpen || !resume) return null;

  const content = resume.content || {};
  const safe = (v, d = '') => (v === undefined || v === null || v === '' ? d : String(v));

  // If this is an uploaded file, show a message instead
  if (content.uploadedFile?.url) {
    return (
      <div className="cv-preview-overlay" onClick={onClose}>
        <div className="cv-preview-modal" onClick={(e) => e.stopPropagation()}>
          <div className="cv-preview-header">
            <h2>{resume.title || t('resume') || 'Resume'}</h2>
            <button className="cv-preview-close" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <div className="cv-preview-content" style={{ textAlign: 'center', padding: '60px 40px' }}>
            <FileText size={64} style={{ color: '#9ca3af', marginBottom: '20px' }} />
            <h3 style={{ marginBottom: '12px', color: '#374151' }}>Uploaded Resume File</h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              This is an uploaded resume file. Please download it to view the contents.
            </p>
            {onDownload && (
              <button className="cv-preview-btn primary" onClick={onDownload}>
                <Download size={16} /> {t('Download') || 'Download'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  // Format experience date range
  const formatDateRange = (start, end, current) => {
    const startStr = formatDate(start);
    const endStr = current ? 'Present' : formatDate(end);
    if (!startStr && !endStr) return '';
    if (!startStr) return endStr;
    if (!endStr) return startStr;
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="cv-preview-overlay" onClick={onClose}>
      <div className="cv-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cv-preview-header">
          <h2>{resume.title || t('resume') || 'Resume'}</h2>
          <div className="cv-preview-actions">
            {onEdit && (
              <button className="cv-preview-btn" onClick={onEdit} title={t('edit') || 'Edit'}>
                <ExternalLink size={16} /> {t('edit') || 'Edit'}
              </button>
            )}
            {onDownload && (
              <button className="cv-preview-btn primary" onClick={onDownload} title={t('download') || 'Download'}>
                <Download size={16} /> {t('download') || 'Download'}
              </button>
            )}
            <button className="cv-preview-close" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="cv-preview-content">
          {/* Header Section */}
          <div className="cv-preview-section cv-preview-header-section">
            <h1 className="cv-preview-name">{safe(user?.fullName, 'Your Name')}</h1>
            {content.title && (
              <h2 className="cv-preview-title">{safe(content.title)}</h2>
            )}
            <div className="cv-preview-contact">
              {user?.email && (
                <span className="cv-preview-contact-item">
                  <Mail size={14} /> {user.email}
                </span>
              )}
              {user?.phone && (
                <span className="cv-preview-contact-item">
                  <Phone size={14} /> {user.phone}
                </span>
              )}
              {user?.location && (
                <span className="cv-preview-contact-item">
                  <MapPin size={14} /> {user.location}
                </span>
              )}
              {content.github && (
                <a href={content.github} target="_blank" rel="noopener noreferrer" className="cv-preview-contact-item">
                  <Github size={14} /> {content.github.includes('github.com/') ? content.github.split('github.com/')[1].replace(/\/$/, '') : content.github}
                </a>
              )}
              {content.linkedin && (
                <a href={content.linkedin} target="_blank" rel="noopener noreferrer" className="cv-preview-contact-item">
                  <Linkedin size={14} /> {content.linkedin.includes('linkedin.com/in/') ? content.linkedin.split('linkedin.com/in/')[1].replace(/\/$/, '') : content.linkedin}
                </a>
              )}
            </div>
          </div>

          {/* Professional Summary */}
          {(content.summary || content.professionalSummary) && (
            <div className="cv-preview-section">
              <h2 className="cv-preview-section-title">
                <User size={18} /> {t('professionalSummary') || 'Professional Summary'}
              </h2>
              <p className="cv-preview-text">{safe(content.summary || content.professionalSummary)}</p>
            </div>
          )}

          {/* Experience */}
          {content.experience && Array.isArray(content.experience) && content.experience.length > 0 && (
            <div className="cv-preview-section">
              <h2 className="cv-preview-section-title">
                <Briefcase size={18} /> {t('experience') || 'Experience'}
              </h2>
              {content.experience.map((exp, idx) => (
                <div key={idx} className="cv-preview-item">
                  <div className="cv-preview-item-header">
                    <div>
                      <h3 className="cv-preview-item-title">{safe(exp.position || exp.title)}</h3>
                      <p className="cv-preview-item-subtitle">{safe(exp.company || exp.employer)}</p>
                    </div>
                    {formatDateRange(exp.startDate || exp.start, exp.endDate || exp.end, exp.current || exp.isCurrent) && (
                      <span className="cv-preview-item-date">
                        {formatDateRange(exp.startDate || exp.start, exp.endDate || exp.end, exp.current || exp.isCurrent)}
                      </span>
                    )}
                  </div>
                  {exp.description && (
                    <ul className="cv-preview-item-description">
                      {Array.isArray(exp.description) ? (
                        exp.description.map((desc, i) => (
                          <li key={i}>{desc}</li>
                        ))
                      ) : (
                        <li>{exp.description}</li>
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {content.education && Array.isArray(content.education) && content.education.length > 0 && (
            <div className="cv-preview-section">
              <h2 className="cv-preview-section-title">
                <GraduationCap size={18} /> {t('education') || 'Education'}
              </h2>
              {content.education.map((edu, idx) => (
                <div key={idx} className="cv-preview-item">
                  <div className="cv-preview-item-header">
                    <div>
                      <h3 className="cv-preview-item-title">{safe(edu.degree || edu.qualification)}</h3>
                      {edu.fieldOfStudy && (
                        <p className="cv-preview-item-meta">{safe(edu.fieldOfStudy)}</p>
                      )}
                    </div>
                  </div>
                  <div className="cv-preview-item-header" style={{ marginTop: '4px' }}>
                    <p className="cv-preview-item-subtitle">{safe(edu.institution || edu.school)}</p>
                    {edu.graduationDate && (
                      <span className="cv-preview-item-date">{formatDate(edu.graduationDate || edu.endDate)}</span>
                    )}
                  </div>
                  {edu.gpa && edu.gpa.trim() && (
                    <p className="cv-preview-item-meta" style={{ marginTop: '4px', fontStyle: 'italic', color: '#6b7280' }}>
                      GPA: {safe(edu.gpa)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {content.skills && Array.isArray(content.skills) && content.skills.length > 0 && (
            <div className="cv-preview-section">
              <h2 className="cv-preview-section-title">
                <Code size={18} /> {t('skills') || 'Skills'}
              </h2>
              <div className="cv-preview-skills">
                {content.skills.map((skill, idx) => (
                  <span key={idx} className="cv-preview-skill-tag">
                    {typeof skill === 'string' ? skill : (skill.skillName || skill.name || skill)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {content.languages && Array.isArray(content.languages) && content.languages.length > 0 && (
            <div className="cv-preview-section">
              <h2 className="cv-preview-section-title">
                <Globe size={18} /> {t('languages') || 'Languages'}
              </h2>
              <div className="cv-preview-languages">
                {content.languages.map((lang, idx) => (
                  <div key={idx} className="cv-preview-language-item">
                    <span className="cv-preview-language-name">
                      {typeof lang === 'string' ? lang : (lang.language || lang.name || lang)}
                    </span>
                    {typeof lang === 'object' && lang.proficiency && (
                      <span className="cv-preview-language-level"> - {lang.proficiency}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CVPreviewModal;


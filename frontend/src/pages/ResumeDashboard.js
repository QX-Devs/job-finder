import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { 
  FileText, Plus, Download, Eye, Edit, Trash2, Share2,
  Clock, Star, LayoutTemplate, Sparkles
} from 'lucide-react';
import resumeService from '../services/resumeService';
import './ResumeDashboard.css';

const ResumeDashboard = () => {
  const navigate = useNavigate();
  const { t, direction } = useLanguage();
  const [resumes, setResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');

  const resumeTemplates = [
    {
      id: 'modern',
      name: t('templateModern'),
      description: t('templateModernDesc'),
      category: t('professional'),
      color: '#667eea',
      preview: '⚡'
    },
    {
      id: 'classic',
      name: t('templateClassic'),
      description: t('templateClassicDesc'),
      category: t('corporate'),
      color: '#10b981',
      preview: '💼'
    },
    {
      id: 'creative',
      name: t('templateCreative'),
      description: t('templateCreativeDesc'),
      category: t('creative'),
      color: '#f59e0b',
      preview: '🎨'
    },
    {
      id: 'minimal',
      name: t('templateMinimal'),
      description: t('templateMinimalDesc'),
      category: t('minimal'),
      color: '#6b7280',
      preview: '📄'
    },
    {
      id: 'ats',
      name: t('templateATS'),
      description: t('templateATSDesc'),
      category: t('professional'),
      color: '#ef4444',
      preview: '🤖'
    },
    {
      id: 'academic',
      name: t('templateAcademic'),
      description: t('templateAcademicDesc'),
      category: t('academic'),
      color: '#8b5cf6',
      preview: '🎓'
    }
  ];

  useEffect(() => {
    fetchUserResumes();
  }, []);

  const fetchUserResumes = async () => {
    try {
      setIsLoading(true);
      const response = await resumeService.getResumes();
      setResumes(response.data || []);
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewResume = async (templateId) => {
    try {
      const response = await resumeService.createResume({
        template: templateId,
        title: `${t('myResume')} - ${new Date().toLocaleDateString()}`,
        isPublic: false
      });
      
      navigate(`/resume/builder/${response.data.id}`);
    } catch (error) {
      console.error('Error creating resume:', error);
      alert(error.message || t('createResumeFailed'));
    }
  };

  const duplicateResume = async (resumeId) => {
    try {
      await resumeService.duplicateResume(resumeId);
      fetchUserResumes();
    } catch (error) {
      console.error('Error duplicating resume:', error);
      alert(error.message || t('duplicateResumeFailed'));
    }
  };

  const deleteResume = async (resumeId) => {
    if (!window.confirm(t('deleteResumeConfirm'))) return;

    try {
      await resumeService.deleteResume(resumeId);
      setResumes(resumes.filter(resume => resume.id !== resumeId));
    } catch (error) {
      console.error('Error deleting resume:', error);
      alert(error.message || t('deleteResumeFailed'));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(direction === 'rtl' ? 'ar' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTemplatePreview = (templateId) => {
    const template = resumeTemplates.find(t => t.id === templateId);
    return template ? template.preview : '📄';
  };

  if (isLoading) {
    return (
      <div className="resume-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t('loadingResumes')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resume-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-text">
            <h1>{t('resumeDashboard')}</h1>
            <p>{t('resumeDashboardDesc')}</p>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <FileText size={24} />
              <div className="stat-info">
                <span className="stat-number">{resumes.length}</span>
                <span className="stat-label">{t('totalResumes')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2>{t('quickActions')}</h2>
          <div className="quick-actions-grid">
            <button 
              className="quick-action-card primary"
              onClick={() => document.getElementById('template-modal').showModal()}
            >
              <Plus size={24} />
              <span>{t('createNewResume')}</span>
            </button>
            <button className="quick-action-card">
              <Sparkles size={24} />
              <span>{t('aiResumeReview')}</span>
            </button>
            <button className="quick-action-card">
              <Download size={24} />
              <span>{t('exportAll')}</span>
            </button>
            <button className="quick-action-card">
              <Share2 size={24} />
              <span>{t('shareProfile')}</span>
            </button>
          </div>
        </div>

        {/* Existing Resumes */}
        <div className="resumes-section">
          <div className="section-header">
            <h2>{t('yourResumes')}</h2>
            <span className="resume-count">{resumes.length} {t('resumesCount')}</span>
          </div>

          {resumes.length === 0 ? (
            <div className="empty-state">
              <FileText size={64} />
              <h3>{t('noResumesYet')}</h3>
              <p>{t('createFirstResume')}</p>
              <button 
                className="btn-primary"
                onClick={() => document.getElementById('template-modal').showModal()}
              >
                <Plus size={18} />
                {t('createFirstResumeBtn')}
              </button>
            </div>
          ) : (
            <div className="resumes-grid">
              {resumes.map((resume) => (
                <div key={resume.id} className="resume-card">
                  <div className="resume-card-header">
                    <div className="template-badge">
                      <span className="template-icon">
                        {getTemplatePreview(resume.template)}
                      </span>
                      <span className="template-name">
                        {resumeTemplates.find(t => t.id === resume.template)?.name || t('custom')}
                      </span>
                    </div>
                    <div className="resume-actions">
                      <button 
                        className="icon-btn"
                        onClick={() => navigate(`/resume/builder/${resume.id}`)}
                        title={t('edit')}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="icon-btn"
                        onClick={() => navigate(`/resume/preview/${resume.id}`)}
                        title={t('preview')}
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="icon-btn"
                        onClick={() => duplicateResume(resume.id)}
                        title={t('duplicate')}
                      >
                        <Share2 size={16} />
                      </button>
                      <button 
                        className="icon-btn danger"
                        onClick={() => deleteResume(resume.id)}
                        title={t('delete')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="resume-card-body">
                    <h3 className="resume-title">{resume.title}</h3>
                    <p className="resume-description">
                      {resume.lastModified ? `${t('lastModified')} ${formatDate(resume.lastModified)}` : t('newResume')}
                    </p>
                    
                    <div className="resume-meta">
                      <div className="meta-item">
                        <Clock size={14} />
                        <span>{formatDate(resume.createdAt)}</span>
                      </div>
                      {resume.isPublic && (
                        <div className="meta-item public">
                          <Eye size={14} />
                          <span>{t('public')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="resume-card-footer">
                    <button 
                      className="btn-outline"
                      onClick={() => navigate(`/resume/builder/${resume.id}`)}
                    >
                      <Edit size={16} />
                      {t('edit')}
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => navigate(`/resume/preview/${resume.id}`)}
                    >
                      <Eye size={16} />
                      {t('preview')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {resumes.length > 0 && (
          <div className="activity-section">
            <h2>{t('recentActivity')}</h2>
            <div className="activity-list">
              {resumes.slice(0, 3).map((resume) => (
                <div key={resume.id} className="activity-item">
                  <div className="activity-icon">
                    <Edit size={16} />
                  </div>
                  <div className="activity-content">
                    <p>{t('updatedResume')} <strong>{resume.title}</strong></p>
                    <span className="activity-time">
                      {resume.lastModified ? formatDate(resume.lastModified) : t('recently')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Template Selection Modal */}
      <dialog id="template-modal" className="template-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h2>{t('chooseTemplate')}</h2>
            <button 
              onClick={() => document.getElementById('template-modal').close()}
              className="close-btn"
            >
              ×
            </button>
          </div>

          <div className="templates-grid">
            {resumeTemplates.map((template) => (
              <div
                key={template.id}
                className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div 
                  className="template-preview"
                  style={{ backgroundColor: template.color }}
                >
                  <span className="template-icon-large">{template.preview}</span>
                </div>
                <div className="template-info">
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                  <div className="template-category">{template.category}</div>
                </div>
                <div className="template-selector">
                  <div className="radio-dot"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button 
              className="btn-outline"
              onClick={() => document.getElementById('template-modal').close()}
            >
              {t('cancel')}
            </button>
            <button 
              className="btn-primary"
              onClick={() => {
                createNewResume(selectedTemplate);
                document.getElementById('template-modal').close();
              }}
            >
              <LayoutTemplate size={18} />
              {t('useThisTemplate')}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default ResumeDashboard;
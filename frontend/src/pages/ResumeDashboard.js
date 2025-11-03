import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Plus, Download, Eye, Edit, Trash2, Share2,
  Clock, Star, LayoutTemplate, Sparkles
} from 'lucide-react';
import resumeService from '../services/resumeService';
import './ResumeDashboard.css';

const ResumeDashboard = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');

  const resumeTemplates = [
    {
      id: 'modern',
      name: 'Modern Professional',
      description: 'Clean, contemporary design perfect for tech roles',
      category: 'Professional',
      color: '#667eea',
      preview: '⚡'
    },
    {
      id: 'classic',
      name: 'Classic Executive',
      description: 'Traditional format preferred by corporate employers',
      category: 'Corporate',
      color: '#10b981',
      preview: '💼'
    },
    {
      id: 'creative',
      name: 'Creative Portfolio',
      description: 'Designed for designers and creative professionals',
      category: 'Creative',
      color: '#f59e0b',
      preview: '🎨'
    },
    {
      id: 'minimal',
      name: 'Minimalist',
      description: 'Simple, clean layout focusing on content',
      category: 'Minimal',
      color: '#6b7280',
      preview: '📄'
    },
    {
      id: 'ats',
      name: 'ATS Optimized',
      description: 'Designed to pass automated tracking systems',
      category: 'Professional',
      color: '#ef4444',
      preview: '🤖'
    },
    {
      id: 'academic',
      name: 'Academic',
      description: 'Ideal for research and academic positions',
      category: 'Academic',
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
        title: `My Resume - ${new Date().toLocaleDateString()}`,
        isPublic: false
      });
      
      navigate(`/resume/builder/${response.data.id}`);
    } catch (error) {
      console.error('Error creating resume:', error);
      alert(error.message || 'Failed to create resume. Please try again.');
    }
  };

  const duplicateResume = async (resumeId) => {
    try {
      await resumeService.duplicateResume(resumeId);
      fetchUserResumes();
    } catch (error) {
      console.error('Error duplicating resume:', error);
      alert(error.message || 'Failed to duplicate resume. Please try again.');
    }
  };

  const deleteResume = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;

    try {
      await resumeService.deleteResume(resumeId);
      setResumes(resumes.filter(resume => resume.id !== resumeId));
    } catch (error) {
      console.error('Error deleting resume:', error);
      alert(error.message || 'Failed to delete resume. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
          <p>Loading your resumes...</p>
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
            <h1>Resume Dashboard</h1>
            <p>Create, manage, and perfect your professional resumes</p>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <FileText size={24} />
              <div className="stat-info">
                <span className="stat-number">{resumes.length}</span>
                <span className="stat-label">Total Resumes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            <button 
              className="quick-action-card primary"
              onClick={() => document.getElementById('template-modal').showModal()}
            >
              <Plus size={24} />
              <span>Create New Resume</span>
            </button>
            <button className="quick-action-card">
              <Sparkles size={24} />
              <span>AI Resume Review</span>
            </button>
            <button className="quick-action-card">
              <Download size={24} />
              <span>Export All</span>
            </button>
            <button className="quick-action-card">
              <Share2 size={24} />
              <span>Share Profile</span>
            </button>
          </div>
        </div>

        {/* Existing Resumes */}
        <div className="resumes-section">
          <div className="section-header">
            <h2>Your Resumes</h2>
            <span className="resume-count">{resumes.length} resumes</span>
          </div>

          {resumes.length === 0 ? (
            <div className="empty-state">
              <FileText size={64} />
              <h3>No Resumes Yet</h3>
              <p>Create your first resume to get started on your job search journey</p>
              <button 
                className="btn-primary"
                onClick={() => document.getElementById('template-modal').showModal()}
              >
                <Plus size={18} />
                Create Your First Resume
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
                        {resumeTemplates.find(t => t.id === resume.template)?.name || 'Custom'}
                      </span>
                    </div>
                    <div className="resume-actions">
                      <button 
                        className="icon-btn"
                        onClick={() => navigate(`/resume/builder/${resume.id}`)}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="icon-btn"
                        onClick={() => navigate(`/resume/preview/${resume.id}`)}
                        title="Preview"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="icon-btn"
                        onClick={() => duplicateResume(resume.id)}
                        title="Duplicate"
                      >
                        <Share2 size={16} />
                      </button>
                      <button 
                        className="icon-btn danger"
                        onClick={() => deleteResume(resume.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="resume-card-body">
                    <h3 className="resume-title">{resume.title}</h3>
                    <p className="resume-description">
                      {resume.lastModified ? `Last modified ${formatDate(resume.lastModified)}` : 'New resume'}
                    </p>
                    
                    <div className="resume-meta">
                      <div className="meta-item">
                        <Clock size={14} />
                        <span>{formatDate(resume.createdAt)}</span>
                      </div>
                      {resume.isPublic && (
                        <div className="meta-item public">
                          <Eye size={14} />
                          <span>Public</span>
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
                      Edit
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => navigate(`/resume/preview/${resume.id}`)}
                    >
                      <Eye size={16} />
                      Preview
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
            <h2>Recent Activity</h2>
            <div className="activity-list">
              {resumes.slice(0, 3).map((resume) => (
                <div key={resume.id} className="activity-item">
                  <div className="activity-icon">
                    <Edit size={16} />
                  </div>
                  <div className="activity-content">
                    <p>You updated <strong>{resume.title}</strong></p>
                    <span className="activity-time">
                      {resume.lastModified ? formatDate(resume.lastModified) : 'Recently'}
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
            <h2>Choose a Resume Template</h2>
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
              Cancel
            </button>
            <button 
              className="btn-primary"
              onClick={() => {
                createNewResume(selectedTemplate);
                document.getElementById('template-modal').close();
              }}
            >
              <LayoutTemplate size={18} />
              Use This Template
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default ResumeDashboard;

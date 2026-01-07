// backend/services/aiApplyService.js
const fs = require('fs');
const path = require('path');
const { Resume } = require('../models');

// Store running AI apply jobs
const runningAIJobs = new Map();

// Extract text from various resume data formats
function extractResumeData(resume) {
  const data = {
    fullName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    title: '',
    skills: [],
    experience: [],
    education: [],
    languages: [],
    certifications: [],
    workAuthorization: 'Yes',
    requiresSponsorship: 'No',
    willingToRelocate: 'Yes'
  };

  // Check for content in resume object
  const content = resume.content || resume;

  if (!content) return data;

  // Handle the nested personalInfo structure (from CV generator)
  const personalInfo = content.personalInfo || content;

  // Basic info - check both personalInfo and direct content
  data.fullName = personalInfo.fullName || personalInfo.name || content.fullName || content.name || 
    `${personalInfo.firstName || content.firstName || ''} ${personalInfo.lastName || content.lastName || ''}`.trim();
  data.firstName = personalInfo.firstName || content.firstName || data.fullName.split(' ')[0] || '';
  data.lastName = personalInfo.lastName || content.lastName || data.fullName.split(' ').slice(1).join(' ') || '';
  data.email = personalInfo.email || content.email || '';
  data.phone = personalInfo.phone || personalInfo.phoneNumber || content.phone || content.phoneNumber || '';
  data.location = personalInfo.location || personalInfo.address || personalInfo.city || 
    content.location || content.address || '';
  data.title = personalInfo.title || personalInfo.jobTitle || personalInfo.profession || 
    content.title || '';
  
  // Summary - can be at content level or in personalInfo
  data.summary = content.summary || personalInfo.summary || content.objective || 
    personalInfo.objective || content.about || '';

  // Skills - handle various formats
  const skillsSource = content.skills || [];
  if (Array.isArray(skillsSource)) {
    data.skills = skillsSource.map(s => {
      if (typeof s === 'string') return s;
      return s.name || s.skill || s.title || '';
    }).filter(Boolean);
  }

  // Experience
  const expSource = content.experience || content.workExperience || [];
  if (Array.isArray(expSource)) {
    data.experience = expSource.map(e => ({
      title: e.title || e.position || e.jobTitle || e.role || '',
      company: e.company || e.employer || e.organization || '',
      location: e.location || e.city || '',
      startDate: e.startDate || e.from || e.start || '',
      endDate: e.endDate || e.to || e.end || (e.current ? 'Present' : ''),
      description: Array.isArray(e.description) ? e.description.join('. ') : 
        (Array.isArray(e.responsibilities) ? e.responsibilities.join('. ') : (e.description || '')),
      current: e.current || e.isCurrent || e.present || false
    }));
  }

  // Education
  const eduSource = content.education || [];
  if (Array.isArray(eduSource)) {
    data.education = eduSource.map(e => ({
      degree: e.degree || e.qualification || e.title || '',
      school: e.school || e.institution || e.university || e.college || '',
      field: e.field || e.major || e.fieldOfStudy || e.specialization || '',
      graduationDate: e.graduationDate || e.endDate || e.year || e.end || '',
      gpa: e.gpa || e.grade || ''
    }));
  }

  // Languages
  const langSource = content.languages || [];
  if (Array.isArray(langSource)) {
    data.languages = langSource.map(l => {
      if (typeof l === 'string') return { name: l, level: 'professional' };
      return {
        name: l.name || l.language || l.title || '',
        level: l.level || l.proficiency || l.fluency || 'professional'
      };
    }).filter(l => l.name);
  }

  // Certifications
  const certSource = content.certifications || content.certificates || [];
  if (Array.isArray(certSource)) {
    data.certifications = certSource.map(c => {
      if (typeof c === 'string') return c;
      return c.name || c.title || c.certification || '';
    }).filter(Boolean);
  }

  // Log extracted data for debugging
  console.log('[AI Apply] Extracted resume data:', JSON.stringify({
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    skillsCount: data.skills.length,
    experienceCount: data.experience.length,
    educationCount: data.education.length,
    languagesCount: data.languages.length
  }));

  return data;
}

/**
 * Start AI-powered job application using the new agent
 */
async function startAIApply({ userId, resumeId, jobUrl, jobTitle, company }) {
  const jobId = `ai-apply-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const job = {
    id: jobId,
    userId,
    resumeId,
    jobUrl,
    jobTitle,
    company,
    status: 'running',
    startedAt: new Date().toISOString(),
    progress: 'initializing',
    error: null
  };

  runningAIJobs.set(jobId, job);

  // Start the application process asynchronously
  setImmediate(async () => {
    try {
      // Get resume data
      const resume = await Resume.findOne({ where: { id: resumeId, userId } });
      if (!resume) {
        throw new Error('Resume not found');
      }

      const resumeData = extractResumeData(resume);
      job.progress = 'resume_loaded';
      console.log(`[AI Apply] Resume loaded for: ${resumeData.fullName || 'Unknown'}`);

      // Import the new agent module (ES Module via dynamic import)
      const agentPath = path.join(__dirname, '..', 'scripts', 'agentAI.mjs');

      // Check if agent file exists
      if (!fs.existsSync(agentPath)) {
        throw new Error('Agent script not found at: ' + agentPath);
      }

      console.log(`[AI Apply] Loading agent from: ${agentPath}`);
      const agentModule = await import(`file://${agentPath.replace(/\\/g, '/')}`);

      job.progress = 'agent_loaded';
      console.log(`[AI Apply] Starting application for: ${jobTitle} at ${company}`);
      console.log(`[AI Apply] Job URL: ${jobUrl}`);

      job.progress = 'applying';

      // Progress callback to update job status in real-time
      const onProgress = (step) => {
        job.progress = step;
        console.log(`[AI Apply] Progress update: ${step}`);
      };

      // Call the applyToJob function from the new agent with progress callback
      const result = await agentModule.applyToJob(jobUrl, resumeData, onProgress);

      if (result.success) {
        job.status = 'completed';
        job.progress = 'submitted';
        console.log(`[AI Apply] ✅ Successfully applied to: ${jobTitle}`);
      } else {
        job.status = 'failed';
        job.error = result.error || result.reason || 'Application failed';
        console.log(`[AI Apply] ❌ Failed to apply: ${job.error}`);
      }

      job.finishedAt = new Date().toISOString();

    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.finishedAt = new Date().toISOString();
      console.error('[AI Apply] Error:', error.message);

    } finally {
      // Clean up job after some time
      setTimeout(() => {
        runningAIJobs.delete(jobId);
      }, 5 * 60 * 1000); // Keep for 5 minutes
    }
  });

  return job;
}

/**
 * Get status of an AI apply job
 */
function getAIApplyStatus(jobId) {
  return runningAIJobs.get(jobId) || null;
}

/**
 * Get all AI apply jobs for a user
 */
function getUserAIApplyJobs(userId) {
  const jobs = [];
  for (const job of runningAIJobs.values()) {
    if (job.userId === userId) {
      jobs.push(job);
    }
  }
  return jobs;
}

module.exports = {
  startAIApply,
  getAIApplyStatus,
  getUserAIApplyJobs,
  extractResumeData
};

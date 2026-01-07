// backend/controllers/aiApplyController.js
const { startAIApply, getAIApplyStatus, getUserAIApplyJobs } = require('../services/aiApplyService');

/**
 * Start AI-powered job application
 * POST /api/ai-apply/start
 */
exports.startAIApplication = async (req, res) => {
  try {
    const { resumeId, jobUrl, jobTitle, company } = req.body;
    const userId = req.user.id;

    // Validation
    if (!resumeId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Resume ID is required' 
      });
    }

    if (!jobUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'Job URL is required' 
      });
    }

    // Validate that it's a LinkedIn Easy Apply URL
    if (!jobUrl.includes('linkedin.com')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Only LinkedIn jobs are supported for AI Apply' 
      });
    }

    // Start the AI application process
    const job = await startAIApply({
      userId,
      resumeId,
      jobUrl,
      jobTitle: jobTitle || 'Unknown Position',
      company: company || 'Unknown Company'
    });

    return res.status(202).json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        message: 'AI application process started'
      }
    });

  } catch (error) {
    console.error('Error starting AI application:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start AI application',
      message: error.message
    });
  }
};

/**
 * Get status of an AI application job
 * GET /api/ai-apply/status/:jobId
 */
exports.getApplicationStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    const job = getAIApplyStatus(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Application job not found or expired'
      });
    }

    // Verify ownership
    if (job.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    return res.json({
      success: true,
      data: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        error: job.error,
        jobTitle: job.jobTitle,
        company: job.company,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt
      }
    });

  } catch (error) {
    console.error('Error getting AI application status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get application status'
    });
  }
};

/**
 * Get all AI application jobs for the current user
 * GET /api/ai-apply/jobs
 */
exports.getUserApplicationJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobs = getUserAIApplyJobs(userId);

    return res.json({
      success: true,
      data: jobs.map(job => ({
        id: job.id,
        status: job.status,
        progress: job.progress,
        error: job.error,
        jobTitle: job.jobTitle,
        company: job.company,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt
      }))
    });

  } catch (error) {
    console.error('Error getting user AI application jobs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get application jobs'
    });
  }
};

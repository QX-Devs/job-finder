const { User, Education, Experience, Skill, Language, Course, Job, GraduationProject } = require('../models');
const { rankCandidates, calculateCandidateScore } = require('../utils/candidateScoring');

/**
 * Get ranked candidates for a job
 * @route GET /api/candidates/rank/:jobId
 * @access Private (Admin/Employer)
 */
exports.getRankedCandidates = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Get job details
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    
    // Get all users with public resumes or who applied to this job
    const candidates = await User.findAll({
      where: {
        isActive: true,
        isVerified: true
      },
      include: [
        { model: Education, as: 'education' },
        { model: Experience, as: 'experience' },
        { model: Skill, as: 'skills' },
        { model: Language, as: 'languages' },
        { model: Course, as: 'courses' },
        { model: GraduationProject, as: 'graduationProject' }
      ],
      attributes: { exclude: ['password'] }
    });
    
    // Transform candidates for scoring
    const candidatesForScoring = candidates.map(user => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      isGraduate: user.isGraduate || false,
      experience: user.experience || [],
      skills: user.skills || [],
      education: user.education || [],
      courses: user.courses || [],
      languages: user.languages || [],
      graduationProject: user.graduationProject || null,
      projectSkills: user.graduationProject?.projectSkills || [],
      professionalSummary: user.professionalSummary,
      github: user.github,
      linkedin: user.linkedin
    }));
    
    // Rank candidates
    const rankedCandidates = rankCandidates(candidatesForScoring, {
      requiredSkills: job.skills || [],
      category: job.category
    });
    
    return res.json({
      success: true,
      data: rankedCandidates,
      job: {
        id: job.id,
        title: job.title,
        company: job.company
      }
    });
  } catch (err) {
    console.error('Get ranked candidates error:', err);
    return res.status(500).json({ success: false, error: 'Failed to rank candidates' });
  }
};

/**
 * Calculate score for a single candidate
 * @route POST /api/candidates/score
 * @access Private
 */
exports.calculateScore = async (req, res) => {
  try {
    const { candidateId, jobId } = req.body;
    
    if (!candidateId) {
      return res.status(400).json({ success: false, error: 'Candidate ID is required' });
    }
    
    // Get candidate
    const candidate = await User.findByPk(candidateId, {
      include: [
        { model: Education, as: 'education' },
        { model: Experience, as: 'experience' },
        { model: Skill, as: 'skills' },
        { model: Language, as: 'languages' },
        { model: Course, as: 'courses' },
        { model: GraduationProject, as: 'graduationProject' }
      ],
      attributes: { exclude: ['password'] }
    });
    
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }
    
    // Get job if provided
    let job = null;
    if (jobId) {
      job = await Job.findByPk(jobId);
    }
    
    // Transform candidate for scoring
    const candidateForScoring = {
      id: candidate.id,
      isGraduate: candidate.isGraduate || false,
      experience: candidate.experience || [],
      skills: candidate.skills || [],
      education: candidate.education || [],
      courses: candidate.courses || [],
      languages: candidate.languages || [],
      graduationProject: candidate.graduationProject || null,
      projectSkills: candidate.graduationProject?.projectSkills || [],
      professionalSummary: candidate.professionalSummary,
      github: candidate.github,
      linkedin: candidate.linkedin
    };
    
    // Calculate score
    const scoreData = calculateCandidateScore(candidateForScoring, job || {});
    
    return res.json({
      success: true,
      data: {
        candidateId: candidate.id,
        score: scoreData.finalScore,
        breakdown: scoreData.breakdown,
        weights: scoreData.weights
      }
    });
  } catch (err) {
    console.error('Calculate score error:', err);
    return res.status(500).json({ success: false, error: 'Failed to calculate score' });
  }
};

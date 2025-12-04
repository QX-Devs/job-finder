const { GraduationProject } = require('../models');
const { sanitizeText } = require('../utils/textSanitizer');

// @desc    Create or update graduation project
// @route   POST /api/graduation-project
// @access  Private
exports.createOrUpdateProject = async (req, res) => {
  try {
    const { title, description, technologies, role, duration, githubUrl, supervisor, projectSkills } = req.body;

    if (!title || !description || !role) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title, description, and role are required' 
      });
    }

    if (description.length < 200) {
      return res.status(400).json({ 
        success: false, 
        error: 'Description must be at least 200 characters' 
      });
    }

    if (!technologies || technologies.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'At least one technology is required' 
      });
    }

    if (!projectSkills || projectSkills.length < 5) {
      return res.status(400).json({ 
        success: false, 
        error: 'At least 5 project skills are required' 
      });
    }

    // Check if project already exists for this user
    const existingProject = await GraduationProject.findOne({
      where: { userId: req.user.id }
    });

    let project;
    if (existingProject) {
      // Update existing project
      existingProject.title = sanitizeText(title);
      existingProject.description = sanitizeText(description);
      existingProject.technologies = technologies.map(t => sanitizeText(t));
      existingProject.role = sanitizeText(role);
      existingProject.duration = sanitizeText(duration || '');
      existingProject.githubUrl = (githubUrl && githubUrl.trim()) || null;
      existingProject.supervisor = sanitizeText(supervisor || '');
      existingProject.projectSkills = projectSkills.map(s => sanitizeText(s));
      await existingProject.save();
      project = existingProject;
    } else {
      // Create new project
      project = await GraduationProject.create({
        userId: req.user.id,
        title: sanitizeText(title),
        description: sanitizeText(description),
        technologies: technologies.map(t => sanitizeText(t)),
        role: sanitizeText(role),
        duration: sanitizeText(duration || ''),
        githubUrl: (githubUrl && githubUrl.trim()) || null,
        supervisor: sanitizeText(supervisor || ''),
        projectSkills: projectSkills.map(s => sanitizeText(s))
      });
    }

    return res.json({ success: true, data: project });
  } catch (err) {
    console.error('Create/update graduation project error:', err);
    return res.status(500).json({ success: false, error: 'Failed to save graduation project' });
  }
};

// @desc    Get graduation project for current user
// @route   GET /api/graduation-project
// @access  Private
exports.getProject = async (req, res) => {
  try {
    const project = await GraduationProject.findOne({
      where: { userId: req.user.id }
    });

    if (!project) {
      return res.json({ success: true, data: null });
    }

    return res.json({ success: true, data: project });
  } catch (err) {
    console.error('Get graduation project error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch graduation project' });
  }
};

// @desc    Delete graduation project
// @route   DELETE /api/graduation-project
// @access  Private
exports.deleteProject = async (req, res) => {
  try {
    const project = await GraduationProject.findOne({
      where: { userId: req.user.id }
    });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Graduation project not found' });
    }

    await project.destroy();
    return res.json({ success: true, message: 'Graduation project deleted successfully' });
  } catch (err) {
    console.error('Delete graduation project error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete graduation project' });
  }
};


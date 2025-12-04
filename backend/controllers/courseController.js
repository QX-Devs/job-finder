const { Course } = require('../models');

/**
 * Get all courses for a user
 * @route GET /api/courses
 * @access Private
 */
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.findAll({
      where: { userId: req.user.id },
      order: [['completionDate', 'DESC']]
    });
    return res.json({ success: true, data: courses });
  } catch (err) {
    console.error('Get courses error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch courses' });
  }
};

/**
 * Create a new course
 * @route POST /api/courses
 * @access Private
 */
exports.createCourse = async (req, res) => {
  try {
    const { courseName, provider, completionDate, category, certificateUrl } = req.body;
    
    if (!courseName) {
      return res.status(400).json({ success: false, error: 'Course name is required' });
    }
    
    const course = await Course.create({
      userId: req.user.id,
      courseName,
      provider: provider || null,
      completionDate: completionDate || null,
      category: category || null,
      certificateUrl: certificateUrl || null
    });
    
    return res.status(201).json({ success: true, data: course });
  } catch (err) {
    console.error('Create course error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create course' });
  }
};

/**
 * Update a course
 * @route PUT /api/courses/:id
 * @access Private
 */
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { courseName, provider, completionDate, category, certificateUrl } = req.body;
    
    const course = await Course.findOne({
      where: { id, userId: req.user.id }
    });
    
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    
    if (courseName !== undefined) course.courseName = courseName;
    if (provider !== undefined) course.provider = provider;
    if (completionDate !== undefined) course.completionDate = completionDate;
    if (category !== undefined) course.category = category;
    if (certificateUrl !== undefined) course.certificateUrl = certificateUrl;
    
    await course.save();
    
    return res.json({ success: true, data: course });
  } catch (err) {
    console.error('Update course error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update course' });
  }
};

/**
 * Delete a course
 * @route DELETE /api/courses/:id
 * @access Private
 */
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findOne({
      where: { id, userId: req.user.id }
    });
    
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    
    await course.destroy();
    
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete course error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete course' });
  }
};


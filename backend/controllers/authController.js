const jwt = require('jsonwebtoken');
const { User, Education, Experience, Skill, Language } = require('../models');
const bcrypt = require('bcryptjs');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'fullName, email and password are required' });
    }

    // Check if user exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user with minimal required fields
    const user = await User.create({ fullName, email, password });

    // Generate token
    const token = generateToken(user.id);
    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        token
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User Not Found' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(405).json({ message: 'Invalid Password'});
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        token
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me or GET /api/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Education, as: 'education' },
        { model: Experience, as: 'experience' },
        { model: Skill, as: 'skills' },
        { model: Language, as: 'languages' }
      ]
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/me
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const {
      fullName, phone, countryCode, github, linkedin, 
      professionalSummary, resumeVisibility,
      education, experience, skills, languages
    } = req.body;

    // Update user basic info
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone || null;
    if (countryCode !== undefined) updateData.countryCode = countryCode || null;
    // Handle github and linkedin - convert empty strings to null
    if (github !== undefined) {
      const githubValue = github && github.trim() !== '' ? github.trim() : null;
      // Only validate URL if value is provided
      if (githubValue && !githubValue.match(/^https?:\/\/.+/)) {
        return res.status(400).json({ 
          success: false, 
          message: 'GitHub must be a valid URL (starting with http:// or https://)' 
        });
      }
      updateData.github = githubValue;
    }
    if (linkedin !== undefined) {
      const linkedinValue = linkedin && linkedin.trim() !== '' ? linkedin.trim() : null;
      // Only validate URL if value is provided
      if (linkedinValue && !linkedinValue.match(/^https?:\/\/.+/)) {
        return res.status(400).json({ 
          success: false, 
          message: 'LinkedIn must be a valid URL (starting with http:// or https://)' 
        });
      }
      updateData.linkedin = linkedinValue;
    }
    if (professionalSummary !== undefined) updateData.professionalSummary = professionalSummary || null;
    if (resumeVisibility !== undefined) updateData.resumeVisibility = resumeVisibility;

    // Only update if there's data to update
    if (Object.keys(updateData).length > 0) {
      await User.update(updateData, {
        where: { id: req.user.id }
      });
    }

    // Update education if provided
    if (education && Array.isArray(education)) {
      // Delete existing education
      await Education.destroy({ where: { userId: req.user.id } });
      
      // Create new education records
      if (education.length > 0) {
        await Education.bulkCreate(
          education.map(edu => {
            const { id, ...eduData } = edu; // Remove id if present
            return { ...eduData, userId: req.user.id };
          })
        );
      }
    }

    // Update experience if provided
    if (experience && Array.isArray(experience)) {
      // Delete existing experience
      await Experience.destroy({ where: { userId: req.user.id } });
      
      // Create new experience records
      if (experience.length > 0) {
        await Experience.bulkCreate(
          experience.map(exp => {
            const { id, ...expData } = exp; // Remove id if present
            return { ...expData, userId: req.user.id };
          })
        );
      }
    }

    // Update skills if provided
    if (skills && Array.isArray(skills)) {
      // Delete existing skills
      await Skill.destroy({ where: { userId: req.user.id } });
      
      // Create new skill records
      if (skills.length > 0) {
        await Skill.bulkCreate(
          skills.map(skill => {
            const { id, ...skillData } = skill; // Remove id if present
            return {
              skillName: typeof skill === 'string' ? skill : skill.skillName,
              proficiencyLevel: typeof skill === 'string' ? 'Intermediate' : (skill.proficiencyLevel || 'Intermediate'),
              userId: req.user.id
            };
          })
        );
      }
    }

    // Update languages if provided
    if (languages && Array.isArray(languages)) {
      // Delete existing languages
      await Language.destroy({ where: { userId: req.user.id } });
      
      // Create new language records
      if (languages.length > 0) {
        await Language.bulkCreate(
          languages.map(lang => {
            const { id, ...langData } = lang; // Remove id if present
            return { ...langData, userId: req.user.id };
          })
        );
      }
    }

    // Fetch updated user with all relations
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Education, as: 'education' },
        { model: Experience, as: 'experience' },
        { model: Skill, as: 'skills' },
        { model: Language, as: 'languages' }
      ]
    });

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Change password
// @route   POST /api/me/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' });
    }
    const user = await User.findByPk(req.user.id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Delete account
// @route   DELETE /api/me
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    // Cascade delete: remove related records, then user
    await Education.destroy({ where: { userId: req.user.id } });
    await Experience.destroy({ where: { userId: req.user.id } });
    await Skill.destroy({ where: { userId: req.user.id } });
    await Language.destroy({ where: { userId: req.user.id } });
    await User.destroy({ where: { id: req.user.id } });
    return res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword, deleteAccount };
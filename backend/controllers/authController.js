const jwt = require('jsonwebtoken');
const { User, Education, Experience, Skill, Language } = require('../models');

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
    const {//email=ahmad@gmail.com exists
      fullName, email, password, phone, countryCode,
      github, linkedin, professionalSummary,
      education, experience, skills, languages,
      resumeVisibility
    } = req.body;

    // Check if user exists
    const userExists = await User.email.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      password,
      phone,
      countryCode,
      github,
      linkedin,
      professionalSummary,
      resumeVisibility
    });

    // Create education records
    if (education && education.length > 0) {
      await Education.bulkCreate(
        education.map(edu => ({ ...edu, userId: user.id }))
      );
    }

    // Create experience records
    if (experience && experience.length > 0) {
      await Experience.bulkCreate(
        experience.map(exp => ({ ...exp, userId: user.id }))
      );
    }

    // Create skills records (handle both string and object formats)
    if (skills && skills.length > 0) {
      await Skill.bulkCreate(
        skills.map(skill => ({ 
          skillName: typeof skill === 'string' ? skill : skill.skillName,
          proficiencyLevel: typeof skill === 'string' ? 'Intermediate' : (skill.proficiencyLevel || 'Intermediate'),
          userId: user.id 
        }))
      );
    }

    // Create language records
    if (languages && languages.length > 0) {
      await Language.bulkCreate(
        languages.map(lang => {
          const { id, ...langData } = lang;
          return { ...langData, userId: user.id };
        })
      );
    }

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
    if (phone !== undefined) updateData.phone = phone;
    if (countryCode !== undefined) updateData.countryCode = countryCode;
    if (github !== undefined) updateData.github = github;
    if (linkedin !== undefined) updateData.linkedin = linkedin;
    if (professionalSummary !== undefined) updateData.professionalSummary = professionalSummary;
    if (resumeVisibility !== undefined) updateData.resumeVisibility = resumeVisibility;

    await User.update(updateData, {
      where: { id: req.user.id }
    });

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

module.exports = { register, login, getMe, updateProfile };
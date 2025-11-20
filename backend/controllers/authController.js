const jwt = require('jsonwebtoken');
const { User, Education, Experience, Skill, Language } = require('../models');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/email');

const TOKEN_EXPIRATION_MS = 60 * 60 * 1000;

const generateAuthToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

const generateVerificationToken = (id) =>
  jwt.sign({ id }, process.env.JWT_VERIFY_SECRET, { expiresIn: '1h' });

const generateResetToken = (id) =>
  jwt.sign({ id }, process.env.JWT_RESET_SECRET, { expiresIn: '1h' });

const getApiBaseUrl = () =>
  process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}/api`;

const getFrontendBaseUrl = () =>
  process.env.FRONTEND_URL || 'http://localhost:3000';

const formatSupportEmail = (htmlBody) =>
  htmlBody.replace(/<[^>]*>/g, '');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'fullName, email and password are required' });
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ fullName, email, password });

    const verificationToken = generateVerificationToken(user.id);
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + TOKEN_EXPIRATION_MS);
    await user.save();

    const verifyUrl = `${getApiBaseUrl()}/auth/verify/${verificationToken}`;
    const htmlBody = `
  <div style="
    font-family: Arial, sans-serif;
    max-width: 480px;
    margin: auto;
    background: #ffffff;
    padding: 24px;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    color: #333;
  ">
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="margin: 0; font-size: 24px; color: #111827; font-weight: 700;">
        GradJob – Verify Your Email
      </h2>
    </div>

    <p style="font-size: 15px;">
      Hi <strong>${user.fullName || 'there'}</strong>,
    </p>

    <p style="font-size: 15px; line-height: 1.6;">
      Thank you for signing up with <strong>GradJob</strong>!
      To activate your account, please verify your email address.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${verifyUrl}" style="
        background: linear-gradient(135deg, #4caf50, #2e7d32);
        color: white;
        padding: 14px 24px;
        text-decoration: none;
        border-radius: 8px;
        font-size: 16px;
        display: inline-block;
        font-weight: bold;
      ">
        Verify Email
      </a>
    </div>

    <p style="font-size: 14px; color: #555;">
      If the button above does not work, copy and paste the link below:
    </p>

    <div style="
      background: #f3f4f6;
      padding: 12px;
      border-radius: 6px;
      font-size: 13px;
      word-break: break-all;
      color: #111;
    ">
      ${verifyUrl}
    </div>

    <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
      This link will expire in <strong>1 hour</strong> for security reasons.
    </p>

    <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />

    <p style="text-align: center; font-size: 12px; color: #9ca3af;">
      © ${new Date().getFullYear()} GradJob. All rights reserved.
    </p>
  </div>
`;



    await sendEmail({
      to: user.email,
      subject: 'Verify your GradJob account',
      html: htmlBody,
      text: formatSupportEmail(htmlBody),
    });

    const authToken = generateAuthToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email to continue.',
      data: {
        id: user.id,
        email: user.email,
        requiresVerification: !user.isVerified,
        isVerified: user.isVerified,
        token: authToken,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
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

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User Not Found' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(405).json({ message: 'Invalid Password'});
    }

    const token = generateAuthToken(user.id);

    res.json({
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        token,
        isVerified: user.isVerified,
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

// @desc    Verify email
// @route   GET /api/auth/verify/:token
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_VERIFY_SECRET);
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.json({ success: true, message: 'Email already verified' });
    }

    if (
      !user.verificationToken ||
      user.verificationToken !== token ||
      !user.verificationTokenExpires ||
      new Date(user.verificationTokenExpires).getTime() < Date.now()
    ) {
      return res.status(400).json({ success: false, message: 'Verification token is invalid or has expired' });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    return res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    console.log(`📧 Forgot password request for email: ${email}`);

    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log(`❌ User not found for email: ${email}`);
      // Security: Always return success message to prevent email enumeration
      return res.json({ 
        success: true, 
        message: 'If your email exists in our system, you will receive password reset instructions in your inbox.' 
      });
    }

    console.log(`✅ User found: ${user.email}, isVerified: ${user.isVerified}`);

    // Security: Always return success message to prevent email enumeration
    // Send email if user exists (regardless of verification status)
    try {
      const resetToken = generateResetToken(user.id);
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + TOKEN_EXPIRATION_MS);
      await user.save();

      console.log(`🔑 Reset token generated for user: ${user.email}`);

      const resetUrl = `${getFrontendBaseUrl().replace(/\/$/, '')}/reset-password/${resetToken}`;
      const htmlBody = `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 480px;
          margin: auto;
          background: #ffffff;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          color: #333;
        ">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 24px; color: #111827; font-weight: 700;">
              GradJob – Reset Your Password
            </h2>
          </div>

          <p style="font-size: 15px;">
            Hi <strong>${user.fullName || 'there'}</strong>,
          </p>

          <p style="font-size: 15px; line-height: 1.6;">
            We received a request to reset your password. Click the button below within the next hour to set a new password.
          </p>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" style="
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
              padding: 14px 24px;
              text-decoration: none;
              border-radius: 8px;
              font-size: 16px;
              display: inline-block;
              font-weight: bold;
            ">
              Reset Password
            </a>
          </div>

          <p style="font-size: 14px; color: #555;">
            If the button above does not work, copy and paste the link below:
          </p>

          <div style="
            background: #f3f4f6;
            padding: 12px;
            border-radius: 6px;
            font-size: 13px;
            word-break: break-all;
            color: #111;
          ">
            ${resetUrl}
          </div>

          <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
            If you did not request this change, you can safely ignore this email. Your password will remain unchanged.
          </p>

          <p style="font-size: 13px; color: #6b7280; margin-top: 16px;">
            This link will expire in <strong>1 hour</strong> for security reasons.
          </p>

          <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />

          <p style="text-align: center; font-size: 12px; color: #9ca3af;">
            © ${new Date().getFullYear()} GradJob. All rights reserved.
          </p>
        </div>
      `;

      console.log(`📤 Attempting to send password reset email to: ${user.email}`);
      console.log(`📧 Email service configured: ${process.env.EMAIL_USER ? 'YES' : 'NO'}`);
      
      await sendEmail({
        to: user.email,
        subject: 'Reset your GradJob password',
        html: htmlBody,
        text: formatSupportEmail(htmlBody),
      });

      console.log(`✅ Password reset email sent successfully to: ${user.email}`);
    } catch (emailError) {
      console.error('❌ Error sending password reset email:', emailError);
      console.error('Email error details:', {
        message: emailError.message,
        code: emailError.code,
        response: emailError.response,
        stack: emailError.stack
      });
      // Continue to return success message for security
    }

    // Always return success message (security best practice to prevent email enumeration)
    return res.json({ 
      success: true, 
      message: 'If your email exists in our system, you will receive password reset instructions in your inbox.' 
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    // Even on error, return generic success message for security
    return res.json({ 
      success: true, 
      message: 'If your email exists in our system, you will receive password reset instructions in your inbox.' 
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Reset token is required' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'New password is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (
      !user.resetPasswordToken ||
      user.resetPasswordToken !== token ||
      !user.resetPasswordExpires ||
      new Date(user.resetPasswordExpires).getTime() < Date.now()
    ) {
      return res.status(400).json({ success: false, message: 'Reset token is invalid or has expired' });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.json({ success: true, message: 'Email already verified' });
    }

    const verificationToken = generateVerificationToken(user.id);
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + TOKEN_EXPIRATION_MS);
    await user.save();

    const verifyUrl = `${getApiBaseUrl()}/auth/verify/${verificationToken}`;
    const htmlBody = `
      <p>Hi ${user.fullName || 'there'},</p>
      <p>You requested a new verification email. Please verify your email by clicking the button below within the next hour.</p>
      <p><a href="${verifyUrl}" style="padding: 12px 20px; background-color: #2e7d32; color: #ffffff; text-decoration: none; border-radius: 4px;">Verify Email</a></p>
      <p>If the button does not work, copy and paste this link into your browser:<br/>${verifyUrl}</p>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Verify your GradJob account',
      html: htmlBody,
      text: formatSupportEmail(htmlBody),
    });

    return res.json({ success: true, message: 'Verification email sent successfully.' });
  } catch (error) {
    console.error('Resend verification email error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
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

module.exports = { register, login, verifyEmail, forgotPassword, resetPassword, resendVerificationEmail, getMe, updateProfile, changePassword, deleteAccount };

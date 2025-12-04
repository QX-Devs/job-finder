const jwt = require('jsonwebtoken');
const { User, Education, Experience, Skill, Language, Course, GraduationProject } = require('../models');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/email');
const { sanitizeText, sanitizeTextArray } = require('../utils/textSanitizer');
const { getLocationFromIP, getClientIP } = require('../utils/geolocation');

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

const getFrontendBaseUrl = () => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // Log the frontend URL being used for email links (for debugging)
  if (process.env.NODE_ENV === 'development') {
    console.log('🌐 Frontend URL for email links:', frontendUrl);
  }
  
  return frontendUrl;
};

const formatSupportEmail = (htmlBody) =>
  htmlBody.replace(/<[^>]*>/g, '');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'fullName, email and password are required' 
      });
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

    // Auto-detect location from IP address (non-blocking)
    let detectedLocation = null;
    try {
      const clientIP = getClientIP(req);
      detectedLocation = await getLocationFromIP(clientIP);
    } catch (geoError) {
      console.warn('⚠️ Could not detect location from IP:', geoError.message);
      // Continue without location - user can set it manually later
    }

    const user = await User.create({ 
      fullName, 
      email, 
      password,
      location: detectedLocation || null // Set location if detected, otherwise null
    });

    const verificationToken = generateVerificationToken(user.id);
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + TOKEN_EXPIRATION_MS);
    await user.save();

    const frontendBaseUrl = getFrontendBaseUrl();
    const verifyUrl = `${frontendBaseUrl.replace(/\/$/, '')}/verify/${verificationToken}`;
    
    // Log verification URL for debugging
    console.log('📧 Generated verification URL (registration):', verifyUrl);
    
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
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email and password' 
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User Not Found' 
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(405).json({ 
        success: false,
        message: 'Invalid Password'
      });
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
    
    // Log verification attempt for debugging
    console.log('📧 Email verification attempt:', {
      token: token ? `${token.substring(0, 20)}...` : 'missing',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      origin: req.get('origin')
    });

    // Check if token is provided
    if (!token) {
      console.error('❌ Verification failed: Token missing');
      return res.status(400).json({ 
        success: false, 
        message: 'Verification token is required',
        error: 'TOKEN_MISSING'
      });
    }

    // Decode and verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_VERIFY_SECRET);
      console.log('✅ JWT decoded successfully:', {
        userId: decoded.id,
        iat: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'N/A',
        exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'N/A',
        now: new Date().toISOString(),
        expired: decoded.exp ? Date.now() > decoded.exp * 1000 : 'N/A'
      });
    } catch (error) {
      console.error('❌ JWT verification failed:', error.message);
      
      // Check if token is expired
      if (error.name === 'TokenExpiredError') {
        try {
          const expiredDecoded = jwt.decode(token);
          console.log('📅 Expired token details:', {
            userId: expiredDecoded?.id,
            expiredAt: expiredDecoded?.exp ? new Date(expiredDecoded.exp * 1000).toISOString() : 'N/A',
            expiredSince: expiredDecoded?.exp ? Math.floor((Date.now() - expiredDecoded.exp * 1000) / 1000 / 60) + ' minutes' : 'N/A'
          });
        } catch (decodeError) {
          console.error('Failed to decode expired token:', decodeError);
        }
        
        return res.status(400).json({ 
          success: false, 
          message: 'Verification token has expired. Please request a new verification email.',
          error: 'TOKEN_EXPIRED'
        });
      }
      
      // Invalid token signature or malformed
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification token. Please check your email link.',
        error: 'TOKEN_INVALID'
      });
    }

    // Check if user exists in database
    let user;
    try {
      user = await User.findByPk(decoded.id);
    } catch (dbError) {
      console.error('❌ Database error during verification:', dbError);
      return res.status(503).json({ 
        success: false, 
        message: 'Database connection error. Please try again later.',
        error: 'DATABASE_ERROR'
      });
    }

    if (!user) {
      console.error('❌ Verification failed: User not found', { userId: decoded.id });
      return res.status(404).json({ 
        success: false, 
        message: 'User account not found. The account may have been deleted.',
        error: 'USER_NOT_FOUND'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      console.log('ℹ️ Email already verified:', { userId: user.id, email: user.email });
      return res.json({ 
        success: true, 
        message: 'Email already verified' 
      });
    }

    // Verify token matches and hasn't expired in database
    if (!user.verificationToken) {
      console.error('❌ Verification failed: No token stored for user', { userId: user.id });
      return res.status(400).json({ 
        success: false, 
        message: 'No verification token found for this account. Please request a new verification email.',
        error: 'TOKEN_NOT_FOUND'
      });
    }

    if (user.verificationToken !== token) {
      console.error('❌ Verification failed: Token mismatch', { 
        userId: user.id,
        storedToken: user.verificationToken ? `${user.verificationToken.substring(0, 20)}...` : 'none',
        providedToken: `${token.substring(0, 20)}...`
      });
      return res.status(400).json({ 
        success: false, 
        message: 'Verification token does not match. Please use the latest verification email.',
        error: 'TOKEN_MISMATCH'
      });
    }

    if (!user.verificationTokenExpires) {
      console.error('❌ Verification failed: No expiration set', { userId: user.id });
      return res.status(400).json({ 
        success: false, 
        message: 'Verification token has no expiration. Please request a new verification email.',
        error: 'TOKEN_EXPIRATION_MISSING'
      });
    }

    const expirationTime = new Date(user.verificationTokenExpires).getTime();
    const now = Date.now();
    
    if (expirationTime < now) {
      const expiredMinutes = Math.floor((now - expirationTime) / 1000 / 60);
      console.error('❌ Verification failed: Token expired in database', { 
        userId: user.id,
        expiredAt: new Date(expirationTime).toISOString(),
        expiredSince: `${expiredMinutes} minutes`
      });
      return res.status(400).json({ 
        success: false, 
        message: `Verification token expired ${expiredMinutes} minute(s) ago. Please request a new verification email.`,
        error: 'TOKEN_EXPIRED'
      });
    }

    // Mark email as verified
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    console.log('✅ Email verified successfully:', { userId: user.id, email: user.email });
    return res.json({ 
      success: true, 
      message: 'Email verified successfully' 
    });
  } catch (error) {
    console.error('❌ Verify email error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during verification. Please try again later.',
      error: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

    const frontendBaseUrl = getFrontendBaseUrl();
    const verifyUrl = `${frontendBaseUrl.replace(/\/$/, '')}/verify/${verificationToken}`;
    
    // Log verification URL for debugging
    console.log('📧 Generated verification URL (resend):', verifyUrl);
    
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

// @desc    Get authentication status
// @route   GET /api/auth/status
// @access  Public (but requires valid token)
// Returns authentication status without requiring full user data
const getAuthStatus = async (req, res) => {
  try {
    // If middleware passed, user is authenticated
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json({
        authenticated: false,
        user: null,
        message: 'invalid or expired token'
      });
    }

    res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Auth status error:', error);
    res.status(401).json({
      authenticated: false,
      user: null,
      message: 'invalid or expired token'
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
        { model: Language, as: 'languages' },
        { model: Course, as: 'courses' }
      ]
    });

    // Check if user exists (might have been deleted)
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found. Your account may have been deleted.',
        error: 'USER_NOT_FOUND'
      });
    }

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
      professionalSummary, careerObjective, location, resumeVisibility,
      education, experience, skills, languages, isGraduate
    } = req.body;

    // Get current user to check if careerObjective is already set
    const currentUser = await User.findByPk(req.user.id);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate: If user doesn't have careerObjective yet, it becomes required
    const hasExistingCareerObjective = currentUser.careerObjective && currentUser.careerObjective.trim();
    
    // Update user basic info
    const updateData = {};
    
    // Validate careerObjective: required if user doesn't have one yet
    if (careerObjective !== undefined) {
      const newCareerObjective = careerObjective ? sanitizeText(careerObjective).trim() : '';
      if (!hasExistingCareerObjective && !newCareerObjective) {
        return res.status(400).json({
          success: false,
          message: 'Career Objective is required. Please provide your career objective or professional summary.'
        });
      }
      updateData.careerObjective = newCareerObjective;
    }
    if (fullName !== undefined) updateData.fullName = sanitizeText(fullName);
    if (phone !== undefined) updateData.phone = phone || null;
    if (countryCode !== undefined) updateData.countryCode = countryCode || null;
    if (location !== undefined) updateData.location = sanitizeText(location || '');
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
    if (professionalSummary !== undefined) updateData.professionalSummary = sanitizeText(professionalSummary || '');
    if (resumeVisibility !== undefined) updateData.resumeVisibility = resumeVisibility;
    if (isGraduate !== undefined) updateData.isGraduate = Boolean(isGraduate);

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
      // Validate experience date ranges before creating
      for (let i = 0; i < experience.length; i++) {
        const exp = experience[i];
        // Only validate if both dates exist and it's not a current job
        if (exp.startDate && exp.endDate && !exp.current && !exp.isCurrentJob) {
          const startDate = new Date(exp.startDate);
          const endDate = new Date(exp.endDate);
          if (endDate < startDate) {
            return res.status(400).json({ 
              success: false, 
              error: `Experience entry ${i + 1}: End date must be later than start date.` 
            });
          }
        }
      }
      
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
        { model: Language, as: 'languages' },
        { model: Course, as: 'courses' },
        { model: GraduationProject, as: 'graduationProject' }
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

module.exports = { register, login, verifyEmail, forgotPassword, resetPassword, resendVerificationEmail, getAuthStatus, getMe, updateProfile, changePassword, deleteAccount };

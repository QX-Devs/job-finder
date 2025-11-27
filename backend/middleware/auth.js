const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Robust authentication middleware that validates JWT tokens
 * - Verifies JWT signature
 * - Checks token expiration
 * - Confirms user exists in database
 * - Returns 401 with consistent error message on failure
 */
const validateAuthToken = async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // No token provided
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'invalid or expired token' 
    });
  }

  try {
    // Verify JWT signature and expiration
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      // JWT verification failed (expired, invalid signature, malformed, etc.)
      console.error('JWT verification failed:', jwtError.message);
      return res.status(401).json({ 
        success: false,
        message: 'invalid or expired token' 
      });
    }

    // Verify user ID exists in token
    if (!decoded.id) {
      return res.status(401).json({ 
        success: false,
        message: 'invalid or expired token' 
      });
    }

    // Check if user exists in database
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      // User was deleted or doesn't exist
      console.error(`User ${decoded.id} not found in database`);
      return res.status(401).json({ 
        success: false,
        message: 'invalid or expired token' 
      });
    }

    // Check if user is active (optional but recommended)
    if (user.isActive === false) {
      return res.status(401).json({ 
        success: false,
        message: 'invalid or expired token' 
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      success: false,
      message: 'invalid or expired token' 
    });
  }
};

// Alias for backward compatibility
const protect = validateAuthToken;

module.exports = { validateAuthToken, protect };
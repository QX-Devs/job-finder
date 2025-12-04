/**
 * IP Geolocation Service
 * Automatically detects user location from IP address
 * Uses free APIs: ipapi.co or ipinfo.io
 */

const fetch = require('node-fetch');

/**
 * Get user location from IP address
 * @param {string} ip - User's IP address (from req.ip or req.headers)
 * @returns {Promise<string>} - Location string (e.g., "Amman, Jordan") or null
 */
const getLocationFromIP = async (ip) => {
  try {
    // Clean IP address (remove IPv6 prefix if present)
    const cleanIP = ip?.replace(/^::ffff:/, '') || '';
    
    // Skip localhost/private IPs
    if (!cleanIP || cleanIP === '127.0.0.1' || cleanIP === 'localhost' || cleanIP.startsWith('192.168.') || cleanIP.startsWith('10.')) {
      console.log('📍 Skipping geolocation for local/private IP:', cleanIP);
      return null; // Return null for local IPs, let user set manually
    }

    // Try ipapi.co first (free tier: 1000 requests/day)
    try {
      const ipapiResponse = await fetch(`https://ipapi.co/${cleanIP}/json/`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'GradJob-App/1.0'
        }
      });

      if (ipapiResponse.ok) {
        const data = await ipapiResponse.json();
        
        if (data.error) {
          throw new Error(data.reason || 'IP API error');
        }

        // Format: "City, Country"
        const city = data.city || '';
        const country = data.country_name || data.country || '';
        
        if (city && country) {
          const location = `${city}, ${country}`;
          console.log('📍 Location detected from ipapi.co:', location);
          return location;
        } else if (country) {
          console.log('📍 Country detected from ipapi.co:', country);
          return country;
        }
      }
    } catch (ipapiError) {
      console.warn('⚠️ ipapi.co failed, trying ipinfo.io:', ipapiError.message);
    }

    // Fallback to ipinfo.io (free tier: 50,000 requests/month)
    try {
      const ipinfoResponse = await fetch(`https://ipinfo.io/${cleanIP}/json`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'GradJob-App/1.0'
        }
      });

      if (ipinfoResponse.ok) {
        const data = await ipinfoResponse.json();
        
        if (data.error) {
          throw new Error(data.error.message || 'IP Info error');
        }

        // Format: "City, Country"
        const city = data.city || '';
        const country = data.country || '';
        const region = data.region || '';
        
        if (city && country) {
          const location = `${city}, ${country}`;
          console.log('📍 Location detected from ipinfo.io:', location);
          return location;
        } else if (region && country) {
          const location = `${region}, ${country}`;
          console.log('📍 Location detected from ipinfo.io:', location);
          return location;
        } else if (country) {
          console.log('📍 Country detected from ipinfo.io:', country);
          return country;
        }
      }
    } catch (ipinfoError) {
      console.warn('⚠️ ipinfo.io also failed:', ipinfoError.message);
    }

    // If all APIs fail, return null (not "Unknown" - let user set manually)
    console.log('📍 Could not detect location from IP:', cleanIP);
    return null;
  } catch (error) {
    console.error('❌ Geolocation error:', error);
    return null; // Return null on error, let user set manually
  }
};

/**
 * Extract IP address from request
 * @param {Object} req - Express request object
 * @returns {string} - IP address
 */
const getClientIP = (req) => {
  // Check various headers for real IP (useful behind proxies/load balancers)
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.headers['cf-connecting-ip'] || // Cloudflare
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1'
  );
};

module.exports = {
  getLocationFromIP,
  getClientIP
};


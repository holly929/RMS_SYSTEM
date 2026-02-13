const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided, access denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ 
      _id: decoded.userId, 
      'tokens.token': token 
    });

    if (!user) {
      throw new Error('User not found');
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      error: 'Invalid or expired token, please login again' 
    });
  }
};

const require2FA = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided, access denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.twoFactorVerified) {
      return res.status(401).json({ 
        error: 'Two-factor authentication required',
        requires2FA: true
      });
    }

    const user = await User.findOne({ 
      _id: decoded.userId, 
      'tokens.token': token 
    });

    if (!user) {
      throw new Error('User not found');
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      error: 'Invalid or expired token' 
    });
  }
};

module.exports = { auth, require2FA };

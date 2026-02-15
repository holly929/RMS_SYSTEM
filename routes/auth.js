const express = require('express');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');
const { auth, require2FA } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists with this email or username' 
      });
    }

    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    user.tokens = user.tokens || [];
    user.tokens.push({ token });
    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Server error during registration' 
    });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid email or password' 
      });
    }

    if (user.isAccountLocked()) {
      return res.status(429).json({ 
        error: 'Account is locked. Please try again later.' 
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      await user.incrementLoginAttempts();
      return res.status(400).json({ 
        error: 'Invalid email or password',
        remainingAttempts: Math.max(0, 5 - user.loginAttempts)
      });
    }

    await user.resetLoginAttempts();
    user.lastLoginAt = new Date();
    await user.save();

    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign(
        { 
          userId: user._id, 
          twoFactorRequired: true 
        },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );

      return res.json({
        message: 'Two-factor authentication required',
        requires2FA: true,
        tempToken
      });
    }

    const token = jwt.sign(
      { 
        userId: user._id, 
        twoFactorVerified: true 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    user.tokens = user.tokens || [];
    user.tokens.push({ token });
    await user.save();

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Server error during login' 
    });
  }
});

router.post('/verify-2fa', authLimiter, async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({ 
        error: 'Temporary token and verification code are required' 
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ 
        error: 'Invalid or expired temporary token' 
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ 
        error: 'Two-factor authentication not enabled for this user' 
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ 
        error: 'Invalid verification code' 
      });
    }

    const token = jwt.sign(
      { 
        userId: user._id, 
        twoFactorVerified: true 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    user.tokens = user.tokens || [];
    user.tokens.push({ token });
    await user.save();

    res.json({
      message: 'Two-factor authentication verified',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ 
      error: 'Server error during 2FA verification' 
    });
  }
});

router.post('/verify-recovery-code', authLimiter, async (req, res) => {
  try {
    const { tempToken, recoveryCode } = req.body;

    if (!tempToken || !recoveryCode) {
      return res.status(400).json({ 
        error: 'Temporary token and recovery code are required' 
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ 
        error: 'Invalid or expired temporary token' 
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ 
        error: 'Two-factor authentication not enabled for this user' 
      });
    }

    const codeIndex = user.twoFactorRecoveryCodes.findIndex(
      code => code === recoveryCode.trim()
    );

    if (codeIndex === -1) {
      return res.status(400).json({ 
        error: 'Invalid recovery code' 
      });
    }

    user.twoFactorRecoveryCodes.splice(codeIndex, 1);
    await user.save();

    const token = jwt.sign(
      { 
        userId: user._id, 
        twoFactorVerified: true 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    user.tokens = user.tokens || [];
    user.tokens.push({ token });
    await user.save();

    res.json({
      message: 'Recovery code verified',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled,
        remainingRecoveryCodes: user.twoFactorRecoveryCodes.length
      }
    });
  } catch (error) {
    console.error('Recovery code verification error:', error);
    res.status(500).json({ 
      error: 'Server error during recovery code verification' 
    });
  }
});

router.post('/enable-2fa', auth, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `RMS System (${req.user.email})`
    });

    const otpauthUrl = secret.otpauth_url;
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    req.user.twoFactorSecret = secret.base32;
    
    const recoveryCodes = [];
    for (let i = 0; i < 10; i++) {
      recoveryCodes.push(
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );
    }
    req.user.twoFactorRecoveryCodes = recoveryCodes;
    req.user.twoFactorEnabled = false;

    await req.user.save();

    res.json({
      message: '2FA setup initiated',
      qrCode: qrCodeDataUrl,
      secret: secret.base32,
      recoveryCodes
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({ 
      error: 'Server error during 2FA setup' 
    });
  }
});

router.post('/confirm-2fa', auth, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ 
        error: 'Verification code is required' 
      });
    }

    if (!req.user.twoFactorSecret) {
      return res.status(400).json({ 
        error: '2FA not initialized' 
      });
    }

    const verified = speakeasy.totp.verify({
      secret: req.user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ 
        error: 'Invalid verification code' 
      });
    }

    req.user.twoFactorEnabled = true;
    await req.user.save();

    res.json({
      message: 'Two-factor authentication enabled',
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        twoFactorEnabled: req.user.twoFactorEnabled
      }
    });
  } catch (error) {
    console.error('Confirm 2FA error:', error);
    res.status(500).json({ 
      error: 'Server error during 2FA confirmation' 
    });
  }
});

router.post('/disable-2fa', auth, async (req, res) => {
  try {
    req.user.twoFactorEnabled = false;
    req.user.twoFactorSecret = null;
    req.user.twoFactorRecoveryCodes = [];
    await req.user.save();

    res.json({
      message: 'Two-factor authentication disabled',
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        twoFactorEnabled: req.user.twoFactorEnabled
      }
    });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ 
      error: 'Server error during 2FA disable' 
    });
  }
});

router.get('/profile', require2FA, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        twoFactorEnabled: req.user.twoFactorEnabled,
        lastLoginAt: req.user.lastLoginAt,
        remainingRecoveryCodes: req.user.twoFactorRecoveryCodes.length
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      error: 'Server error during profile fetch' 
    });
  }
});

router.post('/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    await req.user.save();
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Server error during logout' 
    });
  }
});

router.post('/logout-all', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ 
      error: 'Server error during logout from all devices' 
    });
  }
});

module.exports = router;

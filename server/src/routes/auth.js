import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import { User } from '../models/index.js';
import { generateTokens, setTokenCookies, clearTokenCookies } from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post('/signup', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().notEmpty(),
  body('birthdate').isISO8601(),
  body('gender').isIn(['man', 'woman', 'nonbinary']),
  body('interestedIn').isArray({ min: 1 }),
  body('interestedIn.*').isIn(['man', 'woman', 'nonbinary'])
], validate, async (req, res) => {
  try {
    const { email, password, firstName, birthdate, gender, interestedIn } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    const birth = new Date(birthdate);
    const age = new Date().getFullYear() - birth.getFullYear();
    if (age < 18) {
      return res.status(400).json({ error: 'Must be 18 or older' });
    }
    
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      passwordHash,
      firstName,
      birthdate: birth,
      gender,
      interestedIn
    });
    
    const { accessToken, refreshToken } = generateTokens(user._id);
    setTokenCookies(res, accessToken, refreshToken);
    
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.status(201).json({ user: userObj });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    user.lastSeen = new Date();
    await user.save();
    
    const { accessToken, refreshToken } = generateTokens(user._id);
    setTokenCookies(res, accessToken, refreshToken);
    
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.json({ user: userObj });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    const { verifyRefreshToken, generateTokens: genTokens, setTokenCookies: setCookies } = await import('../utils/jwt.js');
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const { accessToken, refreshToken: newRefreshToken } = genTokens(user._id);
    setCookies(res, accessToken, newRefreshToken);
    
    res.json({ user: user.toObject() });
  } catch (err) {
    clearTokenCookies(res);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', (_req, res) => {
  clearTokenCookies(res);
  res.json({ success: true });
});

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user.toObject() });
});

export default router;
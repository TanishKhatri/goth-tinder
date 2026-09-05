import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User } from '../models/index.js';

export const authenticate = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken;
    if (!accessToken) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(accessToken, config.jwtAccessSecret);
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken;
    if (accessToken) {
      const decoded = jwt.verify(accessToken, config.jwtAccessSecret);
      const user = await User.findById(decoded.userId).select('-passwordHash');
      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch {
    next();
  }
};
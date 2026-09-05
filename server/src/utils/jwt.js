import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, config.jwtAccessSecret, { expiresIn: config.jwtAccessExpiry });
  const refreshToken = jwt.sign({ userId }, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpiry });
  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwtRefreshSecret);
};

export const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = config.nodeEnv === 'production';
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

export const clearTokenCookies = (res) => {
  const isProduction = config.nodeEnv === 'production';
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
};
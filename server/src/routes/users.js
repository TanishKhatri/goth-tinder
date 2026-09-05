import { Router } from 'express';
import mongoose from 'mongoose';
import { body, query } from 'express-validator';
import { User } from '../models/index.js';
import { Swipe } from '../models/index.js';
import { BlockReport } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { calculateDistance } from '../utils/distance.js';
import { isCloudinaryEnabled, uploadPhoto } from '../utils/cloudinary.js';

const router = Router();

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user.toObject() });
});

const photoValidator = body('photos').optional().isArray({ min: 1, max: 6 });
const photoItemValidator = body('photos.*').optional().isString().isLength({ min: 1, max: 7000000 }).custom((v) => {
  if (/^data:image\/[a-zA-Z+]+;base64,/.test(v)) return true;
  if (/^https?:\/\/.+/.test(v)) return true;
  throw new Error('Photo must be an http(s) URL or image data URL');
});

router.put('/me', authenticate, [
  body('bio').optional().isString().isLength({ max: 500 }),
  body('interests').optional().isArray(),
  body('interests.*').optional().isString().trim(),
  body('preferences.minAge').optional().isInt({ min: 18, max: 99 }),
  body('preferences.maxAge').optional().isInt({ min: 18, max: 99 }),
  body('preferences.maxDistance').optional().isInt({ min: 1, max: 500 }),
  body('location.city').optional().isString().trim(),
  body('location.lat').optional().isFloat({ min: -90, max: 90 }),
  body('location.lng').optional().isFloat({ min: -180, max: 180 }),
  photoValidator,
  photoItemValidator
], validate, async (req, res) => {
  try {
    const allowedFields = ['bio', 'interests', 'preferences', 'location', 'photos'];
    const updates = {};
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    res.json({ user: user.toObject() });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

router.post('/me/photos', authenticate, [
  body('photos').isArray({ min: 1, max: 6 }),
  // Accept remote URLs AND data URLs (local file previews) so photo uploads
  // work before real object storage (S3/Cloudinary) is wired up.
  body('photos.*').isString().isLength({ min: 1, max: 7000000 }).custom((v) => {
    if (/^data:image\/[a-zA-Z+]+;base64,/.test(v)) return true;
    if (/^https?:\/\/.+/.test(v)) return true;
    throw new Error('Photo must be an http(s) URL or image data URL');
  })
], validate, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { photos: req.body.photos } },
      { new: true }
    );
    res.json({ user: user.toObject() });
  } catch (err) {
    res.status(500).json({ error: 'Photo update failed' });
  }
});

// Upload a single photo to Cloudinary. Body: { image: <data URL> }.
// Returns { url } — save it via PUT /me or POST /me/photos.
router.post('/me/photos/upload', authenticate, [
  body('image').isString().isLength({ min: 1, max: 10000000 }).custom((v) => {
    if (/^data:image\/[a-zA-Z+]+;base64,/.test(v)) return true;
    throw new Error('image must be an image data URL');
  })
], validate, async (req, res) => {
  try {
    if (!isCloudinaryEnabled()) {
      return res.status(503).json({ error: 'Photo uploads are not configured on the server' });
    }
    const url = await uploadPhoto(req.body.image, req.user._id.toString());
    res.status(201).json({ url });
  } catch (err) {
    console.error('Photo upload error:', err?.message || err);
    res.status(502).json({ error: 'Photo upload failed' });
  }
});

router.put('/me/password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 })
], validate, async (req, res) => {
  try {
    const bcrypt = await import('bcryptjs');
    const user = await User.findById(req.user._id);
    const valid = await bcrypt.default.compare(req.body.currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password incorrect' });
    }
    user.passwordHash = await bcrypt.default.hash(req.body.newPassword, 12);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Password change failed' });
  }
});

router.delete('/me', authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Account deletion failed' });
  }
});

router.get('/discover', authenticate, [
  query('limit').optional().isInt({ min: 1, max: 20 })
], validate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const me = req.user;

    const swipedIds = await Swipe.distinct('swipedId', { swiperId: me._id });

    const blocks = await BlockReport.find({
      $or: [
        { reporterId: me._id, type: 'block' },
        { reportedId: me._id, type: 'block' }
      ]
    }).select('reporterId reportedId').lean();
    const blockedIds = blocks.flatMap(b => [b.reporterId, b.reportedId]);

    const excludeIds = [...swipedIds, ...blockedIds, me._id].map(
      id => new mongoose.Types.ObjectId(id.toString())
    );

    // Users store birthdate, not age — convert the age-range preference
    // into a birthdate window.
    const now = new Date();
    const minBirth = new Date(now.getFullYear() - (me.preferences?.maxAge ?? 99), now.getMonth(), now.getDate());
    const maxBirth = new Date(now.getFullYear() - (me.preferences?.minAge ?? 18), now.getMonth(), now.getDate());

    const query = {
      _id: { $nin: excludeIds },
      isActive: true,
      gender: { $in: me.interestedIn?.length ? me.interestedIn : ['man', 'woman', 'nonbinary'] },
      interestedIn: me.gender,
      birthdate: { $gte: minBirth, $lte: maxBirth }
    };

    // Strip sensitive fields from candidate profiles.
    const projection = '-passwordHash -email';

    if (me.location?.lat && me.location?.lng && me.preferences?.maxDistance) {
      const candidates = await User.find(query, projection).limit(limit * 3).lean();
      const withDistance = candidates.map(u => {
        const dist = calculateDistance(me.location.lat, me.location.lng, u.location?.lat, u.location?.lng);
        return { ...u, distance: dist };
      }).filter(u => u.distance === null || u.distance <= me.preferences.maxDistance)
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
        .slice(0, limit);

      return res.json({ users: withDistance });
    }

    const users = await User.find(query, projection).limit(limit).lean();
    res.json({ users: users.map(u => ({ ...u, distance: null })) });
  } catch (err) {
    console.error('Discover error:', err);
    res.status(500).json({ error: 'Discovery failed' });
  }
});

// Public profile for another user. Only safe-to-share fields — never email,
// passwordHash, or preferences. Blocked users (either direction) are hidden.
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (req.params.id === req.user._id.toString()) {
      const me = await User.findById(req.user._id).select('-passwordHash -email');
      return res.json({ user: me.toObject() });
    }
    const blocked = await BlockReport.findOne({
      type: 'block',
      $or: [
        { reporterId: req.user._id, reportedId: req.params.id },
        { reporterId: req.params.id, reportedId: req.user._id }
      ]
    }).select('_id').lean();
    if (blocked) {
      return res.status(404).json({ error: 'User not found' });
    }
    const other = await User.findOne({ _id: req.params.id, isActive: true })
      .select('firstName birthdate gender bio photos interests location.city lastSeen');
    if (!other) {
      return res.status(404).json({ error: 'User not found' });
    }
    // toObject() applies the age virtual (lean() drops it on this version).
    res.json({ user: other.toObject() });
  } catch (err) {
    console.error('Public profile error:', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

export default router;
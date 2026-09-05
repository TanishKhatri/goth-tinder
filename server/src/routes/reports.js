import { Router } from 'express';
import { body } from 'express-validator';
import { BlockReport } from '../models/index.js';
import { User } from '../models/index.js';
import { Match } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post('/', authenticate, [
  body('reportedId').isMongoId(),
  body('type').isIn(['block', 'report']),
  body('reason').optional().isString().isLength({ max: 500 })
], validate, async (req, res) => {
  try {
    const { reportedId, type, reason } = req.body;
    const reporterId = req.user._id;
    
    if (reporterId.toString() === reportedId) {
      return res.status(400).json({ error: 'Cannot block/report yourself' });
    }
    
    const reported = await User.findById(reportedId);
    if (!reported) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const existing = await BlockReport.findOne({ reporterId, reportedId, type });
    if (existing) {
      return res.status(409).json({ error: `Already ${type}ed this user` });
    }
    
    await BlockReport.create({ reporterId, reportedId, type, reason });
    
    if (type === 'block') {
      await Match.updateMany(
        { $or: [{ user1Id: reporterId, user2Id: reportedId }, { user1Id: reportedId, user2Id: reporterId }], unmatchedAt: null },
        { $set: { unmatchedAt: new Date(), unmatchedBy: reporterId } }
      );
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Block/report error:', err);
    res.status(500).json({ error: 'Action failed' });
  }
});

router.delete('/block/:userId', authenticate, async (req, res) => {
  try {
    await BlockReport.deleteOne({ reporterId: req.user._id, reportedId: req.params.userId, type: 'block' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Unblock failed' });
  }
});

export default router;
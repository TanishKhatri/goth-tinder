import { Router } from 'express';
import mongoose from 'mongoose';
import { body } from 'express-validator';
import { Swipe } from '../models/index.js';
import { Match } from '../models/index.js';
import { User } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post('/', authenticate, [
  body('swipedId').isMongoId(),
  body('direction').isIn(['like', 'pass'])
], validate, async (req, res) => {
  try {
    const { swipedId, direction } = req.body;
    const swiperId = req.user._id;
    
    if (swiperId.toString() === swipedId) {
      return res.status(400).json({ error: 'Cannot swipe yourself' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(swipedId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    const swipedUser = await User.findOne({ _id: swipedId, isActive: true }).select('_id');
    if (!swipedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await Swipe.findOneAndUpdate(
      { swiperId, swipedId },
      { direction },
      { upsert: true, new: true }
    );
    
    let match = false;
    let matchId = null;
    
    if (direction === 'like') {
      const reciprocal = await Swipe.findOne({ swiperId: swipedId, swipedId: swiperId, direction: 'like' });
      if (reciprocal) {
        const [user1Id, user2Id] = [swiperId, swipedId].sort((a, b) => a.toString().localeCompare(b.toString()));
        const existingMatch = await Match.findOne({ user1Id, user2Id });
        if (!existingMatch) {
          const newMatch = await Match.create({ user1Id, user2Id });
          match = true;
          matchId = newMatch._id;
        } else if (existingMatch.unmatchedAt) {
          existingMatch.unmatchedAt = null;
          existingMatch.unmatchedBy = null;
          await existingMatch.save();
          match = true;
          matchId = existingMatch._id;
        }
      }
    }
    
    res.json({ match, matchId });
  } catch (err) {
    console.error('Swipe error:', err);
    res.status(500).json({ error: 'Swipe failed' });
  }
});

export default router;
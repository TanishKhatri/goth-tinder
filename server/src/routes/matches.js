import { Router } from 'express';
import mongoose from 'mongoose';
import { Match } from '../models/index.js';
import { Message } from '../models/index.js';
import { User } from '../models/index.js';
import { BlockReport } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [{ user1Id: req.user._id }, { user2Id: req.user._id }],
      unmatchedAt: null
    }).sort({ matchedAt: -1 }).lean();
    
    const matchIds = matches.map(m => m._id);
    const messages = await Message.find({ matchId: { $in: matchIds } })
      .sort({ sentAt: -1 })
      .lean();
    
    const latestMessages = {};
    for (const msg of messages) {
      const key = msg.matchId.toString();
      if (!latestMessages[key]) {
        latestMessages[key] = msg;
      }
    }
    
    const otherUserIds = matches.map(m => 
      m.user1Id.toString() === req.user._id.toString() ? m.user2Id : m.user1Id
    );
    const otherUsers = await User.find({ _id: { $in: otherUserIds } })
      .select('firstName photos lastSeen')
      .lean();
    const userMap = Object.fromEntries(otherUsers.map(u => [u._id.toString(), u]));
    
    const blocked = await BlockReport.find({
      $or: [
        { reporterId: req.user._id, type: 'block' },
        { reportedId: req.user._id, type: 'block' }
      ]
    }).lean();
    const blockedIds = new Set(blocked.flatMap(b => [b.reporterId.toString(), b.reportedId.toString()]));
    
    const result = matches.map(m => {
      const otherId = m.user1Id.toString() === req.user._id.toString() ? m.user2Id : m.user1Id;
      const other = userMap[otherId.toString()];
      const lastMsg = latestMessages[m._id.toString()];
      return {
        _id: m._id,
        matchedAt: m.matchedAt,
        otherUser: other ? {
          _id: other._id,
          firstName: other.firstName,
          photos: other.photos,
          lastSeen: other.lastSeen,
          isBlocked: blockedIds.has(otherId.toString())
        } : null,
        lastMessage: lastMsg ? {
          content: lastMsg.content,
          sentAt: lastMsg.sentAt,
          senderId: lastMsg.senderId,
          readAt: lastMsg.readAt
        } : null,
        unreadCount: lastMsg && lastMsg.senderId.toString() !== req.user._id.toString() && !lastMsg.readAt ? 1 : 0
      };
    }).filter(m => m.otherUser);
    
    res.json({ matches: result });
  } catch (err) {
    console.error('Matches error:', err);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Match not found' });
    }
    const match = await Match.findOne({
      _id: req.params.id,
      $or: [{ user1Id: req.user._id }, { user2Id: req.user._id }],
      unmatchedAt: null
    });
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    match.unmatchedAt = new Date();
    match.unmatchedBy = req.user._id;
    await match.save();
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Unmatch failed' });
  }
});

router.get('/:id/messages', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Match not found' });
    }
    const match = await Match.findOne({
      _id: req.params.id,
      $or: [{ user1Id: req.user._id }, { user2Id: req.user._id }],
      unmatchedAt: null
    });
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    const messages = await Message.find({ matchId: req.params.id })
      .sort({ sentAt: 1 })
      .lean();
    
    await Message.updateMany(
      { matchId: req.params.id, senderId: { $ne: req.user._id }, readAt: null },
      { $set: { readAt: new Date() } }
    );
    
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

export default router;
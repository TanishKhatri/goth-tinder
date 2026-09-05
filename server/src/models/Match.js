import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  user1Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  matchedAt: { type: Date, default: Date.now },
  unmatchedAt: { type: Date, default: null },
  unmatchedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});

matchSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });
matchSchema.index({ user1Id: 1 });
matchSchema.index({ user2Id: 1 });

export const Match = mongoose.model('Match', matchSchema);
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 2000 },
  sentAt: { type: Date, default: Date.now },
  readAt: { type: Date, default: null }
});

messageSchema.index({ matchId: 1, sentAt: -1 });
messageSchema.index({ senderId: 1 });

export const Message = mongoose.model('Message', messageSchema);
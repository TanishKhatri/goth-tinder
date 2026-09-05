import mongoose from 'mongoose';

const swipeSchema = new mongoose.Schema({
  swiperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  swipedId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  direction: { type: String, required: true, enum: ['like', 'pass'] },
  createdAt: { type: Date, default: Date.now }
});

swipeSchema.index({ swiperId: 1, swipedId: 1 }, { unique: true });
swipeSchema.index({ swipedId: 1 });

export const Swipe = mongoose.model('Swipe', swipeSchema);
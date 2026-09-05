import mongoose from 'mongoose';

const blockReportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportedId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, enum: ['block', 'report'] },
  reason: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

blockReportSchema.index({ reporterId: 1, reportedId: 1, type: 1 }, { unique: true });

export const BlockReport = mongoose.model('BlockReport', blockReportSchema);
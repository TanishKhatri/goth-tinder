import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, required: true, trim: true },
  birthdate: { type: Date, required: true },
  gender: { type: String, required: true, enum: ['man', 'woman', 'nonbinary'] },
  interestedIn: [{ type: String, enum: ['man', 'woman', 'nonbinary'] }],
  bio: { type: String, default: '', maxlength: 500 },
  photos: [{ type: String }],
  interests: [{ type: String, trim: true }],
  location: {
    city: { type: String, default: '' },
    lat: { type: Number },
    lng: { type: Number }
  },
  preferences: {
    minAge: { type: Number, default: 18 },
    maxAge: { type: Number, default: 99 },
    maxDistance: { type: Number, default: 50 }
  },
  isActive: { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

userSchema.index({ gender: 1, interestedIn: 1 });
userSchema.index({ 'location.lat': 1, 'location.lng': 1 });

userSchema.virtual('age').get(function() {
  const today = new Date();
  const birth = new Date(this.birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

export const User = mongoose.model('User', userSchema);
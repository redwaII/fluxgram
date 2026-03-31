import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, trim: true, minlength: 2, maxlength: 32 },
    passwordHash: { type: String, required: true, select: false },
    avatarUrl: { type: String, default: '' },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.index({ username: 'text', email: 'text' });

export const User = mongoose.model('User', userSchema);

import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['direct', 'group'], required: true, default: 'direct' },
    name: { type: String, trim: true, maxlength: 120, default: '' },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    directKey: { type: String, sparse: true, unique: true },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, default: '' },
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageAt: -1 });

export const Chat = mongoose.model('Chat', chatSchema);

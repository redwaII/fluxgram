import { User } from '../../models/User.js';

export const authRepository = {
  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  },

  async findById(id) {
    return User.findById(id);
  },

  async create({ email, username, passwordHash, avatarUrl }) {
    return User.create({ email, username, passwordHash, avatarUrl: avatarUrl || '' });
  },

  async updateAvatar(userId, avatarUrl) {
    return User.findByIdAndUpdate(userId, { avatarUrl }, { new: true });
  },
};

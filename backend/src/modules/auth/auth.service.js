import bcrypt from 'bcrypt';
import { AppError } from '../../common/errors.js';
import { authRepository } from './auth.repository.js';

const SALT_ROUNDS = 10;

export function authService(fastify) {
  return {
    async register({ email, username, password }) {
      const existing = await authRepository.findByEmail(email);
      if (existing) throw new AppError(409, 'Email already registered');
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await authRepository.create({ email, username, passwordHash });
      const token = fastify.jwt.sign({ sub: user._id.toString(), email: user.email });
      return { user: sanitizeUser(user), token };
    },

    async login({ email, password }) {
      const user = await authRepository.findByEmail(email);
      if (!user) throw new AppError(401, 'Invalid credentials');
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) throw new AppError(401, 'Invalid credentials');
      const token = fastify.jwt.sign({ sub: user._id.toString(), email: user.email });
      return { user: sanitizeUser(user), token };
    },

    async me(userId) {
      const user = await authRepository.findById(userId);
      if (!user) throw new AppError(404, 'User not found');
      return sanitizeUser(user);
    },
  };
}

function sanitizeUser(doc) {
  return {
    id: doc._id.toString(),
    email: doc.email,
    username: doc.username,
    avatarUrl: doc.avatarUrl || '',
    lastSeen: doc.lastSeen,
    createdAt: doc.createdAt,
  };
}

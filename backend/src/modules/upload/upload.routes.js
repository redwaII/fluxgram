import path from 'path';
import fs from 'fs/promises';
import { randomBytes } from 'crypto';
import { env } from '../../config/env.js';
import { authRepository } from '../auth/auth.repository.js';
import { AppError } from '../../common/errors.js';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

export async function uploadRoutes(fastify) {
  fastify.post(
    '/upload',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const file = await request.file();
      if (!file) throw new AppError(400, 'No file');
      if (!ALLOWED.has(file.mimetype)) throw new AppError(400, 'Unsupported file type');

      const ext = path.extname(file.filename || '') || '.bin';
      const name = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
      const dir = path.resolve(process.cwd(), env.UPLOAD_DIR);
      await fs.mkdir(dir, { recursive: true });
      const full = path.join(dir, name);
      const buf = await file.toBuffer();
      await fs.writeFile(full, buf);

      const publicUrl = `/uploads/${name}`;
      return reply.send({ url: publicUrl, mimeType: file.mimetype, originalName: file.filename });
    }
  );

  fastify.post(
    '/auth/avatar',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const file = await request.file();
      if (!file) throw new AppError(400, 'No file');
      if (!ALLOWED.has(file.mimetype)) throw new AppError(400, 'Unsupported image type');

      const ext = path.extname(file.filename || '') || '.jpg';
      const name = `avatar-${request.user.sub}-${Date.now()}${ext}`;
      const dir = path.resolve(process.cwd(), env.UPLOAD_DIR);
      await fs.mkdir(dir, { recursive: true });
      const full = path.join(dir, name);
      await fs.writeFile(full, await file.toBuffer());

      const avatarUrl = `/uploads/${name}`;
      await authRepository.updateAvatar(request.user.sub, avatarUrl);
      return reply.send({ avatarUrl });
    }
  );
}

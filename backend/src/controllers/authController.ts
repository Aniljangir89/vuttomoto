import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { config } from '../config/index.js';
import { AuthRequest } from '../middleware/auth.js';
import { createAuditLog } from '../utils/auditLogger.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['BUYER', 'SELLER', 'ADMIN']).optional().default('BUYER')
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

function generateToken(user: { id: string; email: string; name: string; role: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    config.jwtSecret,
    { expiresIn: '24h' }
  );
}

export async function register(req: Request, res: Response) {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Validation error', details: parseResult.error.format() });
  }

  const { email, password, name, role } = parseResult.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role }
  });

  const token = generateToken(user);
  await createAuditLog({ userId: user.id, action: 'USER_REGISTER', entityType: 'USER', entityId: user.id });

  return res.status(201).json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token
  });
}

export async function login(req: Request, res: Response) {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Validation error', details: parseResult.error.format() });
  }

  const { email, password } = parseResult.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user);
  await createAuditLog({ userId: user.id, action: 'USER_LOGIN', entityType: 'USER', entityId: user.id });

  return res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token
  });
}

export async function quickLogin(req: Request, res: Response) {
  const role = (req.body.role || 'BUYER').toUpperCase();
  
  let email = 'buyer1@auction.com';
  if (role === 'SELLER') email = 'seller@auction.com';
  if (role === 'ADMIN') email = 'admin@auction.com';
  if (role === 'BUYER_2') email = 'buyer2@auction.com';

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    return res.status(404).json({ error: `Demo user for role ${role} (${email}) not found. Please run seed script.` });
  }

  const token = generateToken(user);
  await createAuditLog({ userId: user.id, action: 'USER_QUICK_LOGIN', entityType: 'USER', entityId: user.id });

  return res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token
  });
}

export async function getMe(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  });

  return res.json({ user });
}

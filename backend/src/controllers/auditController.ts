import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../db/prisma.js';

export async function listAuditLogs(req: AuthRequest, res: Response) {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    return res.json({ logs });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
}

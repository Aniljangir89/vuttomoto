import { prisma } from '../db/prisma.js';
import { logger } from '../logger/index.js';

export async function createAuditLog(params: {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        detailsJson: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress || null
      }
    });
  } catch (err) {
    logger.error({ err, params }, 'Failed to create audit log entry');
  }
}

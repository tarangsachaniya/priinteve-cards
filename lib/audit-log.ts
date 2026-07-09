import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export type AuditAction =
  | "plan.create"
  | "plan.update"
  | "plan.duplicate"
  | "plan.delete"
  | "plan.enable"
  | "plan.disable"
  | "plan.import";

export async function writeAuditLog(params: {
  actorId: string;
  actorEmail: string;
  action: AuditAction;
  targetType: "plan";
  targetId: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.adminAuditLog.create({
      data: { ...params, metadata: params.metadata as Prisma.InputJsonValue | undefined },
    });
  } catch (err) {
    console.error("audit log write failed", err);
  }
}

import type { Prisma } from "@prisma/client";
import { prisma } from "../client";

export const connectionRepository = {
  async listByUser(userId: string) {
    return prisma.r2Connection.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  },

  async getSafeById(connectionId: string) {
    return prisma.r2Connection.findUnique({
      where: { id: connectionId },
      select: {
        id: true,
        name: true,
        bucketName: true,
        endpoint: true,
        publicUrl: true,
        region: true,
        status: true,
        lastConnectedAt: true,
        lastSelectedPath: true,
        updatedAt: true
      }
    });
  },

  async create(data: Prisma.R2ConnectionCreateInput) {
    return prisma.r2Connection.create({ data });
  },

  async update(connectionId: string, data: Prisma.R2ConnectionUpdateInput) {
    return prisma.r2Connection.update({ where: { id: connectionId }, data });
  },

  async delete(connectionId: string) {
    return prisma.r2Connection.delete({ where: { id: connectionId } });
  }
};

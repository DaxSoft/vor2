import type { Prisma } from "@prisma/client";
import { prisma } from "../client";

export const uploadRepository = {
  async create(data: Prisma.UploadHistoryUncheckedCreateInput) {
    return prisma.uploadHistory.create({ data });
  },

  async update(uploadId: string, data: Prisma.UploadHistoryUpdateInput) {
    return prisma.uploadHistory.update({ where: { id: uploadId }, data });
  },

  async recentByUser(userId: string, take = 20) {
    return prisma.uploadHistory.findMany({ where: { userId }, take, orderBy: { createdAt: "desc" } });
  }
};

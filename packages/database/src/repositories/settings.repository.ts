import type { Prisma } from "@prisma/client";
import { prisma } from "../client";

export const settingsRepository = {
  async getByUser(userId: string) {
    return prisma.appSettings.findUnique({ where: { userId } });
  },

  async upsert(userId: string, data: Prisma.AppSettingsUpdateInput) {
    return prisma.appSettings.upsert({
      where: { userId },
      create: {
        user: { connect: { id: userId } }
      },
      update: data
    });
  }
};

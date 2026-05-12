import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@r2-explorer/database/src/client";

export const auth = betterAuth({
  database: prismaAdapter(prisma as never, {
    provider: "sqlite"
  }),
  emailAndPassword: {
    enabled: true
  }
});

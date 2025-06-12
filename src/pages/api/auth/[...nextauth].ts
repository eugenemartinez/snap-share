import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";
import { rateLimit } from "@/utils/rateLimit";

const prisma = new PrismaClient();

const loginRateLimitStore: Record<string, { count: number; reset: number }> = {};
const LOGIN_LIMIT = 10; // max attempts per window
const LOGIN_WINDOW = 60 * 60 * 1000; // 1 hour

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const ip =
          (req?.headers && req.headers["x-forwarded-for"]?.toString().split(",")[0]) ||
          "unknown";

        const { limited } = rateLimit(loginRateLimitStore, ip, LOGIN_LIMIT, LOGIN_WINDOW);
        if (limited) {
          throw new Error("Too many login attempts. Try again later.");
        }

        if (!credentials?.identifier || !credentials?.password) return null;
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.identifier },
              { username: credentials.identifier },
            ],
          },
        });
        if (!user) return null;
        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;
        return { id: user.id, email: user.email, username: user.username };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.JWT_SECRET,
};

export default NextAuth(authOptions);
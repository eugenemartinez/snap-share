import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

const FOLLOW_LIMIT = 5000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  let user = null;
  if (session?.user?.email) {
    user = await prisma.user.findUnique({ where: { email: session.user.email } });
  }

  const { username } = req.query;
  const targetUser = await prisma.user.findUnique({ where: { username: String(username) } });
  if (!targetUser) return res.status(404).json({ message: "User not found" });

  if (req.method === "POST") {
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.id === targetUser.id) return res.status(400).json({ message: "Cannot follow yourself" });

    // Enforce follow table limit
    const followCount = await prisma.follow.count();
    if (followCount >= FOLLOW_LIMIT) {
      return res.status(403).json({ message: "Follow limit reached. No more follows allowed." });
    }

    // Only increment if this is a new follow
    const existingFollow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: user.id, followingId: targetUser.id } },
    });
    if (!existingFollow) {
      await prisma.follow.create({
        data: { followerId: user.id, followingId: targetUser.id },
      });
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { followerCount: { increment: 1 } },
      });
    }
    return res.status(200).json({ following: true });
  }

  if (req.method === "DELETE") {
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    await prisma.follow.deleteMany({
      where: { followerId: user.id, followingId: targetUser.id },
    });
    return res.status(200).json({ following: false });
  }

  if (req.method === "GET") {
    // Get follower count and if current user is following
    const [count, following] = await Promise.all([
      prisma.follow.count({ where: { followingId: targetUser.id } }),
      user
        ? prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: user.id, followingId: targetUser.id } },
          })
        : Promise.resolve(null),
    ]);
    return res.status(200).json({ count, following: !!following });
  }

  return res.status(405).end();
}
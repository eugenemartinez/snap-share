import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only require auth for POST and DELETE
  let user = null;
  if (req.method === "POST" || req.method === "DELETE" || req.method === "GET") {
    const session = await getServerSession(req, res, authOptions);
    if (session?.user?.email) {
      user = await prisma.user.findUnique({ where: { email: session.user.email } });
    }
  }

  const imageId = req.query.id as string;
  if (!imageId) return res.status(400).json({ message: "Image ID required" });

  if (req.method === "POST" || req.method === "DELETE") {
    if (!user) return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "POST") {
    // Like image
    await prisma.imageLike.upsert({
      where: { userId_imageId: { userId: user!.id, imageId } },
      update: {},
      create: { userId: user!.id, imageId },
    });
    return res.status(200).json({ liked: true });
  }

  if (req.method === "DELETE") {
    // Unlike image
    await prisma.imageLike.deleteMany({
      where: { userId: user!.id, imageId },
    });
    return res.status(200).json({ liked: false });
  }

  if (req.method === "GET") {
    // Get like count and if user liked (if authenticated)
    const [count, liked] = await Promise.all([
      prisma.imageLike.count({ where: { imageId } }),
      user
        ? prisma.imageLike.findUnique({ where: { userId_imageId: { userId: user.id, imageId } } })
        : Promise.resolve(null),
    ]);
    return res.status(200).json({ count, liked: !!liked });
  }

  res.status(405).end();
}
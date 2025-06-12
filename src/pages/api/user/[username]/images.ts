import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 8;

  if (!username) {
    return res.status(400).json({ message: "Username is required" });
  }

  const user = await prisma.user.findUnique({
    where: { username: String(username) },
    select: { id: true },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const total = await prisma.image.count({ where: { userId: user.id } });
  const totalPages = Math.ceil(total / limit);

  const images = await prisma.image.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    select: {
      id: true,
      title: true,
      description: true,
      url: true,
      createdAt: true,
    },
  });

  res.status(200).json({
    images,
    page,
    totalPages,
  });
}
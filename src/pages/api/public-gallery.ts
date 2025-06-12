import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "12", 10);
  const skip = (page - 1) * limit;

  const [images, total] = await Promise.all([
    prisma.image.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, email: true, username: true, avatar: true },
        },
      },
    }),
    prisma.image.count(),
  ]);

  res.status(200).json({
    images,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
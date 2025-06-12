import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import { rateLimit } from "@/utils/rateLimit";

const prisma = new PrismaClient();

const updateRateLimitStore: Record<string, { count: number; reset: number }> = {};
const UPDATE_LIMIT = 20; // max updates per hour per user
const UPDATE_WINDOW = 60 * 60 * 1000; // 1 hour

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Rate limit per user
  const { limited, wait } = rateLimit(updateRateLimitStore, session.user.email, UPDATE_LIMIT, UPDATE_WINDOW);
  if (limited) {
    return res.status(429).json({ message: `Too many updates. Try again in ${wait} seconds.` });
  }

  let { id, title, description } = req.body;

  // Sanitize
  id = typeof id === "string" ? id.trim() : "";
  title = typeof title === "string" ? title.trim() : "";
  description = typeof description === "string" ? description.trim() : "";

  // Validate
  if (!id || !title || !description) {
    return res.status(400).json({ message: "Missing fields" });
  }
  if (title.length > 100) {
    return res.status(400).json({ message: "Title must be 100 characters or less" });
  }
  if (description.length > 500) {
    return res.status(400).json({ message: "Description must be 500 characters or less" });
  }

  // Check ownership
  const image = await prisma.image.findUnique({ where: { id } });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!image || !user || image.userId !== user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await prisma.image.update({
    where: { id },
    data: { title, description },
  });

  res.status(200).json({ message: "Image updated" });
}
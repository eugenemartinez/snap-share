import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import formidable, { File } from "formidable";
import fs from "fs";
import path from "path";
import { rateLimit } from "@/utils/rateLimit";

export const config = {
  api: {
    bodyParser: false,
  },
};

const prisma = new PrismaClient();

const profileRateLimitStore: Record<string, { count: number; reset: number }> = {};
const PROFILE_LIMIT = 10; // max profile updates per hour
const PROFILE_WINDOW = 60 * 60 * 1000; // 1 hour

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const userEmail = session.user.email!;

  if (req.method === "GET") {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { email: true, username: true, avatar: true, bio: true }, // <-- add username here
    });
    return res.status(200).json(user);
  }

  if (req.method === "POST") {
    // Rate limit profile updates per user
    const { limited, wait } = rateLimit(profileRateLimitStore, userEmail, PROFILE_LIMIT, PROFILE_WINDOW);
    if (limited) {
      return res.status(429).json({ message: `Too many profile updates. Try again in ${wait} seconds.` });
    }

    const form = formidable({ multiples: false, maxFileSize: 2 * 1024 * 1024 }); // 2MB max
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ message: "Upload error" });

      // Sanitize and validate bio
      const bio = fields.bio ? String(fields.bio).trim() : undefined;
      if (bio && bio.length > 300) {
        return res.status(400).json({ message: "Bio must be 300 characters or less" });
      }

      // Handle avatar upload
      let avatarPath = undefined;
      const file = files.avatar as File | File[] | undefined;
      const avatarFile = Array.isArray(file) ? file[0] : file;

      if (avatarFile && avatarFile.filepath) {
        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!allowedTypes.includes(avatarFile.mimetype || "")) {
          return res.status(400).json({ message: "Avatar must be an image file (jpg, png, gif, webp)" });
        }
        // Validate file size (already enforced by formidable, but double-check)
        if (avatarFile.size && avatarFile.size > 2 * 1024 * 1024) {
          return res.status(400).json({ message: "Avatar must be 2MB or less" });
        }
        const uploadDir = path.join(process.cwd(), "public", "avatars");
        fs.mkdirSync(uploadDir, { recursive: true });
        const fileName = `${userEmail}-avatar${path.extname(avatarFile.originalFilename || "")}`;
        const filePath = path.join(uploadDir, fileName);
        fs.renameSync(avatarFile.filepath, filePath);
        avatarPath = `/avatars/${fileName}`;
      }

      // Update user
      const updated = await prisma.user.update({
        where: { email: userEmail },
        data: {
          ...(bio !== undefined ? { bio } : {}),
          ...(avatarPath ? { avatar: avatarPath } : {}),
        },
        select: { email: true, username: true, avatar: true, bio: true }, // <-- add username here too
      });

      return res.status(200).json(updated);
    });
    return;
  }

  res.status(405).json({ message: "Method not allowed" });
}
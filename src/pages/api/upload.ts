import type { NextApiRequest, NextApiResponse } from "next";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";
import formidable from "formidable";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import { rateLimit } from "@/utils/rateLimit";
import sharp from "sharp";

export const config = {
  api: {
    bodyParser: false,
  },
};

const prisma = new PrismaClient();

const uploadRateLimitStore: Record<string, { count: number; reset: number }> = {};
const UPLOAD_LIMIT = 20; // max uploads per hour per user
const UPLOAD_WINDOW = 60 * 60 * 1000; // 1 hour

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const userEmail = session.user.email;

  // Rate limit uploads per user
  const { limited, wait } = rateLimit(uploadRateLimitStore, userEmail, UPLOAD_LIMIT, UPLOAD_WINDOW);
  if (limited) {
    return res.status(429).json({ message: `Too many uploads. Try again in ${wait} seconds.` });
  }

  // Enforce image limit
  const imageCount = await prisma.image.count();
  if (imageCount >= 300) {
    return res.status(403).json({ message: "Image limit reached. No more uploads allowed." });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });

  const form = formidable({ multiples: false, uploadDir, keepExtensions: true });

  form.parse(req, async (err, fields: Record<string, unknown>, files) => {
    if (err) return res.status(500).json({ message: "Upload error" });

    // Sanitize and validate fields
    const title =
      typeof fields.title === "string"
        ? fields.title.trim()
        : Array.isArray(fields.title) && typeof fields.title[0] === "string"
          ? fields.title[0].trim()
          : "";

    const description =
      typeof fields.description === "string"
        ? fields.description.trim()
        : Array.isArray(fields.description) && typeof fields.description[0] === "string"
          ? fields.description[0].trim()
          : "";

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }
    if (title.length > 100) {
      return res.status(400).json({ message: "Title must be 100 characters or less" });
    }
    if (description.length > 500) {
      return res.status(400).json({ message: "Description must be 500 characters or less" });
    }

    let file = files.image as formidable.File | formidable.File[];
    if (Array.isArray(file)) file = file[0];
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    // File size check (5MB = 5 * 1024 * 1024 bytes)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      fs.unlinkSync(file.filepath);
      return res.status(400).json({ message: "File is too large. Max size is 5MB." });
    }

    // --- Sharp compression step ---
    const compressedPath = file.filepath + "-compressed.jpg";
    await sharp(file.filepath)
      .resize({ width: 1600 }) 
      .jpeg({ quality: 80 }) 
      .toFile(compressedPath);

    let imageUrl: string;

    if (process.env.USE_BLOB_STORAGE === "true") {
      // Vercel Blob upload to snap_share/ folder
      const fileName = `snap_share/${file.originalFilename || "image.jpg"}`;
      const stream = fs.createReadStream(compressedPath);
      const blob = await put(fileName, stream, {
        access: "public",
      });
      imageUrl = blob.url;
      fs.unlinkSync(file.filepath);
      fs.unlinkSync(compressedPath);
    } else {
      // Local upload
      const localPath = path.join("/uploads", path.basename(compressedPath));
      fs.renameSync(compressedPath, path.join(process.cwd(), "public", localPath));
      imageUrl = localPath;
      // Optionally clean up original file
      fs.unlinkSync(file.filepath);
    }

    // Save metadata to DB
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) return res.status(401).json({ message: "User not found" });

    const createdImage = await prisma.image.create({
      data: {
        title: String(title),
        description: String(description),
        url: imageUrl,
        userId: user.id,
      },
    });

    res.status(201).json({ id: createdImage.id, url: imageUrl });
  });
}
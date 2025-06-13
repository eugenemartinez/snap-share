import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { rateLimit } from "@/utils/rateLimit";
import { del as blobDel } from "@vercel/blob"; // <-- Import Vercel Blob delete

const prisma = new PrismaClient();

const rateLimitStore: Record<string, { count: number; reset: number }> = {};
const LIMIT = 10; // max deletes per window
const WINDOW = 60 * 60 * 1000; // 1 hour in ms

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "DELETE") return res.status(405).end();

    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userEmail = session.user.email;

    // Use the utility
    const { limited, wait } = rateLimit(rateLimitStore, userEmail, LIMIT, WINDOW);
    if (limited) {
      return res.status(429).json({ message: `Rate limit exceeded. Try again in ${wait} seconds.` });
    }

    let { id } = req.body;
    id = typeof id === "string" ? id.trim() : "";
    if (!id) return res.status(400).json({ message: "Image ID required" });

    // Find the image and check ownership
    const image = await prisma.image.findUnique({ where: { id } });
    if (!image) return res.status(404).json({ message: "Image not found" });

    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user || image.userId !== user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Delete the file from storage
    if (typeof image.url === "string" && image.url) {
      try {
        if (process.env.USE_BLOB_STORAGE === "true") {
          // Vercel Blob: extract the blob path from the URL
          const url = new URL(image.url);
          const blobPath = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
          await blobDel(blobPath);
        } else {
          // Local: remove from public/uploads
          const filePath = path.join(process.cwd(), "public", image.url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      } catch (fileErr) {
        console.error("Failed to delete file:", fileErr);
      }
    }

    // Delete from DB
    await prisma.image.delete({ where: { id } });

    res.status(200).json({ message: "Image deleted" });
  } catch (err) {
    console.error("Delete image error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
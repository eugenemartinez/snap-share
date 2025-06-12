import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { rateLimit } from "@/utils/rateLimit";

const prisma = new PrismaClient();

const rateLimitStore: Record<string, { count: number; reset: number }> = {};
const LIMIT = 5; // max registrations per window per IP
const WINDOW = 60 * 60 * 1000; // 1 hour in ms

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username: string) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

function isStrongPassword(password: string) {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // --- Rate limiting by IP ---
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket?.remoteAddress || "unknown";
  const { limited, wait } = rateLimit(rateLimitStore, ip, LIMIT, WINDOW);
  if (limited) {
    return res.status(429).json({ message: `Too many registrations. Try again in ${wait} seconds.` });
  }

  const { email, username, password } = req.body;

  // Basic sanitation
  if (
    typeof email !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({ message: "Invalid input types" });
  }

  // Trim and sanitize
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim();

  // Validation
  if (!cleanEmail || !cleanUsername || !password) {
    return res.status(400).json({ message: "Email, username, and password are required" });
  }
  if (!isValidEmail(cleanEmail)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  if (!isValidUsername(cleanUsername)) {
    return res.status(400).json({ message: "Username must be 3-20 characters, letters, numbers, or underscores" });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
    });
  }

  // Enforce user limit
  const userCount = await prisma.user.count();
  if (userCount >= 500) {
    return res.status(403).json({ message: "User limit reached. No more registrations allowed." });
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: cleanEmail }, { username: cleanUsername }],
    },
  });
  if (existingUser) {
    return res.status(409).json({ message: "Email or username already exists" });
  }

  const hashedPassword = await hash(password, 10);

  const user = await prisma.user.create({
    data: { email: cleanEmail, username: cleanUsername, password: hashedPassword },
  });

  return res.status(201).json({ id: user.id, email: user.email, username: user.username });
}
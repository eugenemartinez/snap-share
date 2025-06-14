import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const useBlobStorage = process.env.USE_BLOB_STORAGE === "true";
const blobBaseUrl = process.env.BLOB_BASE_URL;

async function main() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed_db.json'), 'utf-8'));

  // Extract users and images
  const users = data.slice(0, 5);
  const images = data.find(d => d.images)?.images || [];

  // Create users
  const userRecords = [];
  for (const user of users) {
    const randomPassword = crypto.randomBytes(16).toString('hex');
    const avatarUrl = useBlobStorage
      ? `${blobBaseUrl}/snap_share/avatars/${user.avatar.replace('/avatars/', '')}`
      : user.avatar;

    const userRecord = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        username: user.username,
        password: randomPassword,
        bio: user.bio,
        avatar: avatarUrl,
        followerCount: user.followerCount
      }
    });
    userRecords.push(userRecord);
  }

  // Assign images to users in round-robin
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const owner = userRecords[i % userRecords.length];
    const imageUrl = useBlobStorage
      ? `${blobBaseUrl}/snap_share/${img.filename}`
      : `/uploads/${img.filename}`;
    await prisma.image.create({
      data: {
        title: img.title,
        description: img.description,
        url: imageUrl,
        userId: owner.id,
        likeCount: img.likeCount
      }
    });
  }
}

main()
  .then(() => {
    console.log('Database seeded!');
    prisma.$disconnect();
  })
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
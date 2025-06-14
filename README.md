# SnapShare

SnapShare is a modern fullstack image sharing platform built with Next.js, Prisma, and PostgreSQL. Users can register, log in, upload images with titles and descriptions, like images, follow other users, edit or delete their uploads, and update their profile and bio. The app features a responsive UI, dark mode, and secure authentication.

## Features

- User registration and login
- Image upload with title and description
- Edit and delete your images
- Public gallery and user profile pages
- Profile editing (bio, avatar)
- Responsive design and dark mode
- Secure authentication and rate limiting
- Toast notifications and error handling
- **Image likes:** Like and unlike images, with visible like counts
- **Profile follow functionality:** Follow and unfollow users, with follower counts

## Getting Started

1. **Install dependencies and run the development server:**
    ```bash
    npm install
    npm run dev
    ```

2. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

3. **(Optional) Run database migrations:**
    ```bash
    npx prisma migrate dev
    ```

4. **(Optional) Seed the database:**
    ```bash
    node scripts/seed_db.js
    ```
    or, if using TypeScript:
    ```bash
    npx tsx scripts/seed_db.ts
    ```

## Seeding Prerequisites & Notes

- **Image and Avatar Preparation:**  
  The seed script only creates database records; it does **not** upload or copy image files.  
  - Place your image files (e.g., `image1.jpg` to `image50.jpg`) in `public/uploads` if using local storage.
  - Place your avatar files (e.g., `avatar1.jpg` to `avatar5.jpg`) in `public/avatars` if using local storage.
  - If using Vercel Blob storage, manually upload your images to the correct blob paths (e.g., `snap_share/image1.jpg`, `snap_share/avatars/avatar1.jpg`).

- **Seeding Process:**  
  The seeding script reads user and image metadata from `scripts/seed_db.json` and inserts them into the database.  
  - Users are created with randomized passwords for security.
  - Images are assigned to users in a round-robin fashion.
  - The script does **not** handle file uploads; it assumes files are already in the correct location.

- **You must prepare all required images and avatars in the correct folders or blob storage before running the seed script.**  
  If the files are missing, the seeded records will reference images that do not exist.

## Tech Stack

- Next.js
- Prisma ORM
- PostgreSQL
- Tailwind CSS
- NextAuth.js (authentication)
- Vercel Blob or local storage (configurable)

## Storage Configuration

- **Local:** Images are stored in `public/uploads` and avatars in `public/avatars`.
- **Vercel Blob:** Set `USE_BLOB_STORAGE=true` and configure `BLOB_BASE_URL` in your environment variables.

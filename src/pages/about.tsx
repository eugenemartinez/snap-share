import Navbar from "@/components/Navbar";

export default function About() {
  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto mt-12 px-4">
        <h1 className="text-3xl font-bold mb-4">About SnapShare</h1>
        <p className="mb-4 text-lg text-gray-300">
          SnapShare is a modern image sharing platform built with Next.js, Prisma, and Tailwind CSS.
        </p>
        <ul className="list-disc pl-6 mb-4 text-gray-400">
          <li>Upload and share your favorite images with the community.</li>
          <li>Enjoy fast, secure, and compressed uploads (max 5MB per image).</li>
          <li>Like and interact with other users&apos; galleries.</li>
          <li>Switch between light and dark mode for your preferred experience.</li>
        </ul>
        <p className="text-gray-400">
          This project is open source and built for learning, sharing, and fun. Thank you for being part of the SnapShare community!
        </p>
      </div>
    </>
  );
}
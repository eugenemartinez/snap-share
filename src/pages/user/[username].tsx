import { GetServerSideProps } from "next";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import GalleryCard, { GalleryCardHandle } from "@/components/GalleryCard";
import { PrismaClient, Image as PrismaImage } from "@prisma/client";
import { useRef, useState } from "react";
import Modal from "@/components/Modal";
import LikeButton from "@/components/LikeButton";

const prisma = new PrismaClient();

type UserProfile = {
  username: string;
  avatar?: string | null;
  bio?: string | null;
  images: PrismaImage[];
};

export default function PublicProfile({ user }: { user: UserProfile | null }) {
  const [selectedImage, setSelectedImage] = useState<PrismaImage | null>(null);
  const cardRefs = useRef<{ [id: string]: GalleryCardHandle | null }>({});

  if (!user) return <p>User not found.</p>;
  return (
    <>
      <Navbar />
      <div className="max-w-md mx-auto mt-8 p-6 border rounded bg-[var(--card)] text-[var(--card-foreground)] shadow-lg">
        <div className="flex flex-col items-center mb-4">
          <Image
            src={user.avatar || "/avatar.png"}
            alt="Avatar"
            width={96}
            height={96}
            className="rounded-full aspect-square object-cover border shadow"
          />
          <p className="mt-2 text-lg font-bold">@{user.username}</p>
        </div>
        {user.bio && <p className="mb-2 text-center">{user.bio}</p>}
      </div>

      <div className="max-w-2xl mx-auto mt-12">
        <h2 className="text-2xl font-bold mb-6 text-center">{user.username}&apos;s Gallery</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {user.images.map((img) => (
          <GalleryCard
            key={img.id}
            ref={el => { cardRefs.current[img.id] = el; }}
            image={img}
            onClick={() => setSelectedImage(img)}
          />
          ))}
        </div>
        {user.images.length === 0 && (
          <p className="mt-4 text-gray-500 text-center">No images uploaded yet.</p>
        )}
      </div>

      {/* Modal for image preview */}
      <Modal open={!!selectedImage} onClose={() => setSelectedImage(null)} size="2xl">
        {selectedImage && (
          <div>
            <Image
              src={selectedImage.url}
              alt={selectedImage.title}
              width={800}
              height={500}
              className="w-full h-auto rounded"
            />
            <div className="flex items-start justify-between mt-4 mb-2">
              <div className="min-w-0 max-w-[70%]">
                <h2 className="text-xl font-bold">{selectedImage.title}</h2>
                <p className="text-gray-700 mt-2">{selectedImage.description}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(selectedImage.createdAt).toLocaleString()}
                </p>
              </div>
              <span className="ml-2">
                <LikeButton
                  imageId={selectedImage.id}
                  onLike={() => {
                    cardRefs.current[selectedImage.id]?.refetchLikeState();
                  }}
                />
              </span>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const username = context.params?.username as string;
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      email: true,
      username: true,
      avatar: true,
      bio: true,
      images: true,
    },
  });
  return { props: { user: user ? JSON.parse(JSON.stringify(user)) : null } };
};
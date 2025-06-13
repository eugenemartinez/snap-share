import { GetServerSideProps } from "next";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import GalleryCard, { GalleryCardHandle } from "@/components/GalleryCard";
import { PrismaClient } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import Modal from "@/components/Modal";
import LikeButton from "@/components/LikeButton";
import FollowButton from "@/components/FollowButton";
import { useSession } from "next-auth/react";
import GalleryCardSkeleton from "@/components/GalleryCardSkeleton";
import Toast from "@/components/Toast";
import Button from "@/components/Button";
import Head from "next/head";

const prisma = new PrismaClient();

type UserProfile = {
  email: string;
  username: string;
  avatar?: string | null;
  bio?: string | null;
};

type ImageType = {
  id: string;
  title: string;
  description: string;
  url: string;
  createdAt: string;
};

export default function PublicProfile({
  user,
  followData,
}: {
  user: UserProfile | null;
  followData: { count: number; following: boolean };
}) {
  const { data: session } = useSession();
  const isOwnProfile = session?.user?.email === user!.email;

  const [images, setImages] = useState<ImageType[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const cardRefs = useRef<{ [id: string]: GalleryCardHandle | null }>({});

  useEffect(() => {
    setLoading(true);
    fetch(`/api/user/${user?.username}/images?page=1&limit=12`)
      .then(async (res) => {
        const data = await res.json();
        setImages(data.images || []);
        setHasMore(data.page < data.totalPages);
        setLoading(false);
      });
  }, [user?.username]);

  useEffect(() => {
    if (page === 1) return;
    setLoadingMore(true);
    fetch(`/api/user/${user?.username}/images?page=${page}&limit=12`)
      .then(async (res) => {
        const data = await res.json();
        setImages((prev) => [...prev, ...(data.images || [])]);
        setHasMore(data.page < data.totalPages);
        setLoadingMore(false);
      });
  }, [page, user?.username]);

  if (!user) return <p>User not found.</p>;
  return (
    <>
      <Head>
        <title>
          {user ? `${user.username}'s Profile | SnapShare` : "User Not Found | SnapShare"}
        </title>
        <meta
          name="description"
          content={
            user
              ? `View @${user.username}'s public profile and gallery on SnapShare.`
              : "User not found on SnapShare."
          }
        />
      </Head>
      <Navbar />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="max-w-md mx-4 sm:mx-auto mt-8 p-6 border rounded bg-[var(--card)] text-[var(--card-foreground)] shadow-lg">
        <div className="flex flex-col items-center mb-4">
          <Image
            src={user.avatar || "/avatar.png"}
            alt="Avatar"
            width={96}
            height={96}
            className="rounded-full aspect-square object-cover border shadow"
          />
          <p className="mt-2 text-lg font-bold">@{user.username}</p>
          {!isOwnProfile && (
            <div>
              <FollowButton
                username={user.username}
                initialFollowing={followData.following}
                initialCount={followData.count}
                setToast={setToast}
              />
            </div>
          )}
        </div>
        {user.bio && <p className="mb-2 text-center">{user.bio}</p>}
      </div>

      <div className="max-w-2xl mx-4 sm:mx-auto mb-4 mt-12">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {user.username}&apos;s Gallery
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {images.map((img) => (
            <GalleryCard
              key={img.id}
              ref={(el) => {
                cardRefs.current[img.id] = el;
              }}
              image={img}
              onClick={() => setSelectedImage(img)}
              setToast={setToast}
            />
          ))}
        </div>
        {hasMore && !loadingMore && (
          <div className="flex justify-center my-6">
            <Button
              onClick={() => setPage((p) => p + 1)}
              variant="primary"
              className="px-6"
              disabled={loadingMore}
              loading={loadingMore}
            >
              Load More
            </Button>
          </div>
        )}
        {loadingMore && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 mx-4 sm:mx-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <GalleryCardSkeleton key={i} />
            ))}
          </div>
        )}
        {!hasMore && images.length > 0 && (
          <p className="text-center text-gray-500 my-6">You’ve reached the end.</p>
        )}
        {images.length === 0 && !loading && (
          <p className="mt-4 text-gray-500 text-center">
            No images uploaded yet.
          </p>
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
                <p className="text-gray-700 mt-2">
                  {selectedImage.description}
                </p>
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
                  setToast={setToast}
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
      // images: true, // No longer needed
    },
  });

  // Fetch follower count and following state
  let followData = { count: 0, following: false };
  if (user) {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      `http://${context.req.headers.host}`;
    const res = await fetch(
      `${baseUrl}/api/user/${encodeURIComponent(username)}/follow`,
      {
        headers: { cookie: context.req.headers.cookie || "" },
      }
    );
    if (res.ok) {
      followData = await res.json();
    }
  }

  return {
    props: {
      user: user ? JSON.parse(JSON.stringify(user)) : null,
      followData,
    },
  };
};
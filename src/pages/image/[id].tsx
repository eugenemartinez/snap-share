import { GetServerSideProps } from "next";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { PrismaClient } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/router";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/Toast";
import LikeButton from "@/components/LikeButton";
import Link from "next/link";
import Button from "@/components/Button";
import Head from "next/head";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";

const prisma = new PrismaClient();

type ImageDetails = {
  id: string;
  title: string;
  description: string;
  url: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    username: string;
    avatar?: string | null;
  };
  likeCount: number;
  liked: boolean;
};

export default function ImagePage({ image }: { image: ImageDetails | null }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(image?.title || "");
  const [editDescription, setEditDescription] = useState(image?.description || "");
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!image) return <p>Image not found.</p>;

  const isOwner =
    session?.user?.email && image.user?.email && session.user.email === image.user.email;

  async function handleDelete() {
    setShowConfirm(true);
  }

  async function confirmDelete() {
    if (!image) return;
    setLoading(true);
    const res = await fetch("/api/delete-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: image.id }),
    });
    const data = await res.json();
    setLoading(false);
    setShowConfirm(false);
    if (res.ok) {
      setToast({ message: data.message || "Image deleted", type: "success" });
      setTimeout(() => router.push("/profile"), 1200);
    } else {
      setToast({ message: data.message || "Failed to delete image.", type: "error" });
    }
  }

  async function handleUpdate(
    e: React.FormEvent,
    id: string,
    title: string,
    description: string
  ) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/update-image", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title, description }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setToast({ message: data.message || "Image updated", type: "success" });
      setEditing(false);
      router.replace(router.asPath); // reload data
    } else {
      setToast({ message: data.message || "Failed to update image.", type: "error" });
    }
  }

  return (
    <>
      <Head>
        <title>
          {image
            ? `${image.title} by @${image.user.username} | SnapShare`
            : "Image Not Found | SnapShare"}
        </title>
        <meta
          name="description"
          content={
            image
              ? `${image.title} - ${image.description} | View this image by @${image.user.username} on SnapShare.`
              : "Image not found on SnapShare."
          }
        />
      </Head>
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="max-w-4xl w-full mx-4 md:mx-4 sm:mx-auto p-6 border rounded bg-[var(--card)] text-[var(--card-foreground)] shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Link href={`/user/${image.user.username}`} className="flex items-center gap-3 group">
              <Image
                src={image.user.avatar || "/avatar.png"}
                alt="User Avatar"
                width={40}
                height={40}
                className="rounded-full aspect-square object-cover border group-hover:ring-2 group-hover:ring-[var(--primary)] transition"
              />
              <span className="font-semibold text-lg group-hover:underline">@{image.user.username}</span>
            </Link>
          </div>
          <Image
            src={image.url}
            alt={image.title}
            width={1200}
            height={800}
            className="w-full h-auto max-h-[60vh] object-contain rounded mb-4 shadow"
            priority
          />
          <div className="flex items-start justify-between mt-4 mb-2">
            <div className="min-w-0 max-w-[70%]">
              <h2 className="text-2xl font-bold">{image.title}</h2>
              <p className="text-gray-700 mt-2">{image.description}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(image.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 ml-2">
                <LikeButton
                imageId={image.id}
                initialLiked={image.liked}
                initialCount={image.likeCount}
                setToast={setToast}
              />
              {isOwner && !editing && (
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={() => setEditing(true)}
                    disabled={loading}
                    variant="outline"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={loading}
                    variant="outline"
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
          {editing ? (
            <form
              onSubmit={e => handleUpdate(e, image.id, editTitle, editDescription)}
              className="flex flex-col gap-3 mt-4"
            >
              <input
                value={editTitle}
                aria-label="Image Title"
                onChange={e => setEditTitle(e.target.value)}
                className="border p-2 rounded"
                required
                disabled={loading}
              />
              <textarea
                value={editDescription}
                aria-label="Image Description"
                onChange={e => setEditDescription(e.target.value)}
                className="border p-2 rounded"
                required
                disabled={loading}
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  loading={loading}
                  variant="primary"
                >
                  Save
                </Button>
                <Button
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={loading}
                  variant="secondary"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Image"
        description="Are you sure you want to delete this image? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.params?.id as string;

  const image = await prisma.image.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, email: true, username: true, avatar: true },
      },
    },
  });

  if (!image) {
    return { notFound: true };
  }

  // Fetch like count and liked state
  const likeCount = await prisma.imageLike.count({ where: { imageId: id } });

  // Get user session (if using next-auth)
  let liked = false;
  const session = await getServerSession(context.req, context.res, authOptions); // adjust as needed
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (user) {
      liked = !!(await prisma.imageLike.findUnique({
        where: { userId_imageId: { userId: user.id, imageId: id } },
      }));
    }
  }

  return {
    props: {
      image: {
        ...JSON.parse(JSON.stringify(image)),
        likeCount,
        liked,
      },
    },
  };
};
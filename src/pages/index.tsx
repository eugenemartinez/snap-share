import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import { useSession } from "next-auth/react";
import GalleryCard, { GalleryCardHandle } from "@/components/GalleryCard";
import Toast from "@/components/Toast";
import GalleryCardSkeleton from "@/components/GalleryCardSkeleton";
import LikeButton from "@/components/LikeButton";
import Link from "next/link";
import Button from "@/components/Button";
import Head from "next/head";

type ImageType = {
  id: string;
  title: string;
  description: string;
  url: string;
  createdAt: string;
  user: { id: string; email: string; username: string; avatar?: string | null };
};

export default function PublicGallery() {
  const { data: session } = useSession();
  const router = useRouter();
  const [images, setImages] = useState<ImageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const cardRefs = useRef<{ [id: string]: GalleryCardHandle | null }>({});
  const [updateLoading, setUpdateLoading] = useState(false);

  // Show toast if redirected with a toast query param (e.g. after login)
  useEffect(() => {
    if (router.query.toast) {
      setToast({ message: String(router.query.toast), type: "success" });
      // Remove the toast param from the URL after showing
      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router.query.toast, router]);

  // Initial fetch
  useEffect(() => {
    fetch("/api/public-gallery?page=1&limit=12")
      .then(async res => {
        if (!res.ok) {
          const data = await res.json();
          setToast({ message: data.message || "Failed to load gallery.", type: "error" });
          setImages([]);
          setHasMore(false);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setImages(data.images || []);
        setHasMore(data.page < data.totalPages);
        setLoading(false);
      })
      .catch(() => {
        setToast({ message: "Network error loading gallery.", type: "error" });
        setImages([]);
        setHasMore(false);
        setLoading(false);
      });
  }, []);

  // Fetch more images when page changes
  useEffect(() => {
    if (page === 1) return;
    setLoadingMore(true);
    fetch(`/api/public-gallery?page=${page}&limit=12`)
      .then(async res => {
        if (!res.ok) {
          const data = await res.json();
          setToast({ message: data.message || "Failed to load more images.", type: "error" });
          setLoadingMore(false);
          return;
        }
        const data = await res.json();
        setImages(prev => [...prev, ...(data.images || [])]);
        setHasMore(page < data.totalPages);
        setLoadingMore(false);
      })
      .catch(() => {
        setToast({ message: "Network error loading more images.", type: "error" });
        setLoadingMore(false);
      });
  }, [page]);

  async function handleDelete(id: string) {
    setLoading(true);
    const res = await fetch("/api/delete-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setImages(images => images.filter(img => img.id !== id));
      setSelectedImage(null);
      setToast({ message: data.message || "Image deleted", type: "success" });
    } else {
      setToast({ message: data.message || "Failed to delete image.", type: "error" });
    }
  }

  async function handleUpdate(id: string, title: string, description: string) {
    setUpdateLoading(true);
    const res = await fetch("/api/update-image", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title, description }),
    });
    const data = await res.json();
    setUpdateLoading(false);
    if (res.ok) {
      setImages(images => images.map(img => img.id === id ? { ...img, title, description } : img));
      setEditingId(null);
      setSelectedImage(img => img && img.id === id ? { ...img, title, description } : img);
      setToast({ message: data.message || "Image updated", type: "success" });
    } else {
      setToast({ message: data.message || "Failed to update image.", type: "error" });
    }
  }

  return (
    <>
      <Head>
        <title>Home | SnapShare</title>
      </Head>
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="max-w-5xl md:mx-4 lg:mx-auto mt-8">
        <h2 className="text-2xl font-bold mb-2 mx-4 sm:mx-auto">Public Gallery</h2>
        <p className="mb-6 mx-4 sm:mx-auto text-gray-400 text-base">
          Discover and share your favorite moments with the SnapShare community!
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 mx-4 sm:mx-auto">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <GalleryCardSkeleton key={i} />)
            : images.map(img => (
                <GalleryCard
                  ref={el => { cardRefs.current[img.id] = el; }}
                  key={img.id}
                  image={img}
                  onClick={() => setSelectedImage(img)}
                  setToast={setToast}
                />
              ))}
        </div>
        {/* Load More button */}
        {hasMore && !loadingMore && !loading && (
          <div className="flex justify-center my-6">
            <Button
              onClick={() => setPage(p => p + 1)}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 mx-4 sm:mx-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <GalleryCardSkeleton key={i} />
            ))}
          </div>
        )}
        {/* End of gallery message */}
        {!hasMore && images.length > 0 && !loading && (
          <p className="text-center text-gray-500 my-6">You’ve reached the end.</p>
        )}
        {images.length === 0 && !loading && <p className="mt-4 text-gray-500">No images uploaded yet.</p>}
      </div>

      <Modal open={!!selectedImage} onClose={() => setSelectedImage(null)} size="2xl">
        {selectedImage && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Link
                href={`/user/${selectedImage.user.username}`}
                className="flex items-center gap-2 group outline-none transition"
                tabIndex={0}
                aria-label={`Go to @${selectedImage.user.username}'s profile`}
              >
                <Image
                  src={selectedImage.user.avatar || "/avatar.png"}
                  alt="User Avatar"
                  width={32}
                  height={32}
                  className="rounded-full aspect-square object-cover border group-hover:ring-2 group-hover:ring-[var(--primary)] transition"
                />
                <span className="font-semibold text-[var(--primary)] group-hover:underline">
                  @{selectedImage.user.username}
                </span>
              </Link>
            </div>
            <Image
              src={selectedImage.url}
              alt={selectedImage.title}
              width={500}
              height={300}
              className="w-full h-auto rounded mb-4"
              priority={false}
            />
            <div className="flex items-start justify-between mt-4 mb-2">
              <div className="min-w-0 max-w-[70%]">
                <h2 className="text-xl font-bold">{selectedImage.title}</h2>
                <p className="text-gray-600 mt-2">{selectedImage.description}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(selectedImage.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 ml-2">
                <LikeButton
                  imageId={selectedImage.id}
                  onLike={() => {
                    cardRefs.current[selectedImage.id]?.refetchLikeState();
                  }}
                  setToast={setToast}
                />
                {session?.user?.email === selectedImage.user.email && editingId !== selectedImage.id && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={() => {
                        setEditingId(selectedImage.id);
                        setEditTitle(selectedImage.title);
                        setEditDescription(selectedImage.description);
                      }}
                      variant="outline"
                      className="font-semibold"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => {
                        setDeleteId(selectedImage.id);
                        setShowConfirm(true);
                      }}
                      variant="outline"
                      className="font-semibold"
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {/* Edit form below the image/content, full width */}
            {editingId === selectedImage.id && (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleUpdate(selectedImage.id, editTitle, editDescription);
                }}
                className="flex flex-col gap-3 mt-4"
              >
                <input
                  value={editTitle}
                  aria-label="Edit title"
                  onChange={e => setEditTitle(e.target.value)}
                  className="border p-2 rounded"
                />
                <textarea
                  value={editDescription}
                  aria-label="Edit description"
                  onChange={e => setEditDescription(e.target.value)}
                  className="border p-2 rounded"
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    loading={updateLoading}
                    variant="primary"
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setEditingId(null)}
                    disabled={loading}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          if (deleteId) handleDelete(deleteId);
          setShowConfirm(false);
          setDeleteId(null);
        }}
        title="Delete Image"
        description="Are you sure you want to delete this image? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
}
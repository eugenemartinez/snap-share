import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Navbar, { NavbarHandle } from "@/components/Navbar";
import Image from "next/image";
import Modal from "@/components/Modal";
import GalleryCard, { GalleryCardHandle } from "@/components/GalleryCard";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/Toast";
import GalleryCardSkeleton from "@/components/GalleryCardSkeleton";
import ProfileSectionSkeleton from "@/components/ProfileSectionSkeleton";
import LikeButton from "@/components/LikeButton";
import Button from "@/components/Button";
import Head from "next/head";

type Profile = {
  email: string;
  username?: string;
  avatar?: string;
  bio?: string;
};

type ImageType = {
  id: string;
  title: string;
  description: string;
  url: string;
  createdAt: string;
  likeCount: number;
  liked: boolean;
};

export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<ImageType[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, ] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cardRefs = useRef<{ [id: string]: GalleryCardHandle | null }>({});
  const navbarRef = useRef<NavbarHandle>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }

    if (status === "authenticated") {
      fetch("/api/profile")
        .then(res => res.json())
        .then(data => {
          setProfile(data);
          setBio(data.bio || "");
        });

      setGalleryLoading(true);
      fetch("/api/gallery?page=1&limit=12")
        .then(async res => {
          if (!res.ok) {
            const data = await res.json();
            setToast({ message: data.message || "Failed to load gallery.", type: "error" });
            setImages([]);
            setHasMore(false);
            setGalleryLoading(false);
            return;
          }
          const data = await res.json();
          setImages(data.images || []);
          setHasMore(data.page < data.totalPages);
          setGalleryLoading(false);
        })
        .catch(() => {
          setToast({ message: "Network error loading gallery.", type: "error" });
          setImages([]);
          setHasMore(false);
          setGalleryLoading(false);
        });
    }
  }, [status, router]);

  // Fetch follower count for the logged-in user
  useEffect(() => {
    if (status === "authenticated" && profile?.username) {
      fetch(`/api/user/${encodeURIComponent(profile.username)}/follow`)
        .then(res => res.json())
        .then(data => setFollowerCount(data.count))
        .catch(() => setFollowerCount(0));
    }
  }, [status, profile?.username]);

  useEffect(() => {
    if (page === 1) return;
    setLoadingMore(true);
    fetch(`/api/gallery?page=${page}&limit=12`)
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

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const formData = new FormData();
    formData.append("bio", bio);
    if (avatar) formData.append("avatar", avatar);

    const res = await fetch("/api/profile", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setMessage("");
      setAvatar(null);
      setToast({
        message:
          process.env.NEXT_PUBLIC_USE_BLOB_STORAGE === "true"
            ? "Profile updated! Avatar changes may take a few minutes to appear."
            : "Profile updated!",
        type: "success",
      });
      navbarRef.current?.refetchAvatar();
    } else {
      setToast({ message: "Update failed.", type: "error" });
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setToast({ message: "Avatar must be a JPG, PNG, GIF, or WEBP image.", type: "error" });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setToast({ message: "Avatar must be 2MB or less.", type: "error" });
      return;
    }

    setAvatar(file);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const res = await fetch("/api/delete-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteId }),
    });
    const data = await res.json();
    if (res.ok) {
      setImages(images => images.filter(img => img.id !== deleteId));
      setSelectedImage(null);
      setToast({ message: data.message || "Image deleted", type: "success" });
    } else {
      setToast({ message: data.message || "Failed to delete image.", type: "error" });
    }
    setShowConfirm(false);
    setDeleteId(null);
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

  if (status === "loading" || status === "unauthenticated") return null;

  if (!profile) {
        return (
      <>
        <Navbar />
        <div className="max-w-md mx-4 sm:mx-auto mt-8">
          <ProfileSectionSkeleton />
        </div>
        <div className="max-w-2xl mx-auto mt-8">
          <h2 className="text-2xl font-bold mb-4 text-center">My Gallery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mx-4 sm:mx-auto">
            {Array.from({ length: 8 }).map((_, i) => (
              <GalleryCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
    <Head>
        <title>My Profile | SnapShare</title>
    </Head>
      <Navbar ref={navbarRef} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="max-w-md mx-4 sm:mx-auto mt-8 p-6 border rounded bg-[var(--card)] text-[var(--card-foreground)] shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">My Profile</h2>
        <form onSubmit={handleProfileUpdate} className="flex flex-col gap-4">
          <div className="flex flex-col items-center mb-2">
            {/* Avatar upload button */}
            <label
              className="relative group cursor-pointer"
              tabIndex={0}
              aria-label="Change avatar"
              onKeyDown={e => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
            >
              <Image
                src={
                  avatar
                    ? URL.createObjectURL(avatar)
                    : profile.avatar
                      ? `${profile.avatar}?${Date.now()}`
                      : "/avatar.png"
                }
                alt="Avatar"
                width={120}
                height={120}
                className="rounded-full aspect-square object-cover border shadow-lg transition duration-200 group-hover:brightness-75"
              />
              <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40 rounded-full text-white font-semibold text-lg">
                Change
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                tabIndex={-1}
                title="Upload avatar"
                aria-label="Upload avatar"
              />
            </label>
            <p className="mt-2 text-sm text-gray-500">{profile.email}</p>
            {/* Follower count */}
            {profile.username && (
              <p className="text-gray-500 text-sm">
                {followerCount} follower{followerCount === 1 ? "" : "s"}
              </p>
            )}
          </div>
          <label htmlFor="bio" className="font-semibold">
            Bio:
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={e => setBio(e.target.value)}
            className="border p-2 w-full mt-1 rounded"
            rows={3}
            placeholder="Tell us about yourself"
            aria-label="Bio"
          />
          <button
            type="submit"
            className="bg-[var(--primary)] text-[var(--primary-foreground)] py-2 rounded font-semibold transition-all duration-200 hover:scale-105 focus:scale-105 cursor-pointer"
          >
            Update Profile
          </button>
          {message && <p className="text-green-600">{message}</p>}
        </form>
      </div>

      <div className="max-w-2xl mx-auto mt-12">
        <h2 className="text-2xl font-bold mb-6 text-center">My Gallery</h2>
        {galleryLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mx-4 sm:mx-auto mb-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <GalleryCardSkeleton key={i} />
            ))}
          </div>
        ) : images.length === 0 && !loadingMore ? (
          <p className="mt-4 mx-4 text-gray-500 text-center">No images uploaded yet.</p>
        ) : null}
        {images.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mx-4 sm:mx-auto mb-4">
              {images.map(img => (
                <GalleryCard
                  key={img.id}
                  ref={el => { cardRefs.current[img.id] = el; }}
                  image={img}
                  onClick={() => setSelectedImage(img)}
                  setToast={setToast}
                />
              ))}
            </div>
            {/* Only show Load More after initial images are loaded */}
            {profile && images.length > 0 && hasMore && !loadingMore && (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-4 mx-4 sm:mx-auto">
                {Array.from({ length: 4 }).map((_, i) => (
                  <GalleryCardSkeleton key={i} />
                ))}
              </div>
            )}
            {!hasMore && images.length > 0 && (
              <p className="text-center text-gray-500 my-6">You’ve reached the end.</p>
            )}
          </>
        )}
      </div>

      <Modal open={!!selectedImage} onClose={() => { setSelectedImage(null); setEditingId(null); }} size="2xl">
        {selectedImage && (
          <div>
            <Image
              src={selectedImage.url}
              alt={selectedImage.title}
              width={500}
              height={300}
              className="w-full h-auto rounded mb-4"
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
                  initialLiked={selectedImage.liked}
                  initialCount={selectedImage.likeCount}
                  onLike={() => {
                    cardRefs.current[selectedImage.id]?.refetchLikeState?.();
                  }}
                  setToast={setToast}
                />
                {editingId !== selectedImage.id && (
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
        onClose={() => { setShowConfirm(false); setDeleteId(null); }}
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
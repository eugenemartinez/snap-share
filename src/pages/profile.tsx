import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Modal from "@/components/Modal";
import GalleryCard, { GalleryCardHandle } from "@/components/GalleryCard";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/Toast";
import GalleryCardSkeleton from "@/components/GalleryCardSkeleton";
import ProfileSectionSkeleton from "@/components/ProfileSectionSkeleton";
import LikeButton from "@/components/LikeButton";

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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [followerCount, setFollowerCount] = useState<number>(0); // <-- NEW
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cardRefs = useRef<{ [id: string]: GalleryCardHandle | null }>({});

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

      fetch("/api/gallery?page=1&limit=12")
        .then(async res => {
          if (!res.ok) {
            const data = await res.json();
            setToast({ message: data.message || "Failed to load gallery.", type: "error" });
            setImages([]);
            setHasMore(false);
            return;
          }
          const data = await res.json();
          setImages(data.images || []);
          setHasMore(data.page < data.totalPages);
        })
        .catch(() => {
          setToast({ message: "Network error loading gallery.", type: "error" });
          setImages([]);
          setHasMore(false);
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

  // Infinite scroll: fetch more images when page changes
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

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const currentLoader = loaderRef.current;
    const observer = new window.IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setPage(p => p + 1);
        }
      },
      { threshold: 1 }
    );
    if (currentLoader) observer.observe(currentLoader);
    return () => {
      if (currentLoader) observer.unobserve(currentLoader);
    };
  }, [hasMore, loadingMore]);

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
      setMessage("Profile updated!");
      setAvatar(null);
    } else {
      setMessage("Update failed.");
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

  function handleDelete(id: string) {
    setDeleteId(id);
    setShowConfirm(true);
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
    const res = await fetch("/api/update-image", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title, description }),
    });
    const data = await res.json();
    if (res.ok) {
      setImages(images => images.map(img => img.id === id ? { ...img, title, description } : img));
      setEditingId(null);
      setSelectedImage(img => img && img.id === id ? { ...img, title, description } : img);
      setToast({ message: data.message || "Image updated", type: "success" });
    } else {
      setToast({ message: data.message || "Failed to update image.", type: "error" });
    }
  }

  if (status === "loading" || !profile) {
    return (
      <>
        <Navbar />
        <ProfileSectionSkeleton />
        <div className="max-w-2xl mx-auto mt-8">
          <h2 className="text-2xl font-bold mb-4 text-center">My Gallery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="max-w-md mx-auto mt-8 p-6 border rounded bg-[var(--card)] text-[var(--card-foreground)] shadow-lg">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {images.map(img => (
        <GalleryCard
            key={img.id}
            ref={el => { cardRefs.current[img.id] = el; }}
            image={img}
            onClick={() => setSelectedImage(img)}
        />
        ))}
        </div>
        <div ref={loaderRef} />
        {loadingMore && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <GalleryCardSkeleton key={i} />
            ))}
          </div>
        )}
        {images.length === 0 && !loadingMore && (
          <p className="mt-4 text-gray-500 text-center">No images uploaded yet.</p>
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
              className="w-full h-auto rounded"
            />
            <div className="flex items-start justify-between mt-4 mb-2">
              <div className="min-w-0 max-w-[70%]">
                <h2 className="text-xl font-bold">{selectedImage.title}</h2>
                <p className="text-gray-600">{selectedImage.description}</p>
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
            {editingId === selectedImage.id ? (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleUpdate(selectedImage.id, editTitle, editDescription);
                }}
                className="flex flex-col gap-2 mt-4"
              >
                <input
                  value={editTitle}
                  aria-label="Edit title"
                  onChange={e => setEditTitle(e.target.value)}
                  className="border p-1"
                />
                <textarea
                  value={editDescription}
                  aria-label="Edit description"
                  onChange={e => setEditDescription(e.target.value)}
                  className="border p-1"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setEditingId(selectedImage.id);
                    setEditTitle(selectedImage.title);
                    setEditDescription(selectedImage.description);
                  }}
                  className="text-blue-500 hover:underline cursor-pointer transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(selectedImage.id)}
                  className="text-red-500 hover:underline cursor-pointer transition-colors"
                >
                  Delete
                </button>
              </div>
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
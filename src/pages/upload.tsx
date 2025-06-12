import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import Image from "next/image";

export default function Upload() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImage(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  }

  function handleRemoveImage() {
    setImage(null);
    setPreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!image) {
      setToast({ message: "Please select an image.", type: "error" });
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("image", image);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setToast({ message: "Upload successful!", type: "success" });
      setTimeout(() => router.push(`/image/${data.id}`), 1200);
    } else {
      const data = await res.json();
      setToast({ message: data.message || "Upload failed", type: "error" });
    }
  }

  return (
    <>
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="min-h-[calc(85vh-56px)] flex items-center justify-center">
        <form onSubmit={handleSubmit} className="max-w-2xl w-full flex flex-col gap-4 bg-[var(--card)] text-[var(--card-foreground)] shadow-lg rounded p-8">
          <h2 className="text-2xl font-bold mb-2 text-center">Upload Image</h2>
          {preview && (
            <div className="relative mb-2">

              <Image
                src={preview}
                alt="Preview"
                width={1200}
                height={800}
                className="w-full max-h-96 object-contain rounded border"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-3 right-3 bg-black/60 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold hover:bg-black/80 transition cursor-pointer"
                aria-label="Remove image"
              >
                &times;
              </button>
            </div>
          )}
          {!image && (
            <input
              type="file"
              accept="image/*"
              aria-label="Select image"
              onChange={handleFileChange}
              required
              className="border border-[var(--input)] bg-[var(--input)] text-[var(--foreground)] p-2 rounded"
            />
          )}
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="border border-[var(--input)] bg-[var(--input)] text-[var(--foreground)] p-2 rounded"
            disabled={loading}
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            className="border border-[var(--input)] bg-[var(--input)] text-[var(--foreground)] p-2 rounded"
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-[var(--primary)] text-[var(--primary-foreground)] py-2 rounded font-semibold transition-all duration-200 hover:scale-105 focus:scale-105 cursor-pointer"
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>
    </>
  );
}
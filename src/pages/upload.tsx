import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import Image from "next/image";
import Button from "@/components/Button";
import Head from "next/head";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function Upload() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setFileError(null);
    setImage(null);
    setPreview(null);

    if (file) {
      if (file.size > MAX_SIZE) {
        setFileError("File is too large. Max size is 5MB.");
        // Clear the file input so user can select again
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  }

  function handleRemoveImage() {
    setImage(null);
    setPreview(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!image || success) return;
    setLoading(true);
    setToast(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("image", image);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setToast({ message: "Upload successful!", type: "success" });
        setSuccess(true);
        setTimeout(() => router.push(`/image/${data.id}`), 1200);
      } else {
        const data = await res.json();
        setToast({ message: data.message || "Upload failed", type: "error" });
      }
    } catch {
      setToast({ message: "Upload failed", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <>
    <Head>
        <title>Upload | SnapShare</title>
    </Head>
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="min-h-[calc(85vh-56px)] flex items-center justify-center mx-4 sm:mx-auto">
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
                disabled={loading || success}
              >
                &times;
              </button>
            </div>
          )}
          {!image && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              aria-label="Select image"
              onChange={handleFileChange}
              required
              className="border border-[var(--input)] bg-[var(--input)] text-[var(--foreground)] p-2 rounded"
              disabled={loading || success}
            />
          )}
          {fileError && (
            <p className="text-red-500 text-sm">{fileError}</p>
          )}
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="border border-[var(--input)] bg-[var(--input)] text-[var(--foreground)] p-2 rounded"
            disabled={loading || success}
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            className="border border-[var(--input)] bg-[var(--input)] text-[var(--foreground)] p-2 rounded"
            disabled={loading || success}
          />
          <Button
            type="submit"
            loading={loading}
            success={success}
            loadingMessage="Uploading & Processing..."
            successMessage="Image Uploaded Successfully!"
            fullWidth
            disabled={!!fileError}
          >
            Upload
          </Button>
        </form>
      </div>
    </>
  );
}
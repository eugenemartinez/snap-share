import React, { useImperativeHandle, useRef, forwardRef } from "react";
import Image from "next/image";
import LikeButton from "./LikeButton";

export type GalleryCardProps = {
  image: {
    id: string;
    url: string;
    title: string;
    description: string;
    createdAt: string | Date;
    // Optionally, add user info if needed for avatar/username
  };
  onClick?: () => void;
  children?: React.ReactNode;
};

export type GalleryCardHandle = {
  refetchLikeState: () => void;
};

const GalleryCard = forwardRef<GalleryCardHandle, GalleryCardProps>(({ image, onClick, children }, ref) => {
  const likeButtonRef = useRef<{ refetch: () => void }>(null);

  useImperativeHandle(ref, () => ({
    refetchLikeState: () => {
      likeButtonRef.current?.refetch();
    },
  }));

  return (
    <div
      className="bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--border)] rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 cursor-pointer group overflow-hidden flex flex-col"
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`View image: ${image.title}`}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && onClick?.()}
    >
      <div className="overflow-hidden rounded-t-lg">
        <Image
          src={image.url}
          alt={image.title}
          width={600}
          height={320}
          className="w-full h-48 object-cover group-hover:scale-105 group-hover:brightness-90 transition-transform duration-200"
          priority={false}
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 max-w-[70%]">
            <h3 className="font-semibold text-lg truncate" title={image.title}>
              {image.title}
            </h3>
            <p
              className="text-sm text-[var(--muted-foreground,#6b7280)] mt-1 line-clamp-2 break-words"
              title={image.description}
            >
              {image.description}
            </p>
          </div>
          <span
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
            tabIndex={-1}
          >
            <LikeButton ref={likeButtonRef} imageId={image.id} />
          </span>
        </div>
        <p className="text-xs text-[var(--muted-foreground,#9ca3af)] mt-auto">
          {new Date(image.createdAt).toLocaleString()}
        </p>
        {children}
      </div>
    </div>
  );
});

GalleryCard.displayName = "GalleryCard";
export default GalleryCard;
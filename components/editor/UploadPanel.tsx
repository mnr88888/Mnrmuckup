"use client";

import { useRef } from "react";

type UploadPanelProps = {
  onImageSelect: (file: File) => void;
};

export default function UploadPanel({ onImageSelect }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-neutral-900">Upload Artwork</h2>

      <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center transition hover:border-neutral-400 hover:bg-neutral-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-neutral-400"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span className="mt-3 text-sm font-medium text-neutral-700">
          Tap to choose a file
        </span>
        <span className="mt-1 text-xs text-neutral-400">PNG, JPG or WEBP</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImageSelect(file);
          }}
        />
      </label>
    </div>
  );
}

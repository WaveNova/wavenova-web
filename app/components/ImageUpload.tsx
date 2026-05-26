"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  required?: boolean;
}

export default function ImageUpload({ value, onChange, label = "Project Image", required }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    const name = file.name.toLowerCase();
    if (file.type === "image/heic" || file.type === "image/heif" || name.endsWith(".heic") || name.endsWith(".heif")) {
      setUploading(true); setError("");
      try {
        const { default: heic2any } = await import("heic2any");
        const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 }) as Blob;
        file = new File([blob], name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" });
      } catch {
        setError("Could not convert HEIC photo. Please export as JPG from your Photos app.");
        setUploading(false); return;
      }
    }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5 MB."); return; }
    setError("");
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `projects/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("project-images").upload(path, file, { upsert: false });
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("project-images").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      {label && <label className="block text-xs font-medium text-[#6B7280] mb-1">{label}{required && " *"}</label>}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-[#D1D5DB] rounded-xl p-4 text-center hover:border-[#24B5CB] transition-colors cursor-pointer bg-white"
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Preview" className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs text-[#1F2937] font-medium truncate">{value.split("/").pop()}</p>
              <p className="text-xs text-[#24B5CB] mt-0.5">{uploading ? "Uploading…" : "Click to replace"}</p>
            </div>
          </div>
        ) : (
          <div className="py-2">
            <p className="text-sm text-[#6B7280]">{uploading ? "Uploading…" : "Click or drag & drop to upload"}</p>
            <p className="text-xs text-[#9CA3AF] mt-1">PNG, JPG, WebP · max 5 MB</p>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
      <p className="text-xs text-[#9CA3AF] mt-1">
        Or paste a URL:{" "}
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="https://…"
          className="inline border-b border-[#D1D5DB] px-1 text-xs focus:outline-none focus:border-[#24B5CB] w-48"
        />
      </p>
    </div>
  );
}

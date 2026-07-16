import { useRef, useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Upload, X, Loader2, ImagePlus, Star } from 'lucide-react';
import api from '../../lib/api';
import type { ApiResponse } from '../../types';
import { cn } from '../../lib/utils';

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  uploadUrl: string; // e.g. '/api/seller/uploads' or '/api/admin/uploads'
  maxFiles?: number;
  className?: string;
}

/**
 * Gallery-based image uploader: click or drag to pick files from the device,
 * uploads immediately, and shows fit-to-size thumbnail previews. The first
 * image is treated as the primary/cover image.
 */
export default function ImageUploader({ value, onChange, uploadUrl, maxFiles = 8, className }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (arr.length === 0) return;
    const remaining = maxFiles - value.length;
    if (remaining <= 0) return;
    const toUpload = arr.slice(0, remaining);
    setUploading(true);
    try {
      const fd = new FormData();
      toUpload.forEach((f) => fd.append('files', f));
      const res = await api.post<ApiResponse<string[]>>(uploadUrl, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange([...value, ...(res.data.data || [])]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (url: string) => onChange(value.filter((u) => u !== url));
  const makePrimary = (url: string) => onChange([url, ...value.filter((u) => u !== url)]);

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files); }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-accent/40',
          value.length >= maxFiles && 'pointer-events-none opacity-50'
        )}
      >
        {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <ImagePlus className="h-6 w-6 text-muted-foreground" />}
        <div>
          <p className="text-sm font-medium">{uploading ? 'Uploading…' : 'Click or drag images here'}</p>
          <p className="text-xs text-muted-foreground">From your gallery · JPEG, PNG, WebP · up to {maxFiles} images</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>

      {value.length > 0 && (
        <Reorder.Group axis="x" values={value} onReorder={onChange} className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          <AnimatePresence>
            {value.map((url, i) => (
              <Reorder.Item key={url} value={url} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="group relative aspect-square cursor-grab overflow-hidden rounded-lg border border-border/70 bg-muted active:cursor-grabbing">
                <img src={url} alt="" className="h-full w-full object-cover" draggable={false} />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-semibold text-primary-foreground shadow-sm">
                    <Star className="h-2.5 w-2.5 fill-current" /> Primary
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  {i !== 0 && (
                    <button type="button" onClick={() => makePrimary(url)} className="rounded-full bg-white/90 p-1.5 text-foreground hover:bg-white" title="Make primary"><Star className="h-3.5 w-3.5" /></button>
                  )}
                  <button type="button" onClick={() => remove(url)} className="rounded-full bg-white/90 p-1.5 text-destructive hover:bg-white" title="Remove"><X className="h-3.5 w-3.5" /></button>
                </div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}
      {value.length > 0 && <p className="text-xs text-muted-foreground">Drag to reorder · the first image is used as the cover photo</p>}
    </div>
  );
}

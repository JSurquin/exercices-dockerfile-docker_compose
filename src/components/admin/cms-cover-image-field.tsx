'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/components/providers/locale-provider';
import { ImageIcon, Loader2Icon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

interface CmsCoverImageFieldProps {
  value: string;
  onChange: (value: string) => void;
}

async function uploadCmsImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/admin/cms-images', {
    method: 'POST',
    body: formData,
  });

  const data = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !data.url) {
    throw new Error(data.error || 'Upload failed');
  }

  return data.url;
}

export function CmsCoverImageField({ value, onChange }: CmsCoverImageFieldProps) {
  const { messages } = useLocale();
  const t = messages.admin.cmsArticles;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      const url = await uploadCmsImage(file);
      onChange(url);
      toast.success(t.imageUploaded);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.uploadError);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>{t.coverImage}</Label>
        <p className="text-xs text-slate-400 mt-1">{t.coverImageHint}</p>
      </div>

      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-slate-600 bg-slate-900">
          <img src={value} alt="" className="w-full max-h-48 object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => onChange('')}
          >
            <Trash2Icon className="w-4 h-4 mr-1" />
            {t.removeImage}
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleUpload(file);
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-slate-600"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ImageIcon className="w-4 h-4 mr-2" />
          )}
          {uploading ? t.uploading : t.uploadImage}
        </Button>
        <span className="text-xs text-slate-400">{t.orUrl}</span>
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://..."
          className="bg-slate-800 border-slate-600 flex-1 min-w-[200px]"
        />
      </div>
    </div>
  );
}

'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/components/providers/locale-provider';
import { ImageIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

interface CmsMarkdownFieldProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  className?: string;
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

function insertAtCursor(textarea: HTMLTextAreaElement, snippet: string) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const nextValue = `${textarea.value.slice(0, start)}${snippet}${textarea.value.slice(end)}`;
  textarea.value = nextValue;
  const cursor = start + snippet.length;
  textarea.setSelectionRange(cursor, cursor);
  textarea.focus();
  return nextValue;
}

export function CmsMarkdownField({
  value,
  onChange,
  rows = 12,
  className,
}: CmsMarkdownFieldProps) {
  const { messages } = useLocale();
  const t = messages.admin.cmsArticles;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    if (!textareaRef.current) return;

    try {
      setUploading(true);
      const url = await uploadCmsImage(file);
      const alt = file.name.replace(/\.[^.]+$/, '') || 'image';
      const markdown = `\n![${alt}](${url})\n`;
      const nextValue = insertAtCursor(textareaRef.current, markdown);
      onChange(nextValue);
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
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleImageUpload(file);
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
          {uploading ? t.uploading : t.insertImage}
        </Button>
        <span className="text-xs text-slate-400">{t.insertImageHint}</span>
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className={className ?? 'bg-slate-800 border-slate-600 font-mono text-sm'}
      />
    </div>
  );
}

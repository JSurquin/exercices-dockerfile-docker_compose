'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClipboardDocumentIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface SecretValueFieldProps {
  label: string;
  value: string | null;
  emptyHint?: string;
  showLabel: string;
  hideLabel: string;
  copyLabel: string;
  copiedLabel: string;
  defaultVisible?: boolean;
}

export function SecretValueField({
  label,
  value,
  emptyHint,
  showLabel,
  hideLabel,
  copyLabel,
  copiedLabel,
  defaultVisible = true,
}: SecretValueFieldProps) {
  const [visible, setVisible] = useState(defaultVisible);
  const [copied, setCopied] = useState(false);

  if (!value) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      </div>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(copiedLabel);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(copyLabel);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input readOnly type={visible ? 'text' : 'password'} value={value} className="font-mono text-xs" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
        >
          {visible ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={() => void copy()} aria-label={copyLabel}>
          <ClipboardDocumentIcon className={`w-4 h-4 ${copied ? 'text-green-600' : ''}`} />
        </Button>
      </div>
    </div>
  );
}

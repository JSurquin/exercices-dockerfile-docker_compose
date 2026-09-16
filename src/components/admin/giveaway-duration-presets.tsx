'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GIVEAWAY_DURATION_PRESETS, type GiveawayDurationPresetId } from '@/lib/admin-constants';
import { isKnownDurationPreset } from '@/lib/giveaway-duration-presets';

export interface GiveawayDurationPresetLabels {
  minutes60: string;
  hours12: string;
  days1: string;
  days3: string;
  weeks1: string;
  months1: string;
  custom: string;
}

interface GiveawayDurationPresetsProps {
  id?: string;
  value: number;
  onChange: (minutes: number) => void;
  labels: GiveawayDurationPresetLabels;
  durationLabel: string;
  durationHelp: string;
}

export function GiveawayDurationPresets({
  id = 'duration',
  value,
  onChange,
  labels,
  durationLabel,
  durationHelp,
}: GiveawayDurationPresetsProps) {
  const isCustom = !isKnownDurationPreset(value);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{durationLabel}</Label>
      <div className="flex flex-wrap gap-2">
        {GIVEAWAY_DURATION_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            size="sm"
            variant={value === preset.minutes ? 'default' : 'outline'}
            onClick={() => onChange(preset.minutes)}
          >
            {labels[preset.id as GiveawayDurationPresetId]}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant={isCustom ? 'default' : 'outline'}
          onClick={() => {
            const input = document.getElementById(id);
            if (input instanceof HTMLInputElement) input.focus();
          }}
        >
          {labels.custom}
        </Button>
      </div>
      <Input
        id={id}
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 1)}
      />
      <p className="text-xs text-muted-foreground">{durationHelp}</p>
    </div>
  );
}

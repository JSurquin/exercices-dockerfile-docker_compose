'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

export type AdminUserOption = {
  id: string;
  username: string;
  steamId64: string;
  avatar: string;
};

type AdminUserComboboxProps = {
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function AdminUserCombobox({
  value,
  onChange,
  placeholder = 'Rechercher un utilisateur…',
  disabled = false,
}: AdminUserComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [users, setUsers] = useState<AdminUserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AdminUserOption | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: '1',
      limit: '20',
    });
    if (debouncedQuery) params.set('search', debouncedQuery);

    setLoading(true);
    void fetch(`/api/admin/users?${params}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('users fetch failed');
        const data = await res.json();
        const next: AdminUserOption[] = (data.users ?? []).map((user: AdminUserOption) => ({
          id: user.id,
          username: user.username,
          steamId64: user.steamId64,
          avatar: user.avatar,
        }));
        setUsers(next);
        if (value) {
          const match = next.find((user) => user.id === value);
          if (match) setSelected(match);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setUsers([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [open, debouncedQuery, value]);

  useEffect(() => {
    if (!value) setSelected(null);
  }, [value]);

  const label = selected?.username || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>{label}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement…
              </div>
            ) : (
              <>
                <CommandEmpty>Aucun utilisateur trouvé.</CommandEmpty>
                <CommandGroup>
                  {users.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.id}
                      onSelect={() => {
                        setSelected(user);
                        onChange(user.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'h-4 w-4',
                          value === user.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="min-w-0">
                        <p className="truncate">{user.username}</p>
                        {user.steamId64 && user.steamId64 !== 'N/A' && (
                          <p className="truncate text-xs text-muted-foreground">{user.steamId64}</p>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

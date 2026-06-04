'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '~/lib/auth-client';
import { useAuth } from '@/components/providers/auth-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ChatBubbleLeftRightIcon,
  ArrowLeftOnRectangleIcon,
  HomeIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { adminBtnOutline, adminGlassCard } from '@/lib/admin-ui';
import { cn } from '@/lib/utils';

export function ModerationHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { logout } = useAuth();
  const { messages } = useLocale();
  const user = session?.user;
  const isConversationPage = pathname.startsWith('/moderation/conversations/');

  return (
    <header className="admin-glass-header sticky top-0 z-40 border-b">
      <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/moderation"
            className="flex items-center gap-2 min-w-0 text-foreground hover:text-theme-highlight transition-colors"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 shrink-0 text-theme-accent" />
            <span className="font-semibold text-sm sm:text-base truncate">
              {messages.moderation.title}
            </span>
          </Link>
          {isConversationPage && (
            <Link
              href="/moderation"
              className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
            >
              ← {messages.moderation.conversation.notFound.backButton}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {user?.role === 'ADMIN' && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className={cn('hidden sm:inline-flex h-8 text-xs', adminBtnOutline)}
            >
              <Link href="/admin/chat">
                <ShieldCheckIcon className="h-3.5 w-3.5 mr-1.5" />
                Admin
              </Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2 hover:bg-theme-accent/10 text-muted-foreground"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={(user as { image?: string })?.image} />
                  <AvatarFallback className="bg-muted text-foreground text-xs">
                    {user?.name?.[0] || user?.email?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={cn('w-52', adminGlassCard, 'border p-1')}>
              <DropdownMenuLabel className="text-foreground">
                <p className="font-medium truncate">{user?.name || user?.email}</p>
                <p className="text-xs text-muted-foreground font-normal truncate">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem asChild className="text-foreground focus:bg-theme-accent/10 focus:text-theme-highlight">
                <Link href="/">
                  <HomeIcon className="h-4 w-4 mr-2" />
                  Accueil
                </Link>
              </DropdownMenuItem>
              {user?.role === 'ADMIN' && (
                <DropdownMenuItem asChild className="text-foreground focus:bg-theme-accent/10 focus:text-theme-highlight sm:hidden">
                  <Link href="/admin/chat">
                    <ShieldCheckIcon className="h-4 w-4 mr-2" />
                    Admin
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => logout()}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <ArrowLeftOnRectangleIcon className="h-4 w-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

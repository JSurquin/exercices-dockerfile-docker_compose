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

export function ModerationHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { logout } = useAuth();
  const { messages } = useLocale();
  const user = session?.user;
  const isConversationPage = pathname.startsWith('/moderation/conversations/');

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/moderation"
            className="flex items-center gap-2 min-w-0 text-white hover:text-orange-400 transition-colors"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 shrink-0 text-orange-500" />
            <span className="font-semibold text-sm sm:text-base truncate">
              {messages.moderation.title}
            </span>
          </Link>
          {isConversationPage && (
            <Link
              href="/moderation"
              className="hidden sm:inline-flex text-xs text-slate-400 hover:text-white transition-colors ml-1"
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
              className="hidden sm:inline-flex border-slate-700 text-slate-300 hover:text-white h-8 text-xs"
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
                className="h-9 px-2 hover:bg-slate-800 text-slate-300"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={(user as { image?: string })?.image} />
                  <AvatarFallback className="bg-slate-700 text-white text-xs">
                    {user?.name?.[0] || user?.email?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-slate-900 border-slate-700">
              <DropdownMenuLabel className="text-slate-300">
                <p className="font-medium truncate">{user?.name || user?.email}</p>
                <p className="text-xs text-slate-500 font-normal truncate">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem asChild className="text-slate-300 focus:bg-slate-800 focus:text-white">
                <Link href="/">
                  <HomeIcon className="h-4 w-4 mr-2" />
                  Accueil
                </Link>
              </DropdownMenuItem>
              {user?.role === 'ADMIN' && (
                <DropdownMenuItem asChild className="text-slate-300 focus:bg-slate-800 focus:text-white sm:hidden">
                  <Link href="/admin/chat">
                    <ShieldCheckIcon className="h-4 w-4 mr-2" />
                    Admin
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => logout()}
                className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
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

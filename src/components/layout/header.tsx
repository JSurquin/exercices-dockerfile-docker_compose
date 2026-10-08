"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { ThemeSelector } from "@/components/ui/theme-selector";
import { CurrencySelector } from "@/components/ui/currency-selector";
import { NavPreferencesMenu } from "@/components/layout/nav-preferences-menu";
import { NavWallet } from "@/components/layout/nav-wallet";
import {
  HomeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  GiftIcon,
  QuestionMarkCircleIcon,
  Bars3Icon,
  LanguageIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  SparklesIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { Locale, locales } from "@/lib/i18n";
import { useSession } from "~/lib/auth-client";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { UserRoleBadge } from "@/components/ui/user-role-badge";
import { cn } from "@/lib/utils";
import { SteamBrandIcon } from "@/components/ui/social-brand-icons";

type NavItem = {
  id: string;
  name: string;
  href: string;
  icon: typeof HomeIcon;
  tourId: string;
};

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function DesktopNavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = isActivePath(pathname, item.href);
  return (
    <Link
      href={item.href}
      data-tour={item.tourId}
      className={cn(
        "group relative flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap text-[11px] font-medium transition-all duration-200 min-[1440px]:gap-2 min-[1440px]:text-xs",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <item.icon
        className={cn(
          "hidden h-4 w-4 shrink-0 transition-colors min-[1440px]:block",
          isActive ? "lunar-nav-link-active" : "group-hover:text-foreground/80"
        )}
      />
      <span className="whitespace-nowrap">{item.name}</span>
      <div
        className={cn(
          "absolute -bottom-[21px] left-0 right-0 h-0.5 lunar-nav-active-indicator transition-transform duration-200",
          isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        )}
      />
    </Link>
  );
}

export function Header() {
  const { user, loginWithSteam, loginWithDiscord, logout, isLoading } = useAuth();
  const { locale, setLocale, messages } = useLocale();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("mobile-menu-open-change", { detail: { open: isMenuOpen } })
    );
  }, [isMenuOpen]);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        if (isMenuOpen) {
          setNavVisible(true);
          ticking = false;
          return;
        }

        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;

        setNavVisible((prev) => {
          if (currentY <= 16) return prev === true ? prev : true;
          if (delta > 8) return prev === false ? prev : false;
          if (delta < -8) return prev === true ? prev : true;
          return prev;
        });

        lastScrollY.current = currentY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMenuOpen]);
  const { data: session } = useSession();

  const { data: notificationsData } = useQuery({
    queryKey: queryKeys.userNotifications,
    queryFn: async () => {
      const response = await fetch("/api/user/notifications?limit=1&unreadOnly=true");
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const unreadCount = notificationsData?.unreadCount ?? 0;

  const effectiveRole = user?.role ?? session?.user?.role;
  const isAdmin = effectiveRole === "ADMIN";
  const showAffiliateNav =
    user?.canAccessAffiliateDashboard === true ||
    (user?.canAccessAffiliateDashboard === undefined &&
      effectiveRole === "AFFILIATE");
  const isAffiliateBadge = showAffiliateNav;
  const isModerator = effectiveRole === "MODERATOR";
  const canModerate = isModerator || isAdmin;

  const primaryNavigation: NavItem[] = [
    { id: "home", name: messages.nav.home, href: "/", icon: HomeIcon, tourId: "nav-home" },
    { id: "sell", name: messages.nav.sell, href: "/sell", icon: CurrencyDollarIcon, tourId: "nav-sell" },
    { id: "dashboard", name: messages.nav.dashboard, href: "/dashboard", icon: ChartBarIcon, tourId: "nav-dashboard" },
    { id: "giveaways", name: messages.nav.giveaways, href: "/giveaways", icon: GiftIcon, tourId: "nav-giveaways" },
    { id: "missions", name: messages.nav.missions, href: "/missions", icon: SparklesIcon, tourId: "nav-missions" },
    ...(showAffiliateNav
      ? [{ id: "affiliate", name: messages.nav.affiliation, href: "/affiliate", icon: UserCircleIcon, tourId: "nav-affiliate" }]
      : []),
  ];

  const supportNavigation: NavItem = {
    id: "support",
    name: messages.nav.support,
    href: "/help",
    icon: QuestionMarkCircleIcon,
    tourId: "nav-support",
  };

  const desktopNavigation: NavItem[] = [...primaryNavigation, supportNavigation];

  const sheetNavigation: NavItem[] = [
    ...primaryNavigation,
    ...(canModerate
      ? [{ id: "moderation", name: messages.nav.moderation, href: "/moderation", icon: ChatBubbleLeftRightIcon, tourId: "nav-moderation" }]
      : []),
    supportNavigation,
  ];

  const handleSteamLogin = async () => {
    try {
      await loginWithSteam();
    } catch (error) {
      console.error("Steam login failed:", error);
    }
  };

  const handleDiscordLogin = async () => {
    try {
      await loginWithDiscord();
    } catch (error) {
      console.error("Discord login failed:", error);
    }
  };

  const walletChip = user ? <NavWallet /> : null;

  const notificationsButton = user ? (
    <Link href="/notifications" className="shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="nav-chrome nav-hover-fill relative h-9 w-9 shrink-0 shadow-none transition-none hover:bg-transparent hover:text-foreground focus-visible:ring-0"
      >
        <BellIcon className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-theme-accent text-white text-[10px] border-2 border-background"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
        <span className="sr-only">{messages.ui.notifications}</span>
      </Button>
    </Link>
  ) : null;

  return (
    <header
      className={cn(
        "lunar-nav sticky top-0 z-[100] w-full overflow-visible transition-transform duration-100 ease-out",
        navVisible ? "translate-y-0 shadow-sm" : "-translate-y-full pointer-events-none"
      )}
    >
      <div className="container mx-auto flex h-16 min-w-0 w-full items-center gap-2 px-4 sm:px-6 lg:gap-3 lg:px-8">
        <Link href="/" className="flex min-w-0 shrink-0 items-center space-x-2 sm:space-x-3">
          <div className="relative group">
            <div className="h-10 w-10 shrink-0 rounded-lg">
              <Image src="/images/logo.webp" alt="MoonSkin" width={40} height={40} />
            </div>
          </div>
          <div className="hidden min-[400px]:flex flex-col">
            <span className="text-gaming-title whitespace-nowrap text-xl text-chrome-gradient">
              MoonSkin
            </span>
          </div>
        </Link>

        <nav className="hidden min-w-0 min-[1100px]:flex flex-1 items-center justify-start pl-1 min-[1440px]:pl-2">
          <div className="flex min-w-0 items-center gap-1.5 min-[1440px]:gap-2.5 min-[1512px]:gap-3">
            {desktopNavigation.map((item) => (
              <DesktopNavLink key={item.id} item={item} pathname={pathname} />
            ))}
          </div>
        </nav>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-1 sm:gap-1">
          <span className="hidden min-[1100px]:contents">
            <NavPreferencesMenu className="nav-chrome nav-hover-fill shadow-none transition-none hover:bg-transparent hover:text-foreground focus-visible:ring-0" />
          </span>

          {user ? (
            <div className="flex h-9 shrink-0 items-center justify-end gap-1" data-slot="header-auth">
              {walletChip}
              {notificationsButton}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 shrink-0 rounded-full"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback>
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="profile-dropdown w-56 z-[9999]" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium leading-none">{user.username}</p>
                        {isAffiliateBadge && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 border border-purple-500/40 px-1.5 py-0.5 text-[10px] font-semibold text-purple-400 leading-none">
                            <UserCircleIcon className="h-2.5 w-2.5" />
                            {messages.nav.affiliateBadge}
                          </span>
                        )}
                        <UserRoleBadge userTag={user.userTag} />
                        {isAdmin && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-theme-accent/20 border border-theme-accent/40 px-1.5 py-0.5 text-[10px] font-semibold text-theme-highlight leading-none">
                            {messages.nav.adminSection}
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-none text-muted-foreground">
                        {messages.user.level} {user.level} • {user.xp} {messages.user.xp}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={isAdmin ? "/admin/dashboard" : "/dashboard"}>{messages.nav.dashboard}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/payout" className="flex items-center">
                      <BanknotesIcon className="h-4 w-4 mr-2" />
                      {messages.nav.withdrawFunds}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/kyc" className="flex items-center">
                      <ShieldCheckIcon className="h-4 w-4 mr-2" />
                      {messages.nav.kycVerification}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={isAdmin ? "/admin/settings" : "/settings"}>{messages.nav.settings}</Link>
                  </DropdownMenuItem>
                  {canModerate && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        {messages.nav.adminSection}
                      </DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href="/moderation" data-tour="nav-moderation" className="flex items-center">
                          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                          {messages.nav.moderation}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    {messages.nav.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden min-[1100px]:flex h-9 shrink-0 items-center justify-end gap-2" data-slot="header-auth">
              <Button
                onClick={handleSteamLogin}
                disabled={isLoading}
                variant="cta"
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex items-center space-x-2">
                  <SteamBrandIcon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{messages.common.steamLogin}</span>
                </div>
              </Button>
              <Button
                onClick={handleDiscordLogin}
                disabled={isLoading}
                variant="outline"
                className="border-[#5865F2] text-[#5865F2] hover:bg-[#5865F2] hover:text-white"
              >
                <svg className="h-4 w-4 mr-2 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Discord
              </Button>
            </div>
          )}

          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 min-[1100px]:hidden">
                <Bars3Icon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] overflow-y-auto z-[200]">
              <div className="relative z-[1] flex flex-col space-y-3 sm:space-y-4 px-4 pt-12 pb-8">
                {user ? (
                  <div className="flex items-center space-x-3 p-4 border rounded-lg">
                    <Avatar>
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback>
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-muted-foreground">
                        {messages.user.level} {user.level} • {user.xp} {messages.user.xp}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      onClick={handleSteamLogin}
                      disabled={isLoading}
                      variant="cta"
                      className="w-full"
                    >
                      <UserCircleIcon className="mr-2 h-4 w-4" />
                      {isLoading ? messages.common.loading : messages.common.steamLogin}
                    </Button>
                    <Button
                      onClick={handleDiscordLogin}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full border-[#5865F2] text-[#5865F2] hover:bg-[#5865F2] hover:text-white"
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                      Discord
                    </Button>
                  </div>
                )}

                <nav className="flex flex-col space-y-2">
                  {sheetNavigation.map((item) => {
                    const isActive = isActivePath(pathname, item.href);
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center space-x-3 p-3 text-sm font-medium rounded-md transition-colors ${
                          isActive
                            ? "bg-white/[0.06] text-[#e8e8f0] border-l-2 border-[#c0c0c0]"
                            : "hover:bg-accent"
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${isActive ? "text-[#c0c0c0]" : ""}`} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>

                {user && (
                  <div className="border-t pt-3 flex flex-col space-y-1">
                    <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      {messages.nav.myAccount}
                    </p>
                    <Link
                      href={isAdmin ? "/admin/dashboard" : "/dashboard"}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 p-3 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                    >
                      <ChartBarIcon className="h-5 w-5" />
                      <span>{messages.nav.dashboard}</span>
                    </Link>
                    <Link
                      href="/notifications"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between space-x-3 p-3 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <BellIcon className="h-5 w-5" />
                        <span>{messages.ui.notifications}</span>
                      </div>
                      {unreadCount > 0 && (
                        <Badge className="bg-theme-accent text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                      )}
                    </Link>
                    <Link
                      href="/payout"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 p-3 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                    >
                      <BanknotesIcon className="h-5 w-5" />
                      <span>{messages.nav.withdrawFunds}</span>
                    </Link>
                    <Link
                      href="/kyc"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 p-3 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                    >
                      <ShieldCheckIcon className="h-5 w-5" />
                      <span>{messages.nav.kycVerification}</span>
                    </Link>
                    <Link
                      href={isAdmin ? "/admin/settings" : "/settings"}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 p-3 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                    >
                      <UserCircleIcon className="h-5 w-5" />
                      <span>{messages.nav.settings}</span>
                    </Link>
                  </div>
                )}

                <div className="relative z-[1] border-t pt-4 space-y-2 pointer-events-auto">
                  <div className="flex items-center justify-between px-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {messages.nav.themeLabel}
                    </p>
                    <ThemeSelector menuClassName="z-[210]" />
                  </div>

                  <div className="flex items-center justify-between px-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {messages.ui.currency}
                    </p>
                    <CurrencySelector variant="ghost" size="sm" showFlag={true} menuClassName="z-[210]" />
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start">
                        <LanguageIcon className="mr-3 h-5 w-5" />
                        {messages.nav.language} ({locale.toUpperCase()})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-[210]">
                      {locales.map((loc) => (
                        <DropdownMenuItem
                          key={loc}
                          onClick={() => setLocale(loc as Locale)}
                          className={locale === loc ? "bg-accent" : ""}
                        >
                          <span className="mr-2">
                            {loc === "fr" ? "🇫🇷" : loc === "en" ? "🇺🇸" : "🇨🇳"}
                          </span>
                          {loc === "fr" ? messages.nav.localeFr : loc === "en" ? messages.nav.localeEn : messages.nav.localeZh}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {user && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600"
                      onClick={logout}
                    >
                      {messages.nav.logout}
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

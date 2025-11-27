"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useTheme } from "next-themes";
import { CurrencySelector } from "@/components/ui/currency-selector";
import {
  HomeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  GiftIcon,
  QuestionMarkCircleIcon,
  Bars3Icon,
  MoonIcon,
  SunIcon,
  LanguageIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { Locale, locales } from "@/lib/i18n";
import { CS2Logo } from "@/components/ui/cs2-icons";
import { useSession } from "~/lib/auth-client";

export function Header() {
  const { user, loginWithSteam, loginWithDiscord, logout, isLoading } = useAuth();
  const { locale, setLocale, messages } = useLocale();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {data: session} = useSession();

  const isAdmin = session?.user?.role === "ADMIN";
  const isAffiliate = session?.user?.role === "AFFILIATE";
  const isModerator = session?.user?.role === "MODERATOR";

  const navigation = [
    { name: messages.nav.home, href: "/", icon: HomeIcon },
    { name: messages.nav.sell, href: "/sell", icon: CurrencyDollarIcon },
    { name: messages.nav.dashboard, href: "/dashboard", icon: ChartBarIcon },
    { name: messages.nav.giveaways, href: "/giveaways", icon: GiftIcon },
    ...(isAffiliate ? [{ name: "Affiliation", href: "/affiliate", icon: UserCircleIcon }] : []),
    ...(isModerator || isAdmin ? [{ name: "Modération", href: "/moderation", icon: ChatBubbleLeftRightIcon }] : []),
    {
      name: messages.nav.support,
      href: "/support",
      icon: QuestionMarkCircleIcon,
    },
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex w-full justify-between h-16 items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 mr-8">
          <div className="relative group">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all duration-200 border border-orange-400/20">
              <CS2Logo className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-background animate-pulse shadow-sm"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-gaming-title text-xl bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              CashTrade
            </span>
          </div>
        </Link>

        {/* Navigation Desktop - Centered */}
        <nav className="hidden lg:flex flex-1 items-center justify-center">
          <div className="flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group relative flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                <item.icon className="h-4 w-4 group-hover:text-orange-500 transition-colors" />
                <span>{item.name}</span>
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></div>
              </Link>
            ))}
          </div>
        </nav>

        {/* Actions Desktop */}
        <div className="hidden md:flex items-center space-x-2">
          {/* Currency Selector */}
          <CurrencySelector variant="ghost" size="sm" showFlag={true} />
          
          {/* Stats Badge */}
          {/* <div className="hidden lg:flex items-center space-x-4 mr-4 px-3 py-1.5 bg-muted/50 rounded-lg border">
            <div className="flex items-center space-x-1 text-xs">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-muted-foreground">15.4k users</span>
            </div>
            <div className="text-xs text-muted-foreground">€2.4M traded</div>
          </div> */}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-orange-500/10 hover:text-orange-500"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <SunIcon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Language Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-orange-500/10 hover:text-orange-500"
              >
                <LanguageIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
              {locales.map((loc) => (
                <DropdownMenuItem
                  key={loc}
                  onClick={() => setLocale(loc as Locale)}
                  className={
                    locale === loc ? "bg-orange-500/10 text-orange-600" : ""
                  }
                >
                  <span className="mr-2">
                    {loc === "fr" ? "🇫🇷" : loc === "en" ? "🇺🇸" : "🇨🇳"}
                  </span>
                  {loc === "fr" ? "Français" : loc === "en" ? "English" : "中文"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.username} />
                    <AvatarFallback>
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.username}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {messages.user.level} {user.level} • {user.xp} {messages.user.xp}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={isAdmin ? "/admin/dashboard" : "/dashboard"}>Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={isAdmin ? "/admin/settings" : "/settings"}>{messages.nav.settings}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  {messages.nav.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleSteamLogin}
                disabled={isLoading}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{messages.common.connecting}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L8.427 13.97l-2.996-.935c-.65-.204-.658-.65.135-.962l11.708-4.517c.538-.196 1.006.128.82.665z" />
                    </svg>
                    <span>{messages.common.steamLogin}</span>
                  </div>
                )}
              </Button>
              <Button
                onClick={handleDiscordLogin}
                disabled={isLoading}
                variant="outline"
                className="border-[#5865F2] text-[#5865F2] hover:bg-[#5865F2] hover:text-white"
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Discord
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="flex md:hidden">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Bars3Icon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-3 sm:space-y-4 py-4">
                {/* User Section */}
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
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
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

                {/* Navigation */}
                <nav className="flex flex-col space-y-2">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 p-3 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </nav>

                {/* Settings */}
                <div className="border-t pt-4 space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                  >
                    {theme === "dark" ? (
                      <SunIcon className="mr-3 h-5 w-5" />
                    ) : (
                      <MoonIcon className="mr-3 h-5 w-5" />
                    )}
                    {theme === "dark" ? messages.nav.lightMode : messages.nav.darkMode}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start">
                        <LanguageIcon className="mr-3 h-5 w-5" />
                        {messages.nav.language} ({locale.toUpperCase()})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {locales.map((loc) => (
                        <DropdownMenuItem
                          key={loc}
                          onClick={() => setLocale(loc as Locale)}
                          className={locale === loc ? "bg-accent" : ""}
                        >
                          <span className="mr-2">
                            {loc === "fr" ? "🇫🇷" : loc === "en" ? "🇺🇸" : "🇨🇳"}
                          </span>
                          {loc === "fr" ? "Français" : loc === "en" ? "English" : "中文"}
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

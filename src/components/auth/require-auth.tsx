'use client';

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { LockClosedIcon } from '@heroicons/react/24/outline';

interface RequireAuthProps {
  children: ReactNode;
  title?: string;
  description?: string;
  buttonLabel?: string;
  icon?: ReactNode;
}

/**
 * Wrapper component that gates content behind authentication.
 * Shows a loading state, then a login prompt if not authenticated,
 * otherwise renders children.
 */
export function RequireAuth({
  children,
  title,
  description,
  buttonLabel,
  icon,
}: RequireAuthProps) {
  const { user, isLoading } = useAuth();
  const { messages } = useLocale();
  const resolvedTitle = title ?? messages.common.requireAuthTitle;
  const resolvedDescription = description ?? messages.common.requireAuthDescription;
  const resolvedButton = buttonLabel ?? messages.nav.login;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{messages.common.loading}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-6 sm:p-8">
            <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground">
              {icon ?? <LockClosedIcon className="w-16 h-16" />}
            </div>
            <h2 className="text-xl font-semibold mb-2">{resolvedTitle}</h2>
            <p className="text-muted-foreground mb-6">{resolvedDescription}</p>
            <Button onClick={() => (window.location.href = '/')}>
              {resolvedButton}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

interface LoginRequiredBlockProps {
  title?: string;
  description?: string;
  buttonLabel?: string;
  icon?: ReactNode;
}

/**
 * Standalone "login required" UI block — use inline in pages that
 * already have their own user check (e.g. when hooks depend on user).
 */
export function LoginRequiredBlock({
  title,
  description,
  buttonLabel,
  icon,
}: LoginRequiredBlockProps) {
  const { messages } = useLocale();
  const resolvedTitle = title ?? messages.common.requireAuthTitle;
  const resolvedDescription = description ?? messages.common.requireAuthDescription;
  const resolvedButton = buttonLabel ?? messages.nav.login;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <Card className="max-w-md mx-auto text-center">
        <CardContent className="p-6 sm:p-8">
          <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground">
            {icon ?? <LockClosedIcon className="w-16 h-16" />}
          </div>
          <h2 className="text-xl font-semibold mb-2">{resolvedTitle}</h2>
          <p className="text-muted-foreground mb-6">{resolvedDescription}</p>
          <Button onClick={() => (window.location.href = '/')}>
            {resolvedButton}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

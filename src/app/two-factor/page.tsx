"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { authClient } from "~/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, ShieldOff, KeyRound, Loader2, Settings } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";

// ─── Mode "verify" : vérification au login ─────────────────────────────────

function VerifyLoginView({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const { messages } = useLocale();
  const t = messages.twoFactorPage;
  const [otpCode, setOtpCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otpCode.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/two-factor/verify-totp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: otpCode, trustDevice }),
        credentials: "include",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(payload?.message || payload?.error || t.invalidCode);
        setOtpCode("");
        return;
      }
      // window.location.href force un rechargement HTTP complet
      // nécessaire pour que Next.js relise le cookie de session posé par Better Auth
      window.location.href = redirectTo;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-theme-accent/10">
              <KeyRound className="h-5 w-5 text-theme-accent" />
            </div>
            <div>
              <CardTitle>{t.verifyTitle}</CardTitle>
              <CardDescription>
                {t.verifyDescription}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-3">
            <Label>{t.codeLabel}</Label>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={trustDevice} onCheckedChange={setTrustDevice} />
            <Label className="text-sm text-muted-foreground">
              {t.trustDevice}
            </Label>
          </div>

          <Button
            onClick={handleVerify}
            disabled={loading || otpCode.length !== 6}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t.validateAndContinue}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Mode "manage" : activation / désactivation depuis les settings ─────────

type ManageStep = "idle" | "scan" | "done";

function ManageView() {
  const { messages } = useLocale();
  const t = messages.twoFactorPage;
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<ManageStep>("idle");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/security/2fa/status", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setTwoFactorEnabled(d.enabled ?? false))
      .catch(() => setTwoFactorEnabled(false));
  }, []);

  const clear = () => { setError(""); setMessage(""); };

  const handleEnable = async () => {
    clear();
    setLoading(true);
    try {
      const res = await fetch("/api/security/2fa/enable", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: password || undefined }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || payload.message || t.enableError);
        return;
      }
      setTotpUri(payload.totpURI || "");
      setBackupCodes(payload.backupCodes || []);
      setStep("scan");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    if (otpCode.length !== 6) return;
    clear();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/two-factor/verify-totp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: otpCode }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload?.message || payload?.error || t.verifyError);
        setOtpCode("");
        return;
      }
      setStep("done");
      setTwoFactorEnabled(true);
      setMessage(t.enabledSuccess);
      setOtpCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    clear();
    setLoading(true);
    try {
      const res = await fetch("/api/security/2fa/disable", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: password || undefined }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || payload.message || t.disableError);
        return;
      }
      setStep("idle");
      setTwoFactorEnabled(false);
      setTotpUri("");
      setBackupCodes([]);
      setPassword("");
      setMessage(t.disabledSuccess);
      // Better Auth crée une nouvelle session, rechargement pour mettre à jour les cookies
      setTimeout(() => window.location.reload(), 800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-lg px-4 py-16">
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-theme-accent/10">
              <Settings className="h-5 w-5 text-theme-accent" />
            </div>
            <div>
              <CardTitle>{t.manageTitle}</CardTitle>
              <CardDescription>
                {twoFactorEnabled
                  ? t.enabledDescription
                  : t.strengthenDescription}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {message ? (
            <Alert className="border-green-500/30 bg-green-500/10 text-green-400">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          {step === "idle" && twoFactorEnabled !== null && (
            <div className="space-y-4">
              {!twoFactorEnabled ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {t.authenticatorPrompt}
                  </p>
                  <div className="space-y-1">
                    <Label className="text-sm">
                      {t.passwordLabel}{" "}
                      <span className="text-muted-foreground">({t.passwordEmailOnly})</span>
                    </Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.passwordPlaceholder}
                      className="bg-muted/50"
                    />
                  </div>
                  <Button
                    onClick={handleEnable}
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="mr-2 h-4 w-4" />
                    )}
                    {t.enable2FA}
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                    <ShieldCheck className="h-5 w-5 flex-shrink-0 text-green-500" />
                    <p className="text-sm text-green-400">
                      {t.accountProtected}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">
                      {t.passwordOnly}{" "}
                      <span className="text-muted-foreground">({t.passwordEmailOnly})</span>
                    </Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.passwordPlaceholder}
                      className="bg-muted/50"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDisable}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldOff className="mr-2 h-4 w-4" />
                    )}
                    {t.disable2FA}
                  </Button>
                </>
              )}
            </div>
          )}

          {step === "scan" && (
            <div className="space-y-5">
              {totpUri ? (
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="mb-1 font-semibold text-sm">{t.step1Title}</p>
                  <p className="mb-4 text-xs text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: t.step1Instructions }}
                  />
                  <div className="flex justify-center">
                    <div className="rounded-xl bg-white p-3 shadow-md">
                      <QRCodeSVG
                        value={totpUri}
                        size={180}
                        bgColor="#ffffff"
                        fgColor="#0f172a"
                        level="M"
                      />
                    </div>
                  </div>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                      {t.showUri}
                    </summary>
                    <code className="mt-2 block break-all rounded bg-muted/50 p-2 text-xs">
                      {totpUri}
                    </code>
                  </details>
                </div>
              ) : null}

              {backupCodes.length > 0 ? (
                <div className="rounded-lg border border-theme-highlight/30 bg-theme-stat/10 p-4">
                  <p className="mb-1 font-semibold text-sm text-theme-highlight">
                    {t.step2Title}
                  </p>
                  <p className="mb-3 text-xs text-theme-highlight/80">
                    {t.step2Warning}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {backupCodes.map((code) => (
                      <code
                        key={code}
                        className="rounded bg-black/20 px-2 py-1.5 text-center text-xs font-mono tracking-widest text-theme-highlight"
                      >
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                <p className="font-semibold text-sm">{t.step3Title}</p>
                <p className="text-xs text-muted-foreground">
                  {t.step3Instructions}
                </p>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  onClick={handleVerifySetup}
                  disabled={loading || otpCode.length !== 6}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t.confirmActivation}
                </Button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                <ShieldCheck className="h-6 w-6 flex-shrink-0 text-green-500" />
                <div>
                  <p className="font-semibold text-sm text-green-400">{t.doneTitle}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.doneDescription}
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldOff className="mr-2 h-4 w-4" />}
                {t.disable2FA}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Wrapper principal ───────────────────────────────────────────────────────

function TwoFactorContent() {
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const { messages } = useLocale();
  const t = messages.twoFactorPage;

  const redirectTo = useMemo(() => {
    const raw = searchParams.get("redirect") || "/dashboard";
    // Autoriser uniquement les chemins relatifs pour éviter les open redirects
    if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
    return "/dashboard";
  }, [searchParams]);

  // Mode "verify" : paramètre explicite OU pas encore de session complète (login en cours)
  const isVerifyMode = searchParams.get("mode") === "verify";

  const userRole = (session?.user as { role?: string } | null)?.role;
  const isPrivilegedRole = userRole === "ADMIN" || userRole === "MODERATOR";

  if (isPrivilegedRole) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16">
        <Alert variant="destructive">
          <AlertDescription>
            {t.notAvailable}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isVerifyMode) {
    return <VerifyLoginView redirectTo={redirectTo} />;
  }

  return <ManageView />;
}

export default function TwoFactorPage() {
  const { messages } = useLocale();
  const t = messages.twoFactorPage;

  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-md px-4 py-16 text-center text-muted-foreground">
          {t.loading}
        </div>
      }
    >
      <TwoFactorContent />
    </Suspense>
  );
}

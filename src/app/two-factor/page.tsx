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

// ─── Mode "verify" : vérification au login ─────────────────────────────────

function VerifyLoginView({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
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
        setError(payload?.message || payload?.error || "Code invalide. Réessayez.");
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <KeyRound className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <CardTitle>Vérification 2FA</CardTitle>
              <CardDescription>
                Entrez le code généré par votre application Authenticator.
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
            <Label>Code à 6 chiffres</Label>
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
              Faire confiance à cet appareil (30 jours)
            </Label>
          </div>

          <Button
            onClick={handleVerify}
            disabled={loading || otpCode.length !== 6}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Valider et continuer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Mode "manage" : activation / désactivation depuis les settings ─────────

type ManageStep = "idle" | "scan" | "done";

function ManageView() {
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<ManageStep>("idle");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean | null>(null);

  // Récupérer le statut 2FA actuel
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
        setError(payload.error || payload.message || "Impossible d'activer la 2FA.");
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
        setError(payload?.message || payload?.error || "Code invalide. Vérifiez votre appli.");
        setOtpCode("");
        return;
      }
      setStep("done");
      setTwoFactorEnabled(true);
      setMessage("2FA activée avec succès !");
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
        setError(payload.error || payload.message || "Impossible de désactiver la 2FA.");
        return;
      }
      setStep("idle");
      setTwoFactorEnabled(false);
      setTotpUri("");
      setBackupCodes([]);
      setPassword("");
      setMessage("2FA désactivée.");
      // Better Auth crée une nouvelle session — rechargement pour mettre à jour les cookies
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <Settings className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <CardTitle>Authentification à deux facteurs</CardTitle>
              <CardDescription>
                {twoFactorEnabled
                  ? "La 2FA est activée sur votre compte."
                  : "Renforcez la sécurité de votre compte."}
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

          {/* ── Étape 0 : bouton activer ou désactiver ── */}
          {step === "idle" && twoFactorEnabled !== null && (
            <div className="space-y-4">
              {!twoFactorEnabled ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Associez une application Authenticator (Google Authenticator, Authy…)
                    pour sécuriser vos connexions.
                  </p>
                  {/* Mot de passe uniquement pour les comptes email — les comptes Steam n'en ont pas besoin */}
                  <div className="space-y-1">
                    <Label className="text-sm">
                      Mot de passe du compte{" "}
                      <span className="text-muted-foreground">(comptes email uniquement)</span>
                    </Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Laisser vide si compte Steam"
                      className="bg-muted/50"
                    />
                  </div>
                  <Button
                    onClick={handleEnable}
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="mr-2 h-4 w-4" />
                    )}
                    Activer la 2FA
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                    <ShieldCheck className="h-5 w-5 flex-shrink-0 text-green-500" />
                    <p className="text-sm text-green-400">
                      Votre compte est protégé par une application Authenticator.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">
                      Mot de passe{" "}
                      <span className="text-muted-foreground">(comptes email uniquement)</span>
                    </Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Laisser vide si compte Steam"
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
                    Désactiver la 2FA
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ── Étape 1 : QR code + codes de secours + confirmation ── */}
          {step === "scan" && (
            <div className="space-y-5">
              {/* QR code */}
              {totpUri ? (
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="mb-1 font-semibold text-sm">Étape 1 — Scannez ce QR code</p>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Ouvrez <strong>Google Authenticator</strong> ou <strong>Authy</strong> →
                    appuyez sur&nbsp;<strong>&ldquo;+&rdquo;</strong> →
                    &ldquo;Scanner un QR code&rdquo;.
                  </p>
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
                      Afficher l&apos;URI (si vous ne pouvez pas scanner)
                    </summary>
                    <code className="mt-2 block break-all rounded bg-muted/50 p-2 text-xs">
                      {totpUri}
                    </code>
                  </details>
                </div>
              ) : null}

              {/* Codes de secours */}
              {backupCodes.length > 0 ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                  <p className="mb-1 font-semibold text-sm text-amber-400">
                    Étape 2 — Sauvegardez vos codes de secours
                  </p>
                  <p className="mb-3 text-xs text-amber-300/80">
                    Notez-les maintenant, ils permettent de vous connecter si vous perdez
                    votre téléphone. Ils ne seront plus affichés.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {backupCodes.map((code) => (
                      <code
                        key={code}
                        className="rounded bg-black/20 px-2 py-1.5 text-center text-xs font-mono tracking-widest text-amber-200"
                      >
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Confirmation du code */}
              <div className="space-y-3">
                <p className="font-semibold text-sm">Étape 3 — Confirmez l&apos;activation</p>
                <p className="text-xs text-muted-foreground">
                  Entrez le code à 6 chiffres généré par votre appli pour valider.
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
                  Confirmer l&apos;activation
                </Button>
              </div>
            </div>
          )}

          {/* ── Étape finale : succès ── */}
          {step === "done" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                <ShieldCheck className="h-6 w-6 flex-shrink-0 text-green-500" />
                <div>
                  <p className="font-semibold text-sm text-green-400">2FA activée !</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Votre compte est maintenant protégé. À chaque connexion, votre appli
                    Authenticator vous donnera le code.
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
                Désactiver la 2FA
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

  const redirectTo = useMemo(
    () => searchParams.get("redirect") || "/dashboard",
    [searchParams],
  );

  // Mode "verify" : paramètre explicite OU pas encore de session complète (login en cours)
  const isVerifyMode = searchParams.get("mode") === "verify";

  const userRole = (session?.user as { role?: string } | null)?.role;
  const isPrivilegedRole = userRole === "ADMIN" || userRole === "MODERATOR";

  if (isPrivilegedRole) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16">
        <Alert variant="destructive">
          <AlertDescription>
            La 2FA n&apos;est pas disponible pour ce type de compte.
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
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-md px-4 py-16 text-center text-muted-foreground">
          Chargement…
        </div>
      }
    >
      <TwoFactorContent />
    </Suspense>
  );
}

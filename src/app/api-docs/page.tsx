'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ClipboardDocumentIcon,
  CodeBracketIcon,
  CubeIcon,
  EnvelopeIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useLocale } from '@/components/providers/locale-provider';
import {
  PARTNER_API_BASE_URL,
  buildPartnerEndpointCurl,
  partnerEndpointCatalog,
  partnerEndpointResponseExamples,
  partnerResponseExamples,
  partnerWebhookSignatureExample,
  type PartnerEndpointCatalogItem,
} from '@/lib/partner-api/docs-content';
import { getPartnerDocsCopy } from '@/lib/partner-api/docs-i18n';
import { cn } from '@/lib/utils';

const BASE_PATH = `${PARTNER_API_BASE_URL}/api/v1/partner`;

function ApiDocsComingSoon({
  title,
  description,
  badge,
  version,
  feature1,
  feature2,
  feature3,
}: {
  title: string;
  description: string;
  badge: string;
  version: string;
  feature1: string;
  feature2: string;
  feature3: string;
}) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center py-20"
        >
          <div className="relative mx-auto w-24 h-24 mb-8">
            <div className="absolute inset-0 bg-theme-accent/20 rounded-full animate-ping" />
            <div className="relative flex items-center justify-center w-24 h-24 bg-gradient-to-br from-theme-accent/30 to-theme-accent/10 rounded-full border border-theme-accent/30">
              <RocketLaunchIcon className="w-12 h-12 text-theme-accent" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-theme-accent to-primary bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">{description}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Badge
              variant="secondary"
              className="bg-theme-accent/10 text-theme-accent dark:bg-theme-accent/20 dark:text-theme-highlight px-4 py-1.5 text-sm"
            >
              {badge}
            </Badge>
            <Badge variant="outline" className="px-4 py-1.5 text-sm">
              {version}
            </Badge>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-3 max-w-xl mx-auto">
            {[
              { icon: CodeBracketIcon, label: feature1 },
              { icon: ShieldCheckIcon, label: feature2 },
              { icon: CubeIcon, label: feature3 },
            ].map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-muted/30"
              >
                <Icon className="w-6 h-6 text-theme-accent" />
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide',
        method === 'GET' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
        method === 'POST' && 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
        method === 'PUT' && 'bg-theme-accent/15 text-theme-accent'
      )}
    >
      {method}
    </span>
  );
}

function CopyButton({
  value,
  copyLabel,
  copiedLabel,
  className,
}: {
  value: string;
  copyLabel: string;
  copiedLabel: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

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
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        'h-7 px-2 text-xs text-muted-foreground hover:text-foreground',
        className
      )}
      onClick={() => void copy()}
      aria-label={copyLabel}
    >
      <ClipboardDocumentIcon className={cn('mr-1 h-3.5 w-3.5', copied && 'text-emerald-500')} />
      {copied ? copiedLabel : copyLabel}
    </Button>
  );
}

function CodePanel({
  code,
  copyLabel,
  copiedLabel,
}: {
  code: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/70 bg-zinc-950 text-zinc-100">
      <div className="absolute right-2 top-2 z-10">
        <CopyButton
          value={code}
          copyLabel={copyLabel}
          copiedLabel={copiedLabel}
          className="text-zinc-300 hover:text-white hover:bg-white/10"
        />
      </div>
      <pre className="overflow-x-auto p-4 pr-24 text-[13px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function EndpointBlock({
  endpoint,
  description,
  responseShape,
  requestLabel,
  responseLabel,
  copyLabel,
  copiedLabel,
}: {
  endpoint: PartnerEndpointCatalogItem;
  description: string;
  responseShape: string;
  requestLabel: string;
  responseLabel: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const curl = buildPartnerEndpointCurl(endpoint);
  const response = partnerEndpointResponseExamples[endpoint.id];

  return (
    <article id={`route-${endpoint.id}`} className="scroll-mt-28 border-b border-border/60 py-10 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <MethodBadge method={endpoint.method} />
        <code className="font-mono text-sm break-all">{endpoint.path}</code>
        <Badge variant="outline" className="font-mono text-[10px]">
          {endpoint.scope}
        </Badge>
        <span className="text-xs text-muted-foreground">{endpoint.rateLimit}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4 max-w-2xl">{description}</p>
      {endpoint.body && (
        <p className="text-xs text-muted-foreground mb-3">
          Body <code className="break-all">{endpoint.body}</code>
        </p>
      )}
      {endpoint.query && (
        <p className="text-xs text-muted-foreground mb-3">
          Query <code>{endpoint.query}</code>
        </p>
      )}
      <p className="text-xs text-muted-foreground mb-4">
        {responseLabel}: <code className="break-all">{responseShape}</code>
      </p>
      <Tabs defaultValue="request" className="w-full">
        <TabsList className="mb-3">
          <TabsTrigger value="request">{requestLabel}</TabsTrigger>
          <TabsTrigger value="response">{responseLabel}</TabsTrigger>
        </TabsList>
        <TabsContent value="request">
          <CodePanel code={curl} copyLabel={copyLabel} copiedLabel={copiedLabel} />
        </TabsContent>
        <TabsContent value="response">
          <CodePanel code={response} copyLabel={copyLabel} copiedLabel={copiedLabel} />
        </TabsContent>
      </Tabs>
    </article>
  );
}

export default function ApiDocsPage() {
  const { locale, messages } = useLocale();
  const t = messages.apiDocs;
  const copy = getPartnerDocsCopy(locale);
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/settings/api-docs-enabled')
      .then((r) => r.json())
      .then((data) => setIsEnabled(data.enabled))
      .catch(() => setIsEnabled(false));
  }, []);

  if (isEnabled === null) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-2 border-theme-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <ApiDocsComingSoon
        title={t.comingSoon.title}
        description={t.comingSoon.description}
        badge={t.comingSoon.badge}
        version={t.comingSoon.version}
        feature1={t.comingSoon.feature1}
        feature2={t.comingSoon.feature2}
        feature3={t.comingSoon.feature3}
      />
    );
  }

  const toc = [
    { href: '#start', label: t.tocStart },
    { href: '#auth', label: t.tocAuth },
    { href: '#routes', label: t.tocRoutes },
    { href: '#flow', label: t.tocFlow },
    { href: '#webhooks', label: t.tocWebhooks },
    { href: '#errors', label: t.tocErrors },
  ];

  return (
    <div className="min-h-screen">
      <div className="border-b border-border/60 bg-gradient-to-b from-muted/40 to-transparent">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-theme-accent mb-3">{t.version}</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">{t.title}</h1>
          <p className="text-muted-foreground max-w-2xl mb-6">{t.subtitle}</p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-xs">
              <span className="text-muted-foreground">{t.baseUrlLabel}</span>
              <span>{BASE_PATH}</span>
              <CopyButton value={BASE_PATH} copyLabel={t.copy} copiedLabel={t.copied} />
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">{t.settingsLink}</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="lg:hidden flex flex-wrap gap-2 mb-8">
          {toc.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-theme-accent/40 hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
          <nav className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.onThisPage}</p>
              <ul className="space-y-1 border-l border-border">
                {toc.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="block border-l-2 border-transparent -ml-px py-1 pl-4 text-sm text-muted-foreground hover:border-theme-accent hover:text-foreground"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
              <ul className="space-y-1 text-xs">
                {partnerEndpointCatalog.map((endpoint) => (
                  <li key={endpoint.id}>
                    <a
                      href={`#route-${endpoint.id}`}
                      className="flex items-center gap-2 py-1 text-muted-foreground hover:text-foreground"
                    >
                      <MethodBadge method={endpoint.method} />
                      <span className="font-mono truncate">{endpoint.path.replace('/api/v1/partner', '')}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="min-w-0">
            <section id="start" className="scroll-mt-28 space-y-8 pb-12 border-b border-border/60">
              <div>
                <h2 className="text-2xl font-semibold mb-6">{t.quickStart}</h2>
                <ol className="grid gap-4 sm:grid-cols-3">
                  {[
                    { title: t.getApiKey, body: t.getApiKeyDesc },
                    { title: t.makeCall, body: t.makeCallDesc },
                    { title: t.integrate, body: t.integrateDesc },
                  ].map((step, index) => (
                    <li key={step.title} className="rounded-2xl border border-border/70 bg-card/50 p-5">
                      <p className="text-xs font-mono text-theme-accent mb-2">0{index + 1}</p>
                      <h3 className="font-semibold mb-2">{step.title.replace(/^\d+\.\s*/, '')}</h3>
                      <p className="text-sm text-muted-foreground">{step.body}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-3">{t.prerequisitesTitle}</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    {copy.prerequisitesItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">{t.scopesTitle}</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    {copy.scopesItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="text-sm text-muted-foreground mt-3">{copy.scopesReadOnly}</p>
                </div>
              </div>
            </section>

            <section id="auth" className="scroll-mt-28 py-12 border-b border-border/60">
              <h2 className="text-2xl font-semibold mb-4">{t.authentication}</h2>
              <p className="text-sm text-muted-foreground max-w-2xl mb-4">{t.authDescription}</p>
              <CodePanel
                code="Authorization: Bearer msk_live_YOUR_KEY"
                copyLabel={t.copy}
                copiedLabel={t.copied}
              />
              <p className="text-sm text-muted-foreground mt-4">
                {t.authHostNote} <code className="font-mono text-xs">{BASE_PATH}/</code>
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-4">{t.securityWarning}</p>
            </section>

            <section id="routes" className="scroll-mt-28 py-4">
              <h2 className="text-2xl font-semibold pt-8">{t.availableEndpoints}</h2>
              <p className="text-sm text-muted-foreground mt-2 mb-2">{t.conventionTitle}</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mb-2">
                {copy.conventionItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {partnerEndpointCatalog.map((endpoint) => (
                <EndpointBlock
                  key={endpoint.id}
                  endpoint={endpoint}
                  description={copy.endpoints[endpoint.id].description}
                  responseShape={copy.endpoints[endpoint.id].response}
                  requestLabel={t.requestTab}
                  responseLabel={t.responseLabel}
                  copyLabel={t.copy}
                  copiedLabel={t.copied}
                />
              ))}
            </section>

            <section id="flow" className="scroll-mt-28 py-12 border-b border-border/60">
              <h2 className="text-2xl font-semibold mb-4">{t.flowTitle}</h2>
              <ol className="list-decimal pl-5 space-y-3 text-sm text-muted-foreground">
                {copy.flowItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </section>

            <section id="webhooks" className="scroll-mt-28 py-12 border-b border-border/60 space-y-4">
              <h2 className="text-2xl font-semibold">{t.webhooksTitle}</h2>
              <p className="text-sm text-muted-foreground">{copy.webhookIntro}</p>
              <div>
                <h3 className="font-semibold mb-2 text-sm">{t.webhookHeadersTitle}</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  {copy.webhookHeaders.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">{copy.webhookEvents}</p>
              <p className="text-sm text-muted-foreground">{copy.webhookIdempotence}</p>
              <p className="text-sm text-muted-foreground">{copy.webhookRetries}</p>
              <p className="text-sm text-muted-foreground">{copy.webhookSecretHint}</p>
              <CodePanel code={partnerResponseExamples.webhook} copyLabel={t.copy} copiedLabel={t.copied} />
              <h3 className="font-semibold text-sm">{t.webhookSignatureTitle}</h3>
              <CodePanel code={partnerWebhookSignatureExample} copyLabel={t.copy} copiedLabel={t.copied} />
            </section>

            <section id="errors" className="scroll-mt-28 py-12 space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-4">{t.errorsTitle}</h2>
                <p className="text-sm text-muted-foreground mb-4">{copy.errorIntro}</p>
                <ul className="space-y-2 text-sm">
                  {(Object.entries(copy.errorCodes) as [string, string][]).map(([code, text]) => (
                    <li key={code} className="flex flex-col sm:flex-row sm:gap-3 border-b border-border/40 py-2">
                      <code className="font-mono text-xs shrink-0 text-theme-accent">{code}</code>
                      <span className="text-muted-foreground">{text}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-4">
                  {t.errorEnvelopeLabel}: <code>{copy.errorEnvelope}</code>
                </p>
                <p className="text-sm text-muted-foreground mt-2">{copy.errorExtras}</p>
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-3">{t.rateLimits}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{t.rateLimitsDesc}</p>
                  <p className="flex justify-between text-sm border-b border-border/40 py-2">
                    <span>{t.rateLimitLabels.default}</span>
                    <span className="font-mono text-xs">100/min</span>
                  </p>
                  <p className="flex justify-between text-sm py-2">
                    <span>{t.rateLimitLabels.webhook}</span>
                    <span className="font-mono text-xs">10/min</span>
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">{t.statusCodes}</h3>
                  <ul className="text-sm space-y-2">
                    <li className="flex justify-between">
                      <span className="font-mono">200</span>
                      <span className="text-muted-foreground">{t.statusCodesLabels.success}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-mono">201</span>
                      <span className="text-muted-foreground">{t.statusCodesLabels.created}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-mono">400</span>
                      <span className="text-muted-foreground">{t.statusCodesLabels.badRequest}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-mono">401</span>
                      <span className="text-muted-foreground">{t.statusCodesLabels.unauthorized}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-mono">403</span>
                      <span className="text-muted-foreground">{t.statusCodesLabels.forbidden}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-mono">404</span>
                      <span className="text-muted-foreground">{t.statusCodesLabels.notFound}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-mono">429</span>
                      <span className="text-muted-foreground">{t.statusCodesLabels.tooManyRequests}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-mono">502</span>
                      <span className="text-muted-foreground">{t.statusCodesLabels.badGateway}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-mono">500</span>
                      <span className="text-muted-foreground">{t.statusCodesLabels.serverError}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{t.needHelp}</h3>
                  <p className="text-sm text-muted-foreground">{t.supportDesc}</p>
                </div>
                <Button variant="outline" asChild>
                  <a href={`mailto:${t.supportEmail}`}>
                    <EnvelopeIcon className="mr-2 h-4 w-4" />
                    {t.supportEmail}
                  </a>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

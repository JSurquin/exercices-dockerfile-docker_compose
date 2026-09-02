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
  PARTNER_API_SUPPORT_EMAIL,
  buildPartnerEndpointBruno,
  buildPartnerEndpointCurl,
  buildPartnerEndpointInsomnia,
  buildPartnerEndpointPostman,
  partnerBrunoEnvironment,
  partnerEndpointCatalog,
  partnerEndpointResponseExamples,
  partnerInsomniaExport,
  partnerPostmanCollection,
  partnerResponseExamples,
  type PartnerEndpointCatalogItem,
} from '@/lib/partner-api/docs-content';
import {
  buildPartnerEndpointGo,
  buildPartnerEndpointJavaScript,
  buildPartnerEndpointPhp,
  buildPartnerEndpointPython,
  partnerWebhookSignatureExamples,
} from '@/lib/partner-api/docs-snippets';
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
  label,
}: {
  code: string;
  copyLabel: string;
  copiedLabel: string;
  label?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-zinc-950 text-zinc-100">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          {label ?? 'code'}
        </span>
        <CopyButton
          value={code}
          copyLabel={copyLabel}
          copiedLabel={copiedLabel}
          className="text-zinc-300 hover:text-white hover:bg-white/10"
        />
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-zinc-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function EndpointBlock({
  endpoint,
  description,
  responseShape,
  bodyLabel,
  queryLabel,
  responseLabel,
  copyLabel,
  copiedLabel,
}: {
  endpoint: PartnerEndpointCatalogItem;
  description: string;
  responseShape: string;
  bodyLabel: string;
  queryLabel: string;
  responseLabel: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const curl = buildPartnerEndpointCurl(endpoint);
  const javascript = buildPartnerEndpointJavaScript(endpoint);
  const python = buildPartnerEndpointPython(endpoint);
  const php = buildPartnerEndpointPhp(endpoint);
  const go = buildPartnerEndpointGo(endpoint);
  const postman = buildPartnerEndpointPostman(endpoint);
  const bruno = buildPartnerEndpointBruno(endpoint);
  const insomnia = buildPartnerEndpointInsomnia(endpoint);
  const response = partnerEndpointResponseExamples[endpoint.id];

  return (
    <article id={`route-${endpoint.id}`} className="scroll-mt-28 border-b border-border/60 py-10 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <MethodBadge method={endpoint.method} />
        <code className="font-mono text-sm font-medium break-all text-foreground">{endpoint.path}</code>
        <Badge variant="outline" className="font-mono text-[10px]">
          {endpoint.scope}
        </Badge>
        <span className="text-xs text-foreground/70">{endpoint.rateLimit}</span>
      </div>
      <p className="text-[15px] leading-7 text-foreground mb-4 max-w-2xl">{description}</p>
      {endpoint.body && (
        <p className="text-sm leading-6 text-foreground mb-3">
          {bodyLabel}{' '}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px] break-all">{endpoint.body}</code>
        </p>
      )}
      {endpoint.query && (
        <p className="text-sm leading-6 text-foreground mb-3">
          {queryLabel} <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px]">{endpoint.query}</code>
        </p>
      )}
      <p className="text-sm leading-6 text-foreground/85 mb-4">
        {responseLabel}:{' '}
        <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px] break-all">{responseShape}</code>
      </p>
      <Tabs defaultValue="javascript" className="w-full">
        <TabsList className="mb-3 h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="javascript" className="flex-none">
            JavaScript
          </TabsTrigger>
          <TabsTrigger value="python" className="flex-none">
            Python
          </TabsTrigger>
          <TabsTrigger value="php" className="flex-none">
            PHP
          </TabsTrigger>
          <TabsTrigger value="go" className="flex-none">
            Go
          </TabsTrigger>
          <TabsTrigger value="curl" className="flex-none">
            cURL
          </TabsTrigger>
          <TabsTrigger value="postman" className="flex-none">
            Postman
          </TabsTrigger>
          <TabsTrigger value="bruno" className="flex-none">
            Bruno
          </TabsTrigger>
          <TabsTrigger value="insomnia" className="flex-none">
            Insomnia
          </TabsTrigger>
          <TabsTrigger value="response" className="flex-none">
            {responseLabel}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="javascript">
          <CodePanel code={javascript} label="fetch" copyLabel={copyLabel} copiedLabel={copiedLabel} />
        </TabsContent>
        <TabsContent value="python">
          <CodePanel code={python} label="requests" copyLabel={copyLabel} copiedLabel={copiedLabel} />
        </TabsContent>
        <TabsContent value="php">
          <CodePanel code={php} label="cURL" copyLabel={copyLabel} copiedLabel={copiedLabel} />
        </TabsContent>
        <TabsContent value="go">
          <CodePanel code={go} label="net/http" copyLabel={copyLabel} copiedLabel={copiedLabel} />
        </TabsContent>
        <TabsContent value="curl">
          <CodePanel code={curl} label="cURL" copyLabel={copyLabel} copiedLabel={copiedLabel} />
        </TabsContent>
        <TabsContent value="postman">
          <CodePanel code={postman} label="Postman v2.1" copyLabel={copyLabel} copiedLabel={copiedLabel} />
        </TabsContent>
        <TabsContent value="bruno">
          <CodePanel code={bruno} label=".bru" copyLabel={copyLabel} copiedLabel={copiedLabel} />
        </TabsContent>
        <TabsContent value="insomnia">
          <CodePanel code={insomnia} label="Insomnia v4" copyLabel={copyLabel} copiedLabel={copiedLabel} />
        </TabsContent>
        <TabsContent value="response">
          <CodePanel code={response} label="JSON" copyLabel={copyLabel} copiedLabel={copiedLabel} />
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
    { href: '#clients', label: t.tocClients },
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
          <p className="text-lg leading-8 text-foreground/90 max-w-2xl mb-6">{t.subtitle}</p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs">
              <span className="text-foreground/70">{t.baseUrlLabel}</span>
              <span className="font-medium text-foreground">{BASE_PATH}</span>
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
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70">{t.onThisPage}</p>
              <ul className="space-y-1 border-l border-border">
                {toc.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="block border-l-2 border-transparent -ml-px py-1 pl-4 text-sm text-foreground/80 hover:border-theme-accent hover:text-foreground"
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
                      <p className="text-[15px] leading-6 text-foreground/90">{step.body}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-3">{t.prerequisitesTitle}</h3>
                  <ul className="list-disc pl-5 space-y-2 text-[15px] leading-7 text-foreground">
                    {copy.prerequisitesItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">{t.scopesTitle}</h3>
                  <ul className="list-disc pl-5 space-y-2 text-[15px] leading-7 text-foreground">
                    {copy.scopesItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="text-[15px] leading-7 text-foreground mt-3">{copy.scopesReadOnly}</p>
                </div>
              </div>
            </section>

            <section id="auth" className="scroll-mt-28 py-12 border-b border-border/60">
              <h2 className="text-2xl font-semibold tracking-tight mb-4">{t.authentication}</h2>
              <p className="text-[15px] leading-7 text-foreground max-w-2xl mb-4">{t.authDescription}</p>
              <CodePanel
                code="Authorization: Bearer msk_live_YOUR_KEY"
                label="Header"
                copyLabel={t.copy}
                copiedLabel={t.copied}
              />
              <p className="text-[15px] leading-7 text-foreground mt-4">
                {t.authHostNote}{' '}
                <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px]">{BASE_PATH}/</code>
              </p>
              <p className="text-[15px] leading-7 font-medium text-amber-800 dark:text-amber-300 mt-4">
                {t.securityWarning}
              </p>
            </section>

            <section id="clients" className="scroll-mt-28 py-12 border-b border-border/60 space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight mb-3">{t.clientsTitle}</h2>
                <p className="text-[15px] leading-7 text-foreground max-w-2xl">{t.clientsIntro}</p>
              </div>
              <Tabs defaultValue="javascript" className="w-full">
                <TabsList className="mb-3 h-auto w-full flex-wrap justify-start gap-1">
                  <TabsTrigger value="javascript" className="flex-none">JavaScript</TabsTrigger>
                  <TabsTrigger value="python" className="flex-none">Python</TabsTrigger>
                  <TabsTrigger value="php" className="flex-none">PHP</TabsTrigger>
                  <TabsTrigger value="go" className="flex-none">Go</TabsTrigger>
                  <TabsTrigger value="curl" className="flex-none">cURL</TabsTrigger>
                </TabsList>
                <TabsContent value="javascript">
                  <CodePanel
                    code={buildPartnerEndpointJavaScript(partnerEndpointCatalog[0])}
                    label="fetch — GET /me"
                    copyLabel={t.copy}
                    copiedLabel={t.copied}
                  />
                </TabsContent>
                <TabsContent value="python">
                  <CodePanel
                    code={buildPartnerEndpointPython(partnerEndpointCatalog[0])}
                    label="requests — GET /me"
                    copyLabel={t.copy}
                    copiedLabel={t.copied}
                  />
                </TabsContent>
                <TabsContent value="php">
                  <CodePanel
                    code={buildPartnerEndpointPhp(partnerEndpointCatalog[0])}
                    label="cURL — GET /me"
                    copyLabel={t.copy}
                    copiedLabel={t.copied}
                  />
                </TabsContent>
                <TabsContent value="go">
                  <CodePanel
                    code={buildPartnerEndpointGo(partnerEndpointCatalog[0])}
                    label="net/http — GET /me"
                    copyLabel={t.copy}
                    copiedLabel={t.copied}
                  />
                </TabsContent>
                <TabsContent value="curl">
                  <CodePanel
                    code={buildPartnerEndpointCurl(partnerEndpointCatalog[0])}
                    label="cURL — GET /me"
                    copyLabel={t.copy}
                    copiedLabel={t.copied}
                  />
                </TabsContent>
              </Tabs>
              <ul className="grid gap-3 sm:grid-cols-3">
                {[t.clientsPostmanHint, t.clientsBrunoHint, t.clientsInsomniaHint].map((hint) => (
                  <li
                    key={hint}
                    className="rounded-xl border border-border bg-card p-4 text-[15px] leading-6 text-foreground"
                  >
                    {hint}
                  </li>
                ))}
              </ul>
              <Tabs defaultValue="postman" className="w-full">
                <TabsList className="mb-3 h-auto w-full flex-wrap justify-start gap-1">
                  <TabsTrigger value="postman" className="flex-none">
                    Postman
                  </TabsTrigger>
                  <TabsTrigger value="bruno" className="flex-none">
                    Bruno
                  </TabsTrigger>
                  <TabsTrigger value="insomnia" className="flex-none">
                    Insomnia
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="postman">
                  <CodePanel
                    code={partnerPostmanCollection}
                    label="Collection v2.1"
                    copyLabel={t.copy}
                    copiedLabel={t.copied}
                  />
                </TabsContent>
                <TabsContent value="bruno">
                  <CodePanel
                    code={partnerBrunoEnvironment}
                    label="environments/dev.bru"
                    copyLabel={t.copy}
                    copiedLabel={t.copied}
                  />
                </TabsContent>
                <TabsContent value="insomnia">
                  <CodePanel
                    code={partnerInsomniaExport}
                    label="Export v4"
                    copyLabel={t.copy}
                    copiedLabel={t.copied}
                  />
                </TabsContent>
              </Tabs>
            </section>

            <section id="routes" className="scroll-mt-28 py-4">
              <h2 className="text-2xl font-semibold tracking-tight pt-8">{t.availableEndpoints}</h2>
              <p className="text-[15px] leading-7 font-medium text-foreground mt-3 mb-2">{t.conventionTitle}</p>
              <ul className="list-disc pl-5 space-y-2 text-[15px] leading-7 text-foreground mb-2">
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
                  bodyLabel={t.bodyLabel}
                  queryLabel={t.queryLabel}
                  responseLabel={t.responseLabel}
                  copyLabel={t.copy}
                  copiedLabel={t.copied}
                />
              ))}
            </section>

            <section id="flow" className="scroll-mt-28 py-12 border-b border-border/60">
              <h2 className="text-2xl font-semibold tracking-tight mb-4">{t.flowTitle}</h2>
              <ol className="list-decimal pl-5 space-y-3 text-[15px] leading-7 text-foreground">
                {copy.flowItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </section>

            <section id="webhooks" className="scroll-mt-28 py-12 border-b border-border/60 space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">{t.webhooksTitle}</h2>
              <p className="text-[15px] leading-7 text-foreground">{copy.webhookIntro}</p>
              <div>
                <h3 className="font-semibold mb-2">{t.webhookHeadersTitle}</h3>
                <ul className="list-disc pl-5 space-y-2 text-[15px] leading-7 text-foreground">
                  {copy.webhookHeaders.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <p className="text-[15px] leading-7 text-foreground">{copy.webhookEvents}</p>
              <p className="text-[15px] leading-7 text-foreground">{copy.webhookIdempotence}</p>
              <p className="text-[15px] leading-7 text-foreground">{copy.webhookRetries}</p>
              <p className="text-[15px] leading-7 text-foreground">{copy.webhookSecretHint}</p>
              <CodePanel
                code={partnerResponseExamples.webhook}
                label="JSON"
                copyLabel={t.copy}
                copiedLabel={t.copied}
              />
              <h3 className="font-semibold">{t.webhookSignatureTitle}</h3>
              <Tabs defaultValue="node" className="w-full">
                <TabsList className="mb-3 h-auto w-full flex-wrap justify-start gap-1">
                  <TabsTrigger value="node" className="flex-none">Node.js</TabsTrigger>
                  <TabsTrigger value="python" className="flex-none">Python</TabsTrigger>
                  <TabsTrigger value="php" className="flex-none">PHP</TabsTrigger>
                  <TabsTrigger value="go" className="flex-none">Go</TabsTrigger>
                </TabsList>
                <TabsContent value="node">
                  <CodePanel
                    code={partnerWebhookSignatureExamples.node}
                    label="Node.js"
                    copyLabel={t.copy}
                    copiedLabel={t.copied}
                  />
                </TabsContent>
                <TabsContent value="python">
                  <CodePanel
                    code={partnerWebhookSignatureExamples.python}
                    label="Python"
                    copyLabel={t.copy}
                    copiedLabel={t.copied}
                  />
                </TabsContent>
                <TabsContent value="php">
                  <CodePanel
                    code={partnerWebhookSignatureExamples.php}
                    label="PHP"
                    copyLabel={t.copy}
                    copiedLabel={t.copied}
                  />
                </TabsContent>
                <TabsContent value="go">
                  <CodePanel
                    code={partnerWebhookSignatureExamples.go}
                    label="Go"
                    copyLabel={t.copy}
                    copiedLabel={t.copied}
                  />
                </TabsContent>
              </Tabs>
            </section>

            <section id="errors" className="scroll-mt-28 py-12 space-y-8">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight mb-4">{t.errorsTitle}</h2>
                <p className="text-[15px] leading-7 text-foreground mb-4">{copy.errorIntro}</p>
                <ul className="space-y-2 text-[15px]">
                  {(Object.entries(copy.errorCodes) as [string, string][]).map(([code, text]) => (
                    <li key={code} className="flex flex-col sm:flex-row sm:gap-3 border-b border-border/40 py-2">
                      <code className="font-mono text-xs shrink-0 text-theme-accent font-semibold">{code}</code>
                      <span className="text-foreground leading-7">{text}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm leading-6 text-foreground mt-4">
                  {t.errorEnvelopeLabel}:{' '}
                  <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px]">{copy.errorEnvelope}</code>
                </p>
                <p className="text-[15px] leading-7 text-foreground mt-2">{copy.errorExtras}</p>
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-3">{t.rateLimits}</h3>
                  <p className="text-[15px] leading-7 text-foreground mb-3">{t.rateLimitsDesc}</p>
                  <p className="flex justify-between text-[15px] border-b border-border/40 py-2">
                    <span>{t.rateLimitLabels.default}</span>
                    <span className="font-mono text-sm">100/min</span>
                  </p>
                  <p className="flex justify-between text-[15px] py-2">
                    <span>{t.rateLimitLabels.webhook}</span>
                    <span className="font-mono text-sm">10/min</span>
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">{t.statusCodes}</h3>
                  <ul className="text-[15px] space-y-2">
                    <li className="flex justify-between gap-4">
                      <span className="font-mono">200</span>
                      <span className="text-foreground">{t.statusCodesLabels.success}</span>
                    </li>
                    <li className="flex justify-between gap-4">
                      <span className="font-mono">201</span>
                      <span className="text-foreground">{t.statusCodesLabels.created}</span>
                    </li>
                    <li className="flex justify-between gap-4">
                      <span className="font-mono">400</span>
                      <span className="text-foreground">{t.statusCodesLabels.badRequest}</span>
                    </li>
                    <li className="flex justify-between gap-4">
                      <span className="font-mono">401</span>
                      <span className="text-foreground">{t.statusCodesLabels.unauthorized}</span>
                    </li>
                    <li className="flex justify-between gap-4">
                      <span className="font-mono">403</span>
                      <span className="text-foreground">{t.statusCodesLabels.forbidden}</span>
                    </li>
                    <li className="flex justify-between gap-4">
                      <span className="font-mono">404</span>
                      <span className="text-foreground">{t.statusCodesLabels.notFound}</span>
                    </li>
                    <li className="flex justify-between gap-4">
                      <span className="font-mono">429</span>
                      <span className="text-foreground">{t.statusCodesLabels.tooManyRequests}</span>
                    </li>
                    <li className="flex justify-between gap-4">
                      <span className="font-mono">503</span>
                      <span className="text-foreground">{t.statusCodesLabels.badGateway}</span>
                    </li>
                    <li className="flex justify-between gap-4">
                      <span className="font-mono">500</span>
                      <span className="text-foreground">{t.statusCodesLabels.serverError}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="rounded-2xl border border-border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{t.needHelp}</h3>
                  <p className="text-[15px] leading-7 text-foreground">{t.supportDesc}</p>
                </div>
                <Button variant="outline" asChild>
                  <a href={`mailto:${PARTNER_API_SUPPORT_EMAIL}`}>
                    <EnvelopeIcon className="mr-2 h-4 w-4" />
                    {PARTNER_API_SUPPORT_EMAIL}
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

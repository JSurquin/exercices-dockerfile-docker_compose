'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CodeBracketIcon,
  KeyIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CubeIcon,
  RocketLaunchIcon,
  EnvelopeIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useLocale } from '@/components/providers/locale-provider';
import {
  PARTNER_API_BASE_URL,
  partnerCurlExamples,
  partnerEndpointCatalog,
  partnerResponseExamples,
  partnerWebhookSignatureExample,
} from '@/lib/partner-api/docs-content';
import { getPartnerDocsCopy } from '@/lib/partner-api/docs-i18n';

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
  const className =
    method === 'GET'
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : method === 'POST'
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        : 'bg-theme-accent/10 text-theme-accent';
  return (
    <Badge variant={method === 'GET' ? 'secondary' : 'default'} className={`${className} font-mono text-xs`}>
      {method}
    </Badge>
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

  const exampleTabs = [
    { key: 'me' as const, label: t.tabLabels.me },
    { key: 'estimate' as const, label: t.tabLabels.estimate },
    { key: 'tradeDetail' as const, label: t.tabLabels.trade },
    { key: 'payout' as const, label: t.tabLabels.payout },
    { key: 'webhook' as const, label: t.tabLabels.webhook },
    { key: 'error' as const, label: t.tabLabels.error },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            <CodeBracketIcon className="w-8 h-8 inline-block mr-2 text-theme-accent" />
            {t.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">{t.subtitle}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              {t.version}
            </Badge>
            <Badge variant="outline" className="font-mono">
              {t.baseUrlLabel}: {PARTNER_API_BASE_URL}/api/v1/partner
            </Badge>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 sm:mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span>{t.quickStart}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <KeyIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">{t.getApiKey}</h3>
                  <p className="text-sm text-muted-foreground">{t.getApiKeyDesc}</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-theme-accent/15 dark:bg-theme-accent/25 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <ShieldCheckIcon className="w-6 h-6 text-theme-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">{t.makeCall}</h3>
                  <p className="text-sm text-muted-foreground">{t.makeCallDesc}</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <CodeBracketIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">{t.integrate}</h3>
                  <p className="text-sm text-muted-foreground">{t.integrateDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShieldCheckIcon className="w-5 h-5" />
                  <span>{t.authentication}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{t.authDescription}</p>
                <div className="bg-muted rounded-lg p-4">
                  <code className="text-sm">Authorization: Bearer msk_live_YOUR_KEY</code>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t.authHostNote}{' '}
                  <code className="text-xs">{PARTNER_API_BASE_URL}/api/v1/partner/</code>
                </p>
                <p className="text-sm">
                  <Link href="/settings" className="text-theme-accent underline underline-offset-2">
                    {t.settingsLink}
                  </Link>
                </p>
                <div className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-theme-highlight/25">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">{t.important}</p>
                    <p className="text-yellow-700 dark:text-yellow-300">{t.securityWarning}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.prerequisitesTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  {copy.prerequisitesItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.scopesTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  {copy.scopesItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="text-muted-foreground">{copy.scopesReadOnly}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.conventionTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  {copy.conventionItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-2xl font-semibold mb-6">{t.availableEndpoints}</h2>
              <Card>
                <CardContent className="pt-6 space-y-3">
                  {partnerEndpointCatalog.map((endpoint) => (
                    <div
                      key={`${endpoint.method}-${endpoint.path}-${endpoint.id}`}
                      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <MethodBadge method={endpoint.method} />
                        <div className="min-w-0">
                          <code className="text-sm font-mono break-all">{endpoint.path}</code>
                          <p className="text-xs text-muted-foreground mt-1">
                            {copy.endpoints[endpoint.id].description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                        <Badge variant="outline">scope: {endpoint.scope}</Badge>
                        <span>{endpoint.rateLimit}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t.endpointsTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {partnerEndpointCatalog.map((ep) => {
                  const detail = copy.endpoints[ep.id];
                  return (
                    <div key={ep.id} className="border rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <MethodBadge method={ep.method} />
                        <code className="font-mono break-all">{ep.path}</code>
                        <Badge variant="outline">
                          {t.scopeLabel}: {ep.scope}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{detail.description}</p>
                      {ep.body && (
                        <p>
                          <span className="font-medium">{t.bodyLabel} :</span>{' '}
                          <code className="text-xs break-all">{ep.body}</code>
                        </p>
                      )}
                      {ep.query && (
                        <p>
                          <span className="font-medium">{t.queryLabel} :</span>{' '}
                          <code className="text-xs">{ep.query}</code>
                        </p>
                      )}
                      <p>
                        <span className="font-medium">{t.responseLabel} :</span>{' '}
                        <code className="text-xs break-all">{detail.response}</code>
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.flowTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
                  {copy.flowItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.webhooksTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">{copy.webhookIntro}</p>
                <div>
                  <p className="font-medium mb-2">{t.webhookHeadersTitle}</p>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    {copy.webhookHeaders.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-muted-foreground">{copy.webhookEvents}</p>
                <p className="text-muted-foreground">{copy.webhookIdempotence}</p>
                <p className="text-muted-foreground">{copy.webhookRetries}</p>
                <p className="text-muted-foreground">{copy.webhookSecretHint}</p>
                <div>
                  <p className="font-medium mb-2">{t.webhookSignatureTitle}</p>
                  <pre className="text-sm overflow-x-auto bg-muted rounded-lg p-4">
                    <code>{partnerWebhookSignatureExample}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.errorsTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">{copy.errorIntro}</p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  {(Object.entries(copy.errorCodes) as [string, string][]).map(([code, text]) => (
                    <li key={code}>
                      <code className="text-xs">{code}</code> — {text}
                    </li>
                  ))}
                </ul>
                <p>
                  <span className="font-medium">{t.errorEnvelopeLabel} :</span>{' '}
                  <code className="text-xs">{copy.errorEnvelope}</code>
                </p>
                <p className="text-muted-foreground">{copy.errorExtras}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.curlTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm overflow-x-auto bg-muted rounded-lg p-4">
                  <code>{partnerCurlExamples}</code>
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.responseExamples}</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="me" className="w-full">
                  <TabsList className="flex flex-wrap h-auto gap-1">
                    {exampleTabs.map((tab) => (
                      <TabsTrigger key={tab.key} value={tab.key}>
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {exampleTabs.map((tab) => (
                    <TabsContent key={tab.key} value={tab.key} className="mt-4">
                      <pre className="text-sm overflow-x-auto bg-muted rounded-lg p-4">
                        <code>{partnerResponseExamples[tab.key]}</code>
                      </pre>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ClockIcon className="w-5 h-5" />
                  <span>{t.rateLimits}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between gap-2">
                    <span>{t.rateLimitLabels.default}</span>
                    <Badge variant="outline">100/min</Badge>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>{t.rateLimitLabels.webhook}</span>
                    <Badge variant="outline">10/min</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-3 border-t">{t.rateLimitsDesc}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.statusCodes}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>200</span>
                  <span className="text-green-600">{t.statusCodesLabels.success}</span>
                </div>
                <div className="flex justify-between">
                  <span>201</span>
                  <span className="text-green-600">{t.statusCodesLabels.created}</span>
                </div>
                <div className="flex justify-between">
                  <span>400</span>
                  <span className="text-red-600">{t.statusCodesLabels.badRequest}</span>
                </div>
                <div className="flex justify-between">
                  <span>401</span>
                  <span className="text-red-600">{t.statusCodesLabels.unauthorized}</span>
                </div>
                <div className="flex justify-between">
                  <span>403</span>
                  <span className="text-red-600">{t.statusCodesLabels.forbidden}</span>
                </div>
                <div className="flex justify-between">
                  <span>404</span>
                  <span className="text-red-600">{t.statusCodesLabels.notFound}</span>
                </div>
                <div className="flex justify-between">
                  <span>429</span>
                  <span className="text-theme-accent">{t.statusCodesLabels.tooManyRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span>502</span>
                  <span className="text-red-600">{t.statusCodesLabels.badGateway}</span>
                </div>
                <div className="flex justify-between">
                  <span>500</span>
                  <span className="text-red-600">{t.statusCodesLabels.serverError}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold mb-2">{t.needHelp}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t.supportDesc}</p>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <a href={`mailto:${t.supportEmail}`}>
                    <EnvelopeIcon className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                    {t.supportEmail}
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start mt-2" asChild>
                  <Link href="/settings">
                    <DocumentTextIcon className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                    {t.settingsLink}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

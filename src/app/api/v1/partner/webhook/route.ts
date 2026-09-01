import type { NextRequest } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { withPartnerApi } from '@/lib/partner-api/handler';
import { partnerSuccess, partnerError } from '@/lib/partner-api/response';
import { partnerWebhookConfigSchema } from '@/lib/partner-api/schemas';
import { readPartnerJsonBody, safeParsePartnerJson } from '@/lib/partner-api/validation';

export async function GET(request: NextRequest) {
  return withPartnerApi(
    request,
    { endpoint: '/api/v1/partner/webhook', method: 'GET', scopes: ['read'] },
    async (_req, ctx) => {
      const client = await prisma.apiClient.findUnique({
        where: { id: ctx.apiClientId },
        select: { webhookUrl: true },
      });

      if (!client) {
        return partnerError('NOT_FOUND', 'API key not found', 404);
      }

      return partnerSuccess({
        webhook_url: client.webhookUrl,
        signature_header: 'X-MoonSkin-Signature',
        signature_format: 't=<unix_timestamp>,v1=<hmac_sha256_hex>',
        note: 'The signing secret is shown once when the API key is created and cannot be retrieved again.',
      });
    }
  );
}

export async function PUT(request: NextRequest) {
  return withPartnerApi(
    request,
    { endpoint: '/api/v1/partner/webhook', method: 'PUT', scopes: ['read'] },
    async (req, ctx) => {
      const raw = await readPartnerJsonBody(req);
      if (!raw.ok) return raw.response;

      const parsed = safeParsePartnerJson(raw.data, partnerWebhookConfigSchema);
      if (!parsed.ok) return parsed.response;

      await prisma.apiClient.update({
        where: { id: ctx.apiClientId },
        data: { webhookUrl: parsed.data.webhook_url },
      });

      return partnerSuccess({
        webhook_url: parsed.data.webhook_url,
        message: 'Webhook URL configured',
      });
    }
  );
}

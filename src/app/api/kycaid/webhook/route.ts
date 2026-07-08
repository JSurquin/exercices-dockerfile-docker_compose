import { NextRequest, NextResponse } from 'next/server';
import {
  processWebhook,
  type KycaidWebhookPayload,
} from '@/lib/kycaid';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import {
  buildWebhookAuditBase,
  extractKycaidWebhookMeta,
  logIntegrationWebhookCall,
  type KycaidWebhookMeta,
} from '@/lib/integration-webhook-audit';

async function auditKycaidWebhookCall(
  request: NextRequest,
  baseAudit: ReturnType<typeof buildWebhookAuditBase>,
  meta: KycaidWebhookMeta,
  details: {
    outcome: Parameters<typeof logIntegrationWebhookCall>[2]['outcome'];
    httpStatus: number;
    webhookId?: string;
    errorMessage?: string;
  },
  userId?: string
) {
  await logIntegrationWebhookCall(
    'kycaid',
    request,
    {
      ...baseAudit,
      ...meta,
      eventType: meta.eventType,
      webhookId: details.webhookId,
      errorMessage: details.errorMessage,
      ...details,
    },
    userId
  );
}

async function resolveKycaidWebhookUser(payload: KycaidWebhookPayload) {
  const byApplicant = await prisma.user.findFirst({
    where: { kycaidApplicantId: payload.applicant_id },
    select: { id: true },
  });
  if (byApplicant) return byApplicant;

  if (payload.external_applicant_id) {
    return prisma.user.findUnique({
      where: { id: payload.external_applicant_id },
      select: { id: true },
    });
  }

  return null;
}

export async function POST(request: NextRequest) {
  let kycMeta: KycaidWebhookMeta = {};
  const rawBody = await request.text();
  const baseAudit = buildWebhookAuditBase(request, rawBody, false);

  try {
    let payload: KycaidWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      logger.error('[KYCAID Webhook] Invalid JSON body');
      await auditKycaidWebhookCall(request, baseAudit, {}, {
        outcome: 'invalid_json',
        httpStatus: 400,
      });
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    kycMeta = extractKycaidWebhookMeta(payload);

    if (!payload.type || !payload.applicant_id) {
      logger.error('[KYCAID Webhook] Missing required fields (type, applicant_id)');
      await auditKycaidWebhookCall(request, baseAudit, kycMeta, {
        outcome: 'invalid_payload',
        httpStatus: 400,
        errorMessage: 'Missing type or applicant_id',
      });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const webhookId = payload.request_id || payload.verification_id || `${payload.type}_${payload.applicant_id}`;
    const user = await resolveKycaidWebhookUser(payload);

    if (!user) {
      logger.warn('[KYCAID Webhook] Unknown applicant_id');
      await auditKycaidWebhookCall(request, baseAudit, kycMeta, {
        outcome: 'unknown_applicant',
        httpStatus: 404,
        webhookId,
      });
      return NextResponse.json({ error: 'Unknown applicant' }, { status: 404 });
    }

    logger.info(`[KYCAID Webhook] Received: type=${payload.type}, status=${payload.status}`);

    await processWebhook(payload);

    await auditKycaidWebhookCall(
      request,
      baseAudit,
      kycMeta,
      {
        outcome: 'processed',
        httpStatus: 200,
        webhookId,
      },
      user.id
    );

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    logger.error('[KYCAID Webhook] Error', error);
    await auditKycaidWebhookCall(request, baseAudit, kycMeta, {
      outcome: 'error',
      httpStatus: 500,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 }
    );
  }
}

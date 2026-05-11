import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { RateLimiter, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';

const VALID_CURRENCIES = ['USD', 'EUR', 'CNY'] as const;
type ValidCurrency = typeof VALID_CURRENCIES[number];

const RATE_BOUNDS: Record<string, { min: number; max: number }> = {
  'USD_EUR': { min: 0.50, max: 1.50 },
  'USD_CNY': { min: 4.00, max: 12.00 },
  'EUR_USD': { min: 0.70, max: 2.00 },
  'EUR_CNY': { min: 5.00, max: 15.00 },
  'CNY_USD': { min: 0.05, max: 0.30 },
  'CNY_EUR': { min: 0.04, max: 0.25 },
};

const rateLimiter = new RateLimiter('EXCHANGE_RATE', RATE_LIMIT_CONFIGS.API_GENERAL);

function isValidCurrency(val: unknown): val is ValidCurrency {
  return typeof val === 'string' && VALID_CURRENCIES.includes(val as ValidCurrency);
}

function isValidDate(val: unknown): val is string {
  return typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val);
}

/**
 * GET /api/exchange-rate?from=USD&to=EUR
 * Returns the most recent saved exchange rate for the given pair.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const fromCurrency = searchParams.get('from');
  const toCurrency = searchParams.get('to');

  if (!isValidCurrency(fromCurrency) || !isValidCurrency(toCurrency)) {
    return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
  }

  if (fromCurrency === toCurrency) {
    return NextResponse.json({ rate: 1.0, date: new Date().toISOString().split('T')[0], source: 'identity' });
  }

  try {
    const record = await prisma.exchangeRate.findFirst({
      where: { fromCurrency, toCurrency },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return NextResponse.json({ rate: null }, { status: 404 });
    }

    return NextResponse.json({
      rate: record.rate,
      date: record.date,
      source: record.source,
      updatedAt: record.updatedAt,
    });
  } catch (error) {
    console.error('[exchange-rate] GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * POST /api/exchange-rate
 * Persists an exchange rate. Server-internal only — validated by shared secret.
 * Client-side CurrencyConverter calls this; the secret is injected server-side
 * via the Frankfurter fetch flow, not exposed to browsers.
 */
export async function POST(request: NextRequest) {
  try {
    const rateCheck = await rateLimiter.checkLimit(request);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    const internalSecret = request.headers.get('x-internal-secret');
    if (!internalSecret || internalSecret !== process.env.EXCHANGE_RATE_INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { fromCurrency, toCurrency, rate, date } = body;

    if (!isValidCurrency(fromCurrency) || !isValidCurrency(toCurrency)) {
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
    }

    if (fromCurrency === toCurrency) {
      return NextResponse.json({ error: 'Same currency' }, { status: 400 });
    }

    if (typeof rate !== 'number' || !Number.isFinite(rate)) {
      return NextResponse.json({ error: 'Invalid rate' }, { status: 400 });
    }

    if (!isValidDate(date)) {
      return NextResponse.json({ error: 'Invalid date format (YYYY-MM-DD)' }, { status: 400 });
    }

    const pairKey = `${fromCurrency}_${toCurrency}`;
    const bounds = RATE_BOUNDS[pairKey];
    if (bounds && (rate < bounds.min || rate > bounds.max)) {
      console.warn(`[exchange-rate] Rate ${rate} out of bounds for ${pairKey} (${bounds.min}-${bounds.max})`);
      return NextResponse.json({ error: 'Rate out of acceptable range' }, { status: 400 });
    }

    await prisma.exchangeRate.upsert({
      where: {
        fromCurrency_toCurrency_date: { fromCurrency, toCurrency, date },
      },
      update: { rate, source: 'frankfurter', updatedAt: new Date() },
      create: { fromCurrency, toCurrency, rate, date, source: 'frankfurter' },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[exchange-rate] POST error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

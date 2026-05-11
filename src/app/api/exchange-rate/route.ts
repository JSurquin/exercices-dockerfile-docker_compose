import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';

/**
 * GET /api/exchange-rate?from=USD&to=EUR
 * Returns the most recent saved exchange rate for the given pair.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const fromCurrency = searchParams.get('from');
  const toCurrency = searchParams.get('to');

  if (!fromCurrency || !toCurrency) {
    return NextResponse.json({ error: 'Missing from/to params' }, { status: 400 });
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
 * Persists an exchange rate (called by the client-side CurrencyConverter).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromCurrency, toCurrency, rate, date } = body;

    if (!fromCurrency || !toCurrency || typeof rate !== 'number' || !date) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Sanity check: rate should be within a reasonable range
    if (rate <= 0 || rate > 1000) {
      return NextResponse.json({ error: 'Rate out of range' }, { status: 400 });
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

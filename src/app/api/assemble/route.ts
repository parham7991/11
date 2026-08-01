import { NextRequest, NextResponse } from 'next/server';

const ASSEMBLY_ENGINE_URL = process.env.ASSEMBLY_ENGINE_URL || 'http://147.45.43.25:20143';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { usage, budget, budgetRange } = body;

    console.log('[Assemble API] Request:', { usage, budget, budgetRange });

    // Call Assembly Engine
    const response = await fetch(`${ASSEMBLY_ENGINE_URL}/assemble`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usage,
        budget: budget,
        budgetRange: budgetRange,
      }),
    });

    if (!response.ok) {
      throw new Error(`Assembly Engine error: ${response.status}`);
    }

    const data = await response.json();

    console.log('[Assemble API] Response received:', {
      partsCount: Object.keys(data.parts || {}).length,
      hasRecommendation: !!data.recommendation,
    });

    return NextResponse.json({
      success: true,
      recommendation: data.recommendation || 'سیستم شما با موفقیت طراحی شد!',
      parts: data.parts || {},
      performance: data.performance || {
        gaming: 85,
        rendering: 75,
        productivity: 90,
        efficiency: 80,
      },
      totalPrice: data.totalPrice || 0,
      compatibility: data.compatibility || { status: 'ok', issues: [] },
    });
  } catch (error) {
    console.error('[Assemble API] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'خطا در پردازش درخواست',
        recommendation: 'متأسفانه در حال حاضر امکان پردازش درخواست وجود ندارد. لطفاً دوباره تلاش کنید.',
      },
      { status: 500 }
    );
  }
}

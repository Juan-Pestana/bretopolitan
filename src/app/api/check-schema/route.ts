import { NextResponse } from 'next/server';
import { createTables } from '@/lib/migrations';

export async function GET() {
  try {
    const result = await createTables();

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Error checking database schema',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

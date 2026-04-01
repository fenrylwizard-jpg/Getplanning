import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const count = await prisma.cookingRecipe.count();
        const first = await prisma.cookingRecipe.findFirst();
        return NextResponse.json({ count, first });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

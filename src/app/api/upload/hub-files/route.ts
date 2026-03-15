import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parsePurchases } from '@/lib/parsers/parse-purchases';
import { parseFinances } from '@/lib/parsers/parse-finances';
import { parseEtudes } from '@/lib/parsers/parse-etudes';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const projectId = formData.get('projectId') as string;
    const monthStr = formData.get('month') as string;
    const userId = formData.get('userId') as string;
    
    if (!projectId || !monthStr) {
      return NextResponse.json({ error: 'Missing projectId or month' }, { status: 400 });
    }
    
    const month = new Date(monthStr);
    
    const purchasesFile = formData.get('purchasesFile') as File | null;
    const financesFile = formData.get('financesFile') as File | null;
    const etudesFile = formData.get('etudesFile') as File | null;
    
    if (!purchasesFile && !financesFile && !etudesFile) {
      return NextResponse.json({ error: 'At least one file is required' }, { status: 400 });
    }
    
    // Create the monthly upload record
    const upload = await prisma.monthlyUpload.create({
      data: {
        projectId,
        month,
        purchasesFile: purchasesFile?.name || null,
        financesFile: financesFile?.name || null,
        etudesFile: etudesFile?.name || null,
        uploadedById: userId || null,
      },
    });
    
    const results: { purchases: number; finances: number; etudes: number } = {
      purchases: 0,
      finances: 0,
      etudes: 0,
    };
    
    // Delete previous data for this project (replace with new upload)
    await prisma.$transaction([
      prisma.purchaseCategory.deleteMany({ where: { projectId } }),
      prisma.financeSnapshot.deleteMany({ where: { projectId } }),
      prisma.etudeTask.deleteMany({ where: { projectId } }),
    ]);
    
    // Parse purchases file
    if (purchasesFile) {
      const buffer = Buffer.from(await purchasesFile.arrayBuffer());
      const categories = parsePurchases(buffer);
      
      if (categories.length > 0) {
        await prisma.purchaseCategory.createMany({
          data: categories.map(c => ({
            projectId,
            uploadId: upload.id,
            ...c,
          })),
        });
        results.purchases = categories.length;
      }
    }
    
    // Parse finances file
    if (financesFile) {
      const buffer = Buffer.from(await financesFile.arrayBuffer());
      const snapshots = parseFinances(buffer);
      
      if (snapshots.length > 0) {
        await prisma.financeSnapshot.createMany({
          data: snapshots.map(s => ({
            projectId,
            uploadId: upload.id,
            ...s,
          })),
        });
        results.finances = snapshots.length;
      }
    }
    
    // Parse études file
    if (etudesFile) {
      const buffer = Buffer.from(await etudesFile.arrayBuffer());
      const tasks = parseEtudes(buffer);
      
      if (tasks.length > 0) {
        await prisma.etudeTask.createMany({
          data: tasks.map(t => ({
            projectId,
            uploadId: upload.id,
            ...t,
          })),
        });
        results.etudes = tasks.length;
      }
    }
    
    return NextResponse.json({
      success: true,
      uploadId: upload.id,
      results,
    });
  } catch (error: unknown) {
    console.error('Hub files upload error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process files';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

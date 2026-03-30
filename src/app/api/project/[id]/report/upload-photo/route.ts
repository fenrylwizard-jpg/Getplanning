import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';


export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const projectId = resolvedParams.id;
        const body = await req.json();
        
        const { planTaskId, dailyReportId, base64Photo, caption } = body;

        if (!base64Photo) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Ensure uploads directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Generate unique filename as WebP
        const filename = `${projectId}_${planTaskId || 'photo'}_${Date.now()}.webp`;
        const filepath = path.join(uploadDir, filename);
        const fileUrl = `/uploads/${filename}`;

        // Strip base64 header and convert via sharp
        const base64Data = base64Photo.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Convert to WebP with 80% quality to dramatically reduce size
        const webpBuffer = await sharp(imageBuffer)
            .webp({ quality: 80 })
            .toBuffer();

        fs.writeFileSync(filepath, webpBuffer);

        // Save DB Record
        const proof = await prisma.photoProof.create({
            data: {
                url: fileUrl,
                caption: caption || null,
                ...(dailyReportId ? { dailyReportId } : {})
            }
        });

        return NextResponse.json({ success: true, proof });

    } catch (error) {
        console.error("Photo Upload Error:", error);
        return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
    }
}

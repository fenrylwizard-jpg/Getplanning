import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const projectId = resolvedParams.id;
        const body = await req.json();
        
        const { planTaskId, base64Photo, caption } = body;

        if (!planTaskId || !base64Photo) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Ensure uploads directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const filename = `${projectId}_${planTaskId}_${Date.now()}.jpg`;
        const filepath = path.join(uploadDir, filename);
        const fileUrl = `/uploads/${filename}`;

        // Strip base64 header and save file
        const base64Data = base64Photo.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        fs.writeFileSync(filepath, imageBuffer);

        // Save DB Record
        const proof = await (prisma.photoProof as any).create({
            data: {
                url: fileUrl,
                caption: caption || null,
                weeklyPlanTaskId: planTaskId
            }
        });

        return NextResponse.json({ success: true, proof });

    } catch (error) {
        console.error("Photo Upload Error:", error);
        return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
    }
}

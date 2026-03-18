import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const purchases = await prisma.purchaseCategory.findMany({
            where: { projectId: id },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ purchases });
    } catch {
        return NextResponse.json({ purchases: [] });
    }
}

// Create a new purchase row
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await req.json();
        const purchase = await prisma.purchaseCategory.create({
            data: {
                projectId: id,
                category: body.category || "Nouvelle catégorie",
                offerPriceSoum: body.offerPriceSoum ?? null,
                costPrice: body.costPrice ?? null,
                supplierSoum: body.supplierSoum ?? null,
                supplierExe: body.supplierExe ?? null,
                negotiatedPrice: body.negotiatedPrice ?? null,
                returnAmount: body.returnAmount ?? null,
                comments: body.comments ?? null,
                status: body.status ?? null,
                inProgress: body.inProgress ?? false,
            },
        });
        return NextResponse.json({ purchase });
    } catch (error) {
        console.error("Create purchase error:", error);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}

// Delete all purchases for this project
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await prisma.purchaseCategory.deleteMany({ where: { projectId: id } });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to clear" }, { status: 500 });
    }
}

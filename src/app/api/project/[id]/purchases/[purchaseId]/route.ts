import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Update a single purchase row
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string; purchaseId: string }> }
) {
    const { id, purchaseId } = await params;
    try {
        const body = await req.json();

        // Only allow updating known fields
        const allowedFields = [
            "category", "offerPriceSoum", "costPrice", "supplierSoum",
            "supplierExe", "negotiatedPrice", "returnAmount", "comments",
            "status", "inProgress",
        ];
        const data: Record<string, unknown> = {};
        for (const key of allowedFields) {
            if (key in body) {
                data[key] = body[key];
            }
        }

        // Auto-compute returnAmount if offerPriceSoum or negotiatedPrice changed
        if ("offerPriceSoum" in data || "negotiatedPrice" in data) {
            const current = await prisma.purchaseCategory.findUnique({
                where: { id: purchaseId },
                select: { offerPriceSoum: true, negotiatedPrice: true },
            });
            if (current) {
                const offer = (data.offerPriceSoum as number | null) ?? current.offerPriceSoum ?? 0;
                const negotiated = (data.negotiatedPrice as number | null) ?? current.negotiatedPrice ?? 0;
                if (negotiated > 0) {
                    data.returnAmount = Math.round((offer - negotiated) * 100) / 100;
                }
            }
        }

        const updated = await prisma.purchaseCategory.update({
            where: { id: purchaseId, projectId: id },
            data,
        });
        return NextResponse.json({ purchase: updated });
    } catch (error) {
        console.error("Update purchase error:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

// Delete a single purchase row
export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string; purchaseId: string }> }
) {
    const { id, purchaseId } = await params;
    try {
        await prisma.purchaseCategory.delete({
            where: { id: purchaseId, projectId: id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete purchase error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}

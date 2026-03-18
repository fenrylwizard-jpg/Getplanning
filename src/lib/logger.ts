import { prisma } from '@/lib/prisma';

export async function logActivity(userId: string, action: string, details?: string | object) {
    try {
        const formattedDetails = typeof details === "object" ? JSON.stringify(details) : details;
        
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                details: formattedDetails
            }
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
}

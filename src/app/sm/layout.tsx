import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";

export const dynamic = 'force-dynamic';

export default async function SMLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    const payload = token ? await verifyToken(token) : null;
    
    if (!payload?.id) redirect('/login');

    const user = await prisma.user.findUnique({
        where: { id: String(payload.id) },
        select: { name: true, characterId: true, level: true, xp: true }
    });

    if (!user) redirect('/login');

    return (
        <>
            <Navbar 
                userName={user.name} 
                userRole="site_manager" 
                characterId={user.characterId || 1} 
                level={user.level || 1} 
                xp={user.xp || 0} 
            />
            {children}
        </>
    );
}

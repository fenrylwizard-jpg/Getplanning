import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// One-time seed endpoint — creates test users if they don't already exist
// DELETE THIS FILE after initial setup for security
export async function POST(req: Request) {
    try {
        const { secret } = await req.json();
        
        // Simple secret to prevent unauthorized seeding
        if (secret !== 'seed-gp-2024') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const pw = await bcrypt.hash('password', 10);

        const users = [
            { email: 'admin@eeg.be', name: 'Admin GP', passwordHash: pw, role: 'ADMIN', status: 'APPROVED', xp: 0, level: 1, characterId: 1 },
            { email: 'pm1@eeg.be', name: 'Laurent Dupont', passwordHash: pw, role: 'PM', status: 'APPROVED', xp: 2500, level: 8, characterId: 1 },
            { email: 'pm2@eeg.be', name: 'Sophie Leroy', passwordHash: pw, role: 'PM', status: 'APPROVED', xp: 14000, level: 18, characterId: 2 },
            { email: 'pm3@eeg.be', name: 'Marc Renard', passwordHash: pw, role: 'PM', status: 'APPROVED', xp: 28000, level: 28, characterId: 3 },
            { email: 'sm1@eeg.be', name: 'Antoine Bernard', passwordHash: pw, role: 'SM', status: 'APPROVED', xp: 1200, level: 5, characterId: 2 },
            { email: 'sm2@eeg.be', name: 'Nathalie Petit', passwordHash: pw, role: 'SM', status: 'APPROVED', xp: 22000, level: 24, characterId: 1 },
            { email: 'sm3@eeg.be', name: 'Thomas Moreau', passwordHash: pw, role: 'SM', status: 'APPROVED', xp: 36000, level: 35, characterId: 3 },
        ];

        const created = [];
        const skipped = [];

        for (const u of users) {
            const existing = await prisma.user.findUnique({ where: { email: u.email } });
            if (existing) {
                skipped.push(u.email);
                continue;
            }
            await prisma.user.create({ data: u });
            created.push(u.email);
        }

        return NextResponse.json({ 
            success: true, 
            created, 
            skipped,
            message: `Created ${created.length} users, skipped ${skipped.length} existing.`,
            accounts: 'All passwords: "password"'
        });

    } catch (err) {
        console.error('Seed error:', err);
        return NextResponse.json({ error: 'Seed failed', details: String(err) }, { status: 500 });
    }
}

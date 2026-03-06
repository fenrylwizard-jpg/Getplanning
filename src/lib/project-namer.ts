import { prisma } from './prisma';

const ROMAN_NAMES = ['Jupiter', 'Mars', 'Neptune', 'Saturne', 'Apollon', 'Vulcain', 'Mercure'];

export async function getNextProjectName(baseName: string): Promise<string> {
    const existingProjects = await prisma.project.findMany({
        where: {
            name: {
                startsWith: baseName
            }
        },
        select: { name: true }
    });

    const usedNames = existingProjects.map(p => p.name.split(' - ').pop() || '');
    
    // Find the first name in ROMAN_NAMES that isn't used
    const nextName = ROMAN_NAMES.find(name => !usedNames.includes(name)) || ROMAN_NAMES[0];

    return `${baseName} - ${nextName}`;
}

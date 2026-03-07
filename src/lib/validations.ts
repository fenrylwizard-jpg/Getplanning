import { z } from 'zod';

// ── Auth Schemas ──
export const loginSchema = z.object({
    email: z.string().email('Format d\'email invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
});

export const registerSchema = z.object({
    name: z.string().min(2, 'Nom trop court (min. 2 caractères)'),
    email: z.string().email('Format d\'email invalide'),
    password: z.string().min(6, 'Mot de passe trop court (min. 6 caractères)'),
    role: z.enum(['PM', 'SM'], { errorMap: () => ({ message: 'Rôle invalide' }) }),
    characterId: z.number().int().min(1).max(5).optional().default(1),
});

export const resetPasswordSchema = z.object({
    newPassword: z.string().min(6, 'Mot de passe trop court (min. 6 caractères)'),
});

// ── Project Schemas ──
export const createProjectSchema = z.object({
    name: z.string().min(1, 'Nom du projet requis'),
    location: z.string().optional(),
    tasks: z.array(z.object({
        description: z.string().min(1),
        category: z.string().min(1),
        quantity: z.number().positive('La quantité doit être positive'),
        unit: z.string().min(1),
        minutesPerUnit: z.number().positive('Les minutes par unité doivent être positives'),
        initialQty: z.number().min(0).optional().default(0),
        initialHours: z.number().min(0).optional().default(0),
    })).min(1, 'Au moins une tâche est requise'),
    subLocations: z.array(z.string()).optional(),
});

// ── Planning Schemas ──
export const weeklyPlanSchema = z.object({
    weekNumber: z.number().int().positive(),
    year: z.number().int().min(2020).max(2100),
    items: z.array(z.object({
        taskId: z.string().min(1),
        plannedQuantity: z.number().positive('La quantité planifiée doit être positive'),
        subLocationId: z.string().optional(),
    })).min(1, 'Au moins une tâche planifiée est requise'),
});

// ── Daily Report Schemas ──
export const dailyReportSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
    tasks: z.array(z.object({
        taskId: z.string().min(1),
        actualQuantity: z.number().min(0, 'La quantité ne peut pas être négative'),
        subLocationId: z.string().optional(),
        blockageLog: z.object({
            reason: z.string().min(1),
            description: z.string().optional(),
        }).optional(),
    })),
    issues: z.string().optional(),
});

// ── Template Schemas ──
export const planTemplateSchema = z.object({
    name: z.string().min(1, 'Nom du modèle requis'),
    projectId: z.string().min(1),
    createdById: z.string().min(1),
    taskSelections: z.array(z.object({
        taskId: z.string(),
        quantity: z.number().positive(),
    })).min(1),
});

// Helper to validate and return typed data or error
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return {
        success: false,
        errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
    };
}

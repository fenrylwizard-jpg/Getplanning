/**
 * XP Engine — EEG Worksite Tracker RPG System
 *
 * XP Rules:
 * - Base: 20 XP per daily report submission
 * - Bonus: 100 XP for a complete weekly plan submission
 * - Efficiency Bonus: +240 XP if the weekly achievement is ≥ 120% of target
 * - Daily Combo: ×1.5 multiplier if 3 consecutive days reported
 * - Weekly Combo: ×2.0 multiplier if 4+ consecutive weeks with target reached
 * - Passive PM XP: +50 XP per week when their project's SM hits target
 *
 * Level thresholds (cumulative XP):
 * Lvl 1–10: each level costs (level × 500) XP
 * Lvl 11+:  each level costs 5000 + (level - 10) × 2000 XP
 *
 * Character tiers (based on level):
 * T0: Level 1–9
 * T1: Level 10–19
 * T2: Level 20–29
 * T3: Level 30–39
 * T4: Level 40–49 (reserved)
 * T5: Level 50+   (reserved)
 */

export function getTierFromLevel(level: number): number {
    if (level >= 50) return 5
    if (level >= 40) return 4
    if (level >= 30) return 3
    if (level >= 20) return 2
    if (level >= 10) return 1
    return 0
}

export function getXpForNextLevel(level: number): number {
    if (level <= 10) return level * 500
    return 5000 + (level - 10) * 2000
}

export function getLevelFromXp(totalXp: number): number {
    let level = 1
    let xpConsumed = 0
    while (true) {
        const cost = getXpForNextLevel(level)
        if (xpConsumed + cost > totalXp) break
        xpConsumed += cost
        level++
        if (level >= 100) break // safety cap
    }
    return level
}

export interface XpAwardInput {
    // The actual hours achieved vs. target capacity
    achievedHours: number
    targetHoursCapacity: number
    // Streak info
    consecutiveDaysReported: number   // Days in a row SM submitted a report
    consecutiveWeeksTargetReached: number // Weeks in a row the weekly target was hit
    isWeeklySubmission: boolean       // True if this is a weekly plan close
}

export interface XpAwardResult {
    baseXp: number
    weeklyBonus: number
    efficiencyBonus: number
    comboMultiplier: number
    totalXp: number
    breakdown: string[]
}

export function calculateXpAward(input: XpAwardInput): XpAwardResult {
    const breakdown: string[] = []
    const baseXp = 20 // Daily report base
    breakdown.push(`+${baseXp} XP (rapport journalier)`)

    let weeklyBonus = 0
    let efficiencyBonus = 0

    if (input.isWeeklySubmission) {
        weeklyBonus = 100
        breakdown.push(`+${weeklyBonus} XP (clôture hebdomadaire)`)

        // Efficiency bonus at ≥ 120%
        if (input.targetHoursCapacity > 0) {
            const efficiency = input.achievedHours / input.targetHoursCapacity
            if (efficiency >= 1.2) {
                efficiencyBonus = 240
                breakdown.push(`+${efficiencyBonus} XP (bonus efficacité ≥120%)`)
            }
        }
    }

    // Combo multiplier
    let comboMultiplier = 1.0
    if (input.consecutiveDaysReported >= 3) {
        comboMultiplier = Math.max(comboMultiplier, 1.5)
        breakdown.push(`×1.5 (combo 3 jours consécutifs)`)
    }
    if (input.consecutiveWeeksTargetReached >= 4) {
        comboMultiplier = Math.max(comboMultiplier, 2.0)
        breakdown.push(`×2.0 (combo 4 semaines objectif atteint)`)
    }

    const rawXp = baseXp + weeklyBonus + efficiencyBonus
    const totalXp = Math.round(rawXp * comboMultiplier)

    return { baseXp, weeklyBonus, efficiencyBonus, comboMultiplier, totalXp, breakdown }
}

export const HOURLY_RATE_EUR = 43.35 // Cost per MO hour for profitability calculation

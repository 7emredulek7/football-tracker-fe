import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export interface WeeklyStars {
    playerOfWeek: { playerId: string; avgRating: number } | null;
    topScorer: { playerId: string; goals: number } | null;
    topAssister: { playerId: string; assists: number } | null;
    hasMatches: boolean;
}

export function computeWeeklyStars(matches: any[]): WeeklyStars {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const weekMatches = (matches || []).filter((m: any) => {
        const matchDate = new Date(m.date);
        return isWithinInterval(matchDate, { start: weekStart, end: weekEnd });
    });

    if (weekMatches.length === 0) {
        return { playerOfWeek: null, topScorer: null, topAssister: null, hasMatches: false };
    }

    // Player of the Week: highest average rating across all weekly matches
    const ratingSums: Record<string, { total: number; count: number }> = {};
    for (const match of weekMatches) {
        if (match.ratings) {
            for (const rating of match.ratings) {
                if (rating.scores) {
                    for (const s of rating.scores) {
                        if (!ratingSums[s.playerId]) ratingSums[s.playerId] = { total: 0, count: 0 };
                        ratingSums[s.playerId].total += s.score;
                        ratingSums[s.playerId].count += 1;
                    }
                }
            }
        }
    }

    let playerOfWeek: WeeklyStars['playerOfWeek'] = null;
    let bestAvg = -1;
    for (const [pid, data] of Object.entries(ratingSums)) {
        const avg = data.total / data.count;
        if (avg > bestAvg) {
            bestAvg = avg;
            playerOfWeek = { playerId: pid, avgRating: avg };
        }
    }

    // Top Scorer & Top Assister
    const goalCounts: Record<string, number> = {};
    const assistCounts: Record<string, number> = {};
    for (const match of weekMatches) {
        if (match.events) {
            for (const ev of match.events) {
                if (ev.type === 'goal') {
                    goalCounts[ev.playerId] = (goalCounts[ev.playerId] || 0) + 1;
                    if (ev.assistPlayerId) {
                        assistCounts[ev.assistPlayerId] = (assistCounts[ev.assistPlayerId] || 0) + 1;
                    }
                } else if (ev.type === 'assist') {
                    assistCounts[ev.playerId] = (assistCounts[ev.playerId] || 0) + 1;
                }
            }
        }
    }

    let topScorer: WeeklyStars['topScorer'] = null;
    let maxGoals = 0;
    for (const [pid, goals] of Object.entries(goalCounts)) {
        if (goals > maxGoals) {
            maxGoals = goals;
            topScorer = { playerId: pid, goals };
        }
    }

    let topAssister: WeeklyStars['topAssister'] = null;
    let maxAssists = 0;
    for (const [pid, assists] of Object.entries(assistCounts)) {
        if (assists > maxAssists) {
            maxAssists = assists;
            topAssister = { playerId: pid, assists };
        }
    }

    return { playerOfWeek, topScorer, topAssister, hasMatches: true };
}

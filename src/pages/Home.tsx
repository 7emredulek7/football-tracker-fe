import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { PlayerCard } from '../components/PlayerCard';
import { MatchRow } from '../components/MatchRow';
import { computeWeeklyStars } from '../utils/weekStats';
import { Trophy, Target, Sparkles } from 'lucide-react';

export const Home = () => {
    const [activeTab, setActiveTab] = useState<'roster' | 'matches'>('roster');
    const [players, setPlayers] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [playersRes, matchesRes] = await Promise.all([
                    apiClient.get('/players'),
                    apiClient.get('/matches')
                ]);

                // Enhance players with stats
                const playersWithStats = await Promise.all(
                    (playersRes || []).map(async (p: any) => {
                        try {
                            const stats = await apiClient.get(`/stats/player/${p.id}`);
                            return { ...p, stats };
                        } catch {
                            return { ...p, stats: { goals: 0, assists: 0, matchesPlayed: 0, averageRating: 0 } };
                        }
                    })
                );

                // Sort regular squad first, then guest
                playersWithStats.sort((a, b) => {
                    if (a.isGuest === b.isGuest) return a.number - b.number;
                    return a.isGuest ? 1 : -1;
                });

                setPlayers(playersWithStats);

                // Sort matches newest first
                const sortedMatches = (matchesRes || []).sort((a: any, b: any) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                setMatches(sortedMatches);

            } catch (err) {
                console.error("Failed to load home data", err);
            }
        };

        fetchData();
    }, []);

    const weeklyStars = useMemo(() => computeWeeklyStars(matches), [matches]);

    const getPlayerName = (pid: string) => {
        const p = players.find((x: any) => x.id === pid);
        return p ? `${p.firstName} ${p.lastName}` : 'Bilinmeyen Oyuncu';
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">PAPAZLAR Futbol İstatistikleri</h1>
            </div>

            {/* Weekly Stars Section */}
            {(matches.length > 0 || players.length > 0) && (
                <div className="mb-8">
                    {!weeklyStars.hasMatches ? (
                        <div className="glass-panel text-center py-6">
                            <p className="text-slate-400 italic">Bu hafta henüz maç oynanmadı.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Player of the Week */}
                            <div className="glass-panel golden-glow border border-amber-400/30 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
                                <div className="relative">
                                    <Trophy className="mx-auto mb-2 text-amber-400" size={28} />
                                    <p className="text-sm text-amber-300/80 font-semibold uppercase tracking-wider mb-1">Haftanın Oyuncusu</p>
                                    {weeklyStars.playerOfWeek ? (
                                        <>
                                            <p className="text-lg font-bold text-white">{getPlayerName(weeklyStars.playerOfWeek.playerId)}</p>
                                            <p className="text-amber-400 font-bold text-sm mt-1">Ort: {weeklyStars.playerOfWeek.avgRating.toFixed(1)}</p>
                                        </>
                                    ) : (
                                        <p className="text-slate-400 text-sm italic">Henüz puanlama yok</p>
                                    )}
                                </div>
                            </div>

                            {/* Top Scorer */}
                            <div className="glass-panel golden-glow border border-amber-400/30 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
                                <div className="relative">
                                    <Target className="mx-auto mb-2 text-amber-400" size={28} />
                                    <p className="text-sm text-amber-300/80 font-semibold uppercase tracking-wider mb-1">Haftanın Golcüsü</p>
                                    {weeklyStars.topScorer ? (
                                        <>
                                            <p className="text-lg font-bold text-white">{getPlayerName(weeklyStars.topScorer.playerId)}</p>
                                            <p className="text-amber-400 font-bold text-sm mt-1">⚽ {weeklyStars.topScorer.goals} Gol</p>
                                        </>
                                    ) : (
                                        <p className="text-slate-400 text-sm italic">Henüz gol yok</p>
                                    )}
                                </div>
                            </div>

                            {/* Top Assister */}
                            <div className="glass-panel golden-glow border border-amber-400/30 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
                                <div className="relative">
                                    <Sparkles className="mx-auto mb-2 text-amber-400" size={28} />
                                    <p className="text-sm text-amber-300/80 font-semibold uppercase tracking-wider mb-1">Haftanın Asistçisi</p>
                                    {weeklyStars.topAssister ? (
                                        <>
                                            <p className="text-lg font-bold text-white">{getPlayerName(weeklyStars.topAssister.playerId)}</p>
                                            <p className="text-amber-400 font-bold text-sm mt-1">🎯 {weeklyStars.topAssister.assists} Asist</p>
                                        </>
                                    ) : (
                                        <p className="text-slate-400 text-sm italic">Henüz asist yok</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
                <button
                    className={`px-6 py-2 text-lg font-semibold rounded-lg transition-all ${activeTab === 'roster' ? 'bg-primary text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    onClick={() => setActiveTab('roster')}
                >
                    Takım Kadrosu
                </button>
                <button
                    className={`px-6 py-2 text-lg font-semibold rounded-lg transition-all ${activeTab === 'matches' ? 'bg-primary text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    onClick={() => setActiveTab('matches')}
                >
                    Maç Geçmişi
                </button>
            </div>

            <div>
                {activeTab === 'roster' ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
                        {players.map(p => (
                            <PlayerCard key={p.id} player={p} stats={p.stats} />
                        ))}
                        {players.length === 0 && <p className="text-slate-400 italic">Kadroda oyuncu bulunamadı.</p>}
                    </div>
                ) : (
                    <div className="max-w-[800px]">
                        {matches.map(m => (
                            <MatchRow key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
                        ))}
                        {matches.length === 0 && <p className="text-slate-400 italic">Kayıtlı maç bulunamadı.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

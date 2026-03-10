import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { PlayerCard } from '../components/PlayerCard';
import { MatchRow } from '../components/MatchRow';

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

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">PAPAZLAR Futbol İstatistikleri</h1>
            </div>

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

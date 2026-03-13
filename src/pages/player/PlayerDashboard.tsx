import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Star, CheckCircle } from 'lucide-react';

export const PlayerDashboard = () => {
    const { playerId, token } = useAuth();
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/matches')
            .then((data: any[]) => {
                const myMatches = (data || []).filter((m: any) =>
                    m.lineup?.some((entry: any) => entry.playerId === playerId)
                );
                setMatches(myMatches);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [playerId]);

    const hasRated = (match: any) => {
        const userId = getUserIdFromToken(token);
        return match.ratings?.some((r: any) => r.userId === userId);
    };

    if (loading) {
        return <div className="text-center p-16 text-slate-400">Yükleniyor...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Oyuncu Paneli</h1>
                <p className="text-slate-400 mt-1">Oynadığın maçları puanla.</p>
            </div>

            {matches.length === 0 ? (
                <div className="glass-panel text-center p-12 text-slate-400">
                    Henüz oynadığın bir maç yok.
                </div>
            ) : (
                <div className="glass-panel overflow-x-auto p-4 sm:p-6">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="p-3 text-slate-400 font-medium">Maç</th>
                                <th className="p-3 text-slate-400 font-medium">Tarih</th>
                                <th className="p-3 text-slate-400 font-medium">Sonuç</th>
                                <th className="p-3 text-slate-400 font-medium text-right">Puanlama</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matches.map((m: any) => (
                                <tr key={m.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-3 font-bold">vs {m.opponent}</td>
                                    <td className="p-3 text-slate-400 text-sm">
                                        {new Date(m.date).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                            m.result === 'Win' ? 'bg-green-500/20 text-primary' :
                                            m.result === 'Loss' ? 'bg-red-500/20 text-danger' :
                                            'bg-slate-500/20 text-slate-400'
                                        }`}>
                                            {m.result === 'Win' ? 'Galibiyet' : m.result === 'Loss' ? 'Mağlubiyet' : 'Beraberlik'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        {hasRated(m) ? (
                                            <span className="flex items-center justify-end gap-1 text-sm text-primary">
                                                <CheckCircle size={14} /> Puanlandı
                                            </span>
                                        ) : (
                                            <Link
                                                to={`/player/matches/${m.id}/rate`}
                                                className="flex items-center justify-end gap-1 text-sm text-accent hover:text-blue-300 transition-colors"
                                            >
                                                <Star size={14} /> Puanla
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

function getUserIdFromToken(token: string | null): string | null {
    if (!token) return null;
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded.userId || null;
    } catch {
        return null;
    }
}

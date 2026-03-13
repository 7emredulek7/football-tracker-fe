import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Settings, UserPlus, Play, Trophy, Edit2, Trash2, Mail, Copy, CheckCheck, Link2, UserCheck, Star, CheckCircle } from 'lucide-react';
import { apiClient } from '../../api/client';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { AlertDialog } from '../../components/AlertDialog';

export const AdminDashboard = () => {
    const { isOwner, playerId, token, login } = useAuth();
    const [players, setPlayers] = useState<any[]>([]);
    const [myMatches, setMyMatches] = useState<any[]>([]);
    const [showAddPlayer, setShowAddPlayer] = useState(false);
    const [newPlayer, setNewPlayer] = useState({ firstName: '', lastName: '', number: '', isGuest: false });

    const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
    const [editPlayerObj, setEditPlayerObj] = useState<any>(null);

    // Delete state
    const [deletingPlayer, setDeletingPlayer] = useState<any>(null);

    // Alert State
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    // Invite state
    const [inviteUrl, setInviteUrl] = useState<string | null>(null);
    const [invitePlayerName, setInvitePlayerName] = useState<string>('');
    const [copied, setCopied] = useState(false);

    if (!isOwner) {
        return <div className="text-center p-16">Erişim Reddedildi. Yönetici girişi gereklidir.</div>;
    }

    const fetchPlayers = async () => {
        try {
            const res = await apiClient.get('/players');
            setPlayers(res || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchPlayers();
        if (playerId) {
            apiClient.get('/matches')
                .then((data: any[]) => {
                    const matches = (data || [])
                        .filter((m: any) => m.lineup?.some((e: any) => e.playerId === playerId))
                        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setMyMatches(matches);
                })
                .catch(console.error);
        }
    }, [playerId]);

    const handleAddPlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/players', {
                ...newPlayer,
                number: parseInt(newPlayer.number) || 0
            });
            setShowAddPlayer(false);
            setNewPlayer({ firstName: '', lastName: '', number: '', isGuest: false });
            fetchPlayers();
        } catch (err) {
            console.error('Failed to add player', err);
            setAlertMessage('Oyuncu eklenemedi.');
        }
    };

    const handleEditClick = (p: any) => {
        setEditingPlayerId(p.id);
        setEditPlayerObj({ firstName: p.firstName, lastName: p.lastName, number: p.number.toString(), isGuest: p.isGuest });
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.put(`/players/${editingPlayerId}`, {
                ...editPlayerObj,
                number: parseInt(editPlayerObj.number) || 0
            });
            setEditingPlayerId(null);
            setEditPlayerObj(null);
            fetchPlayers();
        } catch (err: any) {
            console.error('Failed to update player', err);
            setAlertMessage(err.message || 'Oyuncu güncellenemedi.');
        }
    };

    const confirmDeletePlayer = async () => {
        if (!deletingPlayer) return;
        try {
            await apiClient.delete(`/players/${deletingPlayer.id}`);
            setDeletingPlayer(null);
            fetchPlayers();
        } catch (err: any) {
            console.error('Failed to delete player', err);
            setDeletingPlayer(null);
            // Wait a tick so the ConfirmDialog close animation starts before throwing Error dialog
            setTimeout(() => setAlertMessage(err.message || 'Oyuncu silinemedi.'), 100);
        }
    };

    const handleDeleteClick = (p: any) => {
        setDeletingPlayer(p);
    };

    const handleInvite = async (p: any) => {
        try {
            const res = await apiClient.post('/invitations', { playerId: p.id });
            setInviteUrl(res.url);
            setInvitePlayerName(`${p.firstName} ${p.lastName}`);
            setCopied(false);
        } catch (err: any) {
            setAlertMessage(err.message || 'Davet oluşturulamadı.');
        }
    };

    const handleCopyInvite = () => {
        if (!inviteUrl) return;
        navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
    };

    const handleLinkToOwner = async (p: any) => {
        try {
            const res = await apiClient.put(`/auth/link-player/${p.id}`, {});
            login(res.token, 'owner');
            fetchPlayers();
        } catch (err: any) {
            setAlertMessage(err.message || 'Hesap bağlanamadı.');
        }
    };

    const hasRated = (match: any) => {
        const userId = getUserIdFromToken(token);
        return match.ratings?.some((r: any) => r.userId === userId);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Yönetim Paneli</h1>
            </div>

            <ConfirmDialog
                isOpen={!!deletingPlayer}
                title="Oyuncuyu Sil"
                message={deletingPlayer ? `${deletingPlayer.firstName} ${deletingPlayer.lastName} isimli oyuncuyu silmek istediğinize emin misiniz? Oyuncunun geçmiş maç kaydı varsa silinemez.` : ''}
                confirmText="Evet, Sil"
                cancelText="İptal"
                onConfirm={confirmDeletePlayer}
                onCancel={() => setDeletingPlayer(null)}
            />

            <AlertDialog
                isOpen={!!alertMessage}
                title="İşlem Başarısız"
                message={alertMessage || ''}
                onClose={() => setAlertMessage(null)}
            />

            {inviteUrl && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-panel max-w-lg w-full">
                        <h2 className="text-xl font-bold mb-2">Davet Bağlantısı</h2>
                        <p className="text-slate-400 text-sm mb-4">
                            <span className="text-white font-semibold">{invitePlayerName}</span> için davet bağlantısı oluşturuldu. Bu bağlantı 72 saat geçerlidir.
                        </p>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-slate-300 break-all mb-4">
                            {inviteUrl}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCopyInvite}
                                className="btn-primary flex items-center gap-2 flex-1"
                            >
                                {copied ? <><CheckCheck size={16} /> Kopyalandı</> : <><Copy size={16} /> Kopyala</>}
                            </button>
                            <button onClick={() => setInviteUrl(null)} className="btn-secondary">Kapat</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 mb-12">
                <Link to="/admin/matches/new" className="glass-panel flex flex-col items-center justify-center gap-4 p-8 text-center no-underline hover:-translate-y-1 transition-transform cursor-pointer">
                    <div className="bg-emerald-500/20 text-primary p-4 rounded-full">
                        <Play size={32} />
                    </div>
                    <h3 className="text-xl font-bold">Yeni Maç Oluştur</h3>
                    <p className="text-slate-400 text-sm">Maçı kaydet, kadroyu ayarla, olayları ekle.</p>
                </Link>

                <Link to="/admin/settings" className="glass-panel flex flex-col items-center justify-center gap-4 p-8 text-center no-underline hover:-translate-y-1 transition-transform cursor-pointer">
                    <div className="bg-blue-500/20 text-accent p-4 rounded-full">
                        <Settings size={32} />
                    </div>
                    <h3 className="text-xl font-bold">Varsayılan Kadro</h3>
                    <p className="text-slate-400 text-sm">Otomatik doldurulacak temel dizilişi yapılandır.</p>
                </Link>

                <div
                    className="glass-panel flex flex-col items-center justify-center gap-4 p-8 text-center cursor-pointer hover:-translate-y-1 transition-transform"
                    onClick={() => setShowAddPlayer(true)}
                >
                    <div className="bg-red-500/20 text-danger p-4 rounded-full">
                        <UserPlus size={32} />
                    </div>
                    <h3 className="text-xl font-bold">Oyuncu Ekle</h3>
                    <p className="text-slate-400 text-sm">Yeni bir takım üyesi veya misafir oyuncu kaydet.</p>
                </div>
            </div>

            {showAddPlayer && (
                <div className="glass-panel mb-12 border-t-4 border-t-danger">
                    <h2 className="text-2xl font-bold mb-6">Yeni Oyuncu Ekle</h2>
                    <form onSubmit={handleAddPlayer} className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 items-end">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Ad</label>
                            <input required className="input-field !mb-0" value={newPlayer.firstName} onChange={e => setNewPlayer({ ...newPlayer, firstName: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Soyad</label>
                            <input required className="input-field !mb-0" value={newPlayer.lastName} onChange={e => setNewPlayer({ ...newPlayer, lastName: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Forma Numarası</label>
                            <input required type="number" className="input-field !mb-0" value={newPlayer.number} onChange={e => setNewPlayer({ ...newPlayer, number: e.target.value })} />
                        </div>
                        <div className="flex items-center gap-2 pb-3">
                            <input type="checkbox" id="isGuest" className="w-4 h-4" checked={newPlayer.isGuest} onChange={e => setNewPlayer({ ...newPlayer, isGuest: e.target.checked })} />
                            <label htmlFor="isGuest">Misafir Oyuncu</label>
                        </div>
                        <div>
                            <button type="submit" className="btn-primary w-full">Oyuncuyu Kaydet</button>
                        </div>
                    </form>
                    <button onClick={() => setShowAddPlayer(false)} className="btn-secondary mt-4">İptal</button>
                </div>
            )}

            {playerId && myMatches.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Star size={24} className="text-primary" />
                        Maç Puanlamaları
                    </h2>
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
                                {myMatches.map((m: any) => (
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
                                                    to={`/admin/matches/${m.id}/rate`}
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
                </div>
            )}

            <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Trophy size={24} className="text-primary" />
                    Oyuncu Yönetimi
                </h2>
                <div className="glass-panel overflow-x-auto p-4 sm:p-6">
                    <table className="w-full text-left border-collapse min-w-[300px]">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="p-2 sm:p-4 text-slate-400 font-medium text-sm sm:text-base">İsim</th>
                                <th className="p-2 sm:p-4 text-slate-400 font-medium text-sm sm:text-base">Forma No</th>
                                <th className="p-2 sm:p-4 text-slate-400 font-medium text-sm sm:text-base">Durum</th>
                                <th className="p-2 sm:p-4 text-slate-400 font-medium text-sm sm:text-base">Hesap</th>
                                <th className="p-2 sm:p-4 text-slate-400 font-medium text-right text-sm sm:text-base">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.map(p => (
                                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    {editingPlayerId === p.id ? (
                                        <td className="p-4" colSpan={5}>
                                            <form onSubmit={handleSaveEdit} className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 items-end bg-white/5 p-4 rounded-xl border border-white/10">
                                                <div>
                                                    <label className="block text-xs text-slate-400 mb-1">Ad</label>
                                                    <input required className="input-field !mb-0 py-2 text-sm" value={editPlayerObj.firstName} onChange={e => setEditPlayerObj({ ...editPlayerObj, firstName: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-400 mb-1">Soyad</label>
                                                    <input required className="input-field !mb-0 py-2 text-sm" value={editPlayerObj.lastName} onChange={e => setEditPlayerObj({ ...editPlayerObj, lastName: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-400 mb-1">No</label>
                                                    <input required type="number" className="input-field !mb-0 py-2 text-sm" value={editPlayerObj.number} onChange={e => setEditPlayerObj({ ...editPlayerObj, number: e.target.value })} />
                                                </div>
                                                <div className="flex items-center gap-2 pb-2">
                                                    <input type="checkbox" id="editGuest" className="w-4 h-4" checked={editPlayerObj.isGuest} onChange={e => setEditPlayerObj({ ...editPlayerObj, isGuest: e.target.checked })} />
                                                    <label htmlFor="editGuest" className="text-sm">Misafir</label>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button type="submit" className="btn-primary py-2 px-4 text-sm whitespace-nowrap">Kaydet</button>
                                                    <button type="button" onClick={() => setEditingPlayerId(null)} className="btn-secondary py-2 px-4 text-sm whitespace-nowrap">İptal</button>
                                                </div>
                                            </form>
                                        </td>
                                    ) : (
                                        <>
                                            <td className="p-2 sm:p-4 font-bold text-sm sm:text-base">{p.firstName} {p.lastName}</td>
                                            <td className="p-2 sm:p-4 text-sm sm:text-base">{p.number}</td>
                                            <td className="p-2 sm:p-4">
                                                <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold ${p.isGuest ? 'bg-blue-500/20 text-accent' : 'bg-green-500/20 text-primary'}`}>
                                                    {p.isGuest ? 'Misafir' : 'Kadro'}
                                                </span>
                                            </td>
                                            <td className="p-2 sm:p-4">
                                                {!p.isGuest && (
                                                    p.id === playerId ? (
                                                        <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold bg-emerald-500/20 text-primary flex items-center gap-1 w-fit">
                                                            <UserCheck size={11} /> Benim Hesabım
                                                        </span>
                                                    ) : p.userId ? (
                                                        <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold bg-purple-500/20 text-purple-300">
                                                            Kayıtlı
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            <button
                                                                onClick={() => handleInvite(p)}
                                                                className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary transition-colors"
                                                                title="Davet Gönder"
                                                            >
                                                                <Mail size={13} /> Davet Gönder
                                                            </button>
                                                            <button
                                                                onClick={() => handleLinkToOwner(p)}
                                                                className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                                                                title="Hesabıma Bağla"
                                                            >
                                                                <Link2 size={13} /> Hesabıma Bağla
                                                            </button>
                                                        </div>
                                                    )
                                                )}
                                            </td>
                                            <td className="p-2 sm:p-4 text-right whitespace-nowrap">
                                                <button onClick={() => handleEditClick(p)} className="p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 mr-1 sm:mr-2 transition-colors inline-block" title="Düzenle">
                                                    <Edit2 size={16} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteClick(p)} className="p-1.5 sm:p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-danger transition-colors inline-block" title="Sil">
                                                    <Trash2 size={16} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {players.length === 0 && <div className="p-8 text-center text-slate-400">Veritabanında oyuncu bulunamadı.</div>}
                </div>
            </div>
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

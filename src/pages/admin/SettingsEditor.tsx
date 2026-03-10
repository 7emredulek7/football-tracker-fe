import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { FormationGrid } from '../../components/FormationGrid';
import { AlertDialog } from '../../components/AlertDialog';

export const SettingsEditor = () => {
    const [players, setPlayers] = useState<any[]>([]);
    const [formationStr, setFormationStr] = useState('3-2-1');
    const [lineup, setLineup] = useState<{ position: string, playerId: string }[]>([]);

    // UI State
    const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [playersRes, settingsRes] = await Promise.all([
                    apiClient.get('/players'),
                    apiClient.get('/settings')
                ]);

                setPlayers(playersRes || []);
                if (settingsRes) {
                    if (settingsRes.defaultFormation) setFormationStr(settingsRes.defaultFormation);
                    if (settingsRes.defaultLineup) setLineup(settingsRes.defaultLineup);
                }
            } catch (err) {
                console.error('Failed to load settings data', err);
            }
        };
        fetchData();
    }, []);

    const handlePositionClick = (position: string) => {
        setSelectedPosition(position);
    };

    const handleAssignPlayer = (playerId: string) => {
        if (!selectedPosition) return;

        // Remove player from any existing position
        let newLineup = lineup.filter(l => l.playerId !== playerId);

        // Assign to new position
        newLineup = newLineup.filter(l => l.position !== selectedPosition);
        newLineup.push({ position: selectedPosition, playerId });

        setLineup(newLineup);
        setSelectedPosition(null);
    };

    const clearPosition = () => {
        if (!selectedPosition) return;
        setLineup(lineup.filter(l => l.position !== selectedPosition));
        setSelectedPosition(null);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiClient.put('/settings/default-lineup', {
                defaultFormation: formationStr,
                defaultLineup: lineup
            });
            navigate('/admin');
        } catch (err) {
            console.error('Failed to save settings', err);
            setAlertMessage('Ayarlar kaydedilemedi.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            <AlertDialog
                isOpen={!!alertMessage}
                title="Hata"
                message={alertMessage || ''}
                onClose={() => setAlertMessage(null)}
            />
            <div className="page-header mb-6">
                <h1 className="page-title">Varsayılan Diziliş Ayarları</h1>
                <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Kaydediliyor...' : 'Varsayılan Kadroyu Kaydet'}
                </button>
            </div>
            <p className="text-slate-400 mb-8 max-w-2xl">
                Bu diziliş ve kadro, her yeni maç oluşturduğunuzda otomatik olarak doldurulacaktır.
                Varsayılan bir oyuncu atamak için sahadaki bir pozisyona tıklayın.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
                <div>
                    <FormationGrid
                        lineup={lineup}
                        players={players}
                        interactive={true}
                        onPositionClick={handlePositionClick}
                    />
                </div>

                <div className="glass-panel self-start">
                    <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">
                        {selectedPosition ? `${selectedPosition} Pozisyonunu Seçin` : 'Bir pozisyon seçin'}
                    </h2>

                    {selectedPosition ? (
                        <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-2">
                            <button
                                onClick={clearPosition}
                                className="p-3 bg-red-500/10 text-danger border border-red-500/20 rounded-lg text-left cursor-pointer mb-4 hover:bg-red-500/20 transition-colors"
                            >
                                Bu pozisyonu temizle
                            </button>

                            {players.map(p => {
                                const isAssigned = lineup.some(l => l.playerId === p.id && l.position !== selectedPosition);
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => handleAssignPlayer(p.id)}
                                        className={`p-3 rounded-lg text-left cursor-pointer flex justify-between items-center transition-colors
                      ${isAssigned ? 'bg-white/5 text-slate-400 opacity-50' : 'bg-white/10 hover:bg-white/20 text-white'}
                    `}
                                    >
                                        <span className="font-medium">{p.firstName} {p.lastName}</span>
                                        <span className="text-primary font-bold">#{p.number}</span>
                                    </button>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Saha üzerindeki herhangi bir pozisyona tıklayarak bir oyuncu atayın.
                            Atanan oyuncu, yeni maçlarda otomatik olarak o pozisyonda başlayacaktır.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

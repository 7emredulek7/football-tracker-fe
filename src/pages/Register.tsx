import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

export const Register = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    const [playerName, setPlayerName] = useState<string | null>(null);
    const [tokenError, setTokenError] = useState('');
    const [loadingToken, setLoadingToken] = useState(true);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formError, setFormError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setTokenError('Geçersiz davet bağlantısı.');
            setLoadingToken(false);
            return;
        }
        apiClient.get(`/invitations/${token}`)
            .then((data: any) => {
                setPlayerName(`${data.playerFirstName} ${data.playerLastName}`);
            })
            .catch((err: any) => {
                setTokenError(err.message || 'Davet bulunamadı veya süresi dolmuş.');
            })
            .finally(() => setLoadingToken(false));
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (password !== confirmPassword) {
            setFormError('Şifreler eşleşmiyor.');
            return;
        }

        setLoading(true);
        try {
            const { token: jwt, role } = await apiClient.post('/auth/register', { token, email, password });
            login(jwt, role);
            navigate('/player');
        } catch (err: any) {
            setFormError(err.message || 'Kayıt başarısız oldu.');
        } finally {
            setLoading(false);
        }
    };

    if (loadingToken) {
        return <div className="text-center p-16 text-slate-400">Davet doğrulanıyor...</div>;
    }

    if (tokenError) {
        return (
            <div className="max-w-[400px] mx-auto mt-16">
                <div className="glass-panel text-center">
                    <h1 className="page-title text-2xl mb-4">Geçersiz Davet</h1>
                    <p className="text-slate-400">{tokenError}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[400px] mx-auto mt-16">
            <div className="glass-panel">
                <h1 className="page-title text-center text-3xl mb-2">Hesap Oluştur</h1>
                <p className="text-center text-slate-400 mb-8">
                    Hoş geldin, <span className="text-primary font-semibold">{playerName}</span>
                </p>

                {formError && (
                    <div className="bg-red-500/10 text-danger p-4 rounded-lg mb-6 border border-red-500/20">
                        {formError}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block mb-2 text-slate-400">E-posta</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block mb-2 text-slate-400">Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="mb-8">
                        <label className="block mb-2 text-slate-400">Şifre Tekrar</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="input-field"
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary w-full" disabled={loading}>
                        {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
                    </button>
                </form>
            </div>
        </div>
    );
};

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { token, role } = await apiClient.post('/auth/login', { email, password });
            login(token, role);
            navigate(role === 'player' ? '/player' : '/admin');
        } catch (err: any) {
            setError(err.message || 'Giriş başarısız oldu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[400px] mx-auto mt-16">
            <div className="glass-panel">
                <h1 className="page-title text-center text-3xl mb-8">
                    Giriş Yap
                </h1>

                {error && (
                    <div className="bg-red-500/10 text-danger p-4 rounded-lg mb-6 border border-red-500/20">
                        {error}
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

                    <div className="mb-8">
                        <label className="block mb-2 text-slate-400">Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary w-full" disabled={loading}>
                        {loading ? 'Doğrulanıyor...' : 'Giriş Yap'}
                    </button>
                </form>
            </div>
        </div>
    );
};

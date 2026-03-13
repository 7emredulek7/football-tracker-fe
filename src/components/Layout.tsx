import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Home, User } from 'lucide-react';

export const Layout = () => {
    const { isOwner, isPlayer, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <>
            <nav className="bg-slate-900/80 border-b border-white/5 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-[1200px] mx-auto p-4 flex justify-between items-center">
                    <Link to="/" className="text-xl font-bold flex items-center gap-2 text-primary hover:text-primary-hover transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                            <path d="M2 12h20" />
                        </svg>
                        <span className="hidden sm:inline">PAPAZLAR</span>
                    </Link>

                    <div className="flex gap-4 items-center">
                        <Link to="/" className="flex items-center gap-1 text-sm text-slate-400 hover:text-primary transition-colors">
                            <Home size={16} /> Ana Sayfa
                        </Link>

                        {isOwner ? (
                            <>
                                <Link to="/admin" className="flex items-center gap-1 text-sm text-slate-50 hover:text-primary transition-colors">
                                    <LayoutDashboard size={16} /> Yönetim Paneli
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-1 text-sm text-danger hover:text-red-400 transition-colors p-1 rounded"
                                >
                                    <LogOut size={16} /> Çıkış Yap
                                </button>
                            </>
                        ) : isPlayer ? (
                            <>
                                <Link to="/player" className="flex items-center gap-1 text-sm text-slate-50 hover:text-primary transition-colors">
                                    <User size={16} /> Oyuncu Paneli
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-1 text-sm text-danger hover:text-red-400 transition-colors p-1 rounded"
                                >
                                    <LogOut size={16} /> Çıkış Yap
                                </button>
                            </>
                        ) : (
                            <Link to="/login" className="text-sm text-slate-400 hover:text-primary transition-colors">
                                Giriş Yap
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            <main className="page-container">
                <Outlet />
            </main>
        </>
    );
};

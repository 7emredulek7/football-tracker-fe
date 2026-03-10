import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface AlertDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    buttonText?: string;
    onClose: () => void;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
    isOpen,
    title,
    message,
    buttonText = 'Tamam',
    onClose
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-white/10 shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3 text-danger">
                            <div className="p-2 bg-red-500/10 rounded-full">
                                <AlertCircle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white">{title}</h3>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-slate-300 mb-8">{message}</p>
                    <div className="flex justify-end">
                        <button onClick={onClose} className="btn-primary px-6 py-2 text-sm shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
                            {buttonText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

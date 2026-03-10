import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Evet',
    cancelText = 'İptal',
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-white/10 shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3 text-danger">
                            <div className="p-2 bg-red-500/10 rounded-full">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white">{title}</h3>
                        </div>
                        <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-slate-300 mb-8">{message}</p>
                    <div className="flex gap-3 justify-end">
                        <button onClick={onCancel} className="btn-secondary px-4 py-2 text-sm">
                            {cancelText}
                        </button>
                        <button onClick={onConfirm} className="btn-secondary px-4 py-2 text-sm border-red-500/30 text-danger hover:bg-red-500/10 hover:border-red-500/50">
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

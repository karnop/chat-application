import React from 'react';

const Toast = ({ toast }) => {
    if (!toast.visible) return null;

    return (
        <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 ${toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-100' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
            }`}>
            <div className="flex items-center gap-3">
                {toast.type === 'error' ? (
                    <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : (
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
                <span className="text-sm font-medium">{toast.message}</span>
            </div>
        </div>
    );
};

export default Toast;

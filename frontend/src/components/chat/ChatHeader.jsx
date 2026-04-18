import React from 'react';

const ChatHeader = ({
    activeTab,
    activeDMUser,
    currentRoom,
    isOwner,
    status,
    showInviteField,
    setShowInviteField
}) => {
    return (
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01] z-10">
            <div className="flex items-center gap-4">
                <h3 className="font-bold text-2xl tracking-tight">
                    {activeTab === 'dm' ? (
                        <span className="flex items-center gap-2">
                            <span className="text-indigo-400">@</span> {activeDMUser?.username}
                        </span>
                    ) : (
                        <># {currentRoom}</>
                    )}
                </h3>
                {isOwner && activeTab === 'rooms' && (
                    <button
                        onClick={() => setShowInviteField(!showInviteField)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-500/20 transition-all"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        Invite
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status === 'Connected' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-rose-400'}`}></div>
                <span className="text-[10px] font-bold text-white/30 tracking-widest uppercase">{status}</span>
            </div>
        </div>
    );
};

export default ChatHeader;

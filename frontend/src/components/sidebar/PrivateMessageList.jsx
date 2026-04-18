import React, { useState } from 'react';

const PrivateMessageList = ({
    potentialPartners,
    activeTab,
    activeDMUser,
    startDM,
    fetchPotentialPartners
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const filteredPartners = (potentialPartners || []).filter(u =>
        u && u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleToggleSearch = () => {
        if (!isSearching) {
            fetchPotentialPartners();
        }
        setIsSearching(!isSearching);
    };

    return (
        <div className="mt-4 px-2">
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Private Messages</h3>
                <button
                    onClick={handleToggleSearch}
                    className={`transition-all duration-300 ${isSearching ? 'text-indigo-400 rotate-45' : 'text-white/30 hover:text-indigo-400'}`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                </button>
            </div>

            {isSearching && (
                <div className="px-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <input
                        autoFocus
                        type="text"
                        placeholder="Search for users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500/50 transition-all placeholder-white/20"
                    />
                </div>
            )}

            <div className="space-y-1 pb-4">
                {isSearching ? (
                    filteredPartners.length > 0 ? (
                        filteredPartners.map(user => (
                            <button
                                key={`pm-search-${user.id}`}
                                onClick={() => startDM(user)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'dm' && activeDMUser?.id === user.id ? 'bg-indigo-500/20 text-white shadow-lg border border-indigo-500/30' : 'text-white/50 hover:bg-white/5'}`}
                            >
                                <div className="w-2 h-2 rounded-full bg-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
                                <span className="font-medium truncate">{user.username}</span>
                            </button>
                        ))
                    ) : (
                        <div key="no-users-found" className="text-center py-4 opacity-30 text-[10px] uppercase font-bold tracking-widest">No users found</div>
                    )
                ) : (
                    potentialPartners.length > 0 ? (
                        potentialPartners.map(user => (
                            <button
                                key={`pm-list-${user.id}`}
                                onClick={() => startDM(user)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'dm' && activeDMUser?.id === user.id ? 'bg-indigo-500/20 text-white shadow-lg border border-indigo-500/30' : 'text-white/50 hover:bg-white/5'}`}
                            >
                                <div className="w-2 h-2 rounded-full bg-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
                                <span className="font-medium truncate">{user.username}</span>
                            </button>
                        ))
                    ) : (
                        <div key="no-online-yet" className="text-center py-4 opacity-20 text-[10px] uppercase font-bold tracking-widest">No one online yet</div>
                    )
                )}
            </div>
        </div>
    );
};

export default PrivateMessageList;

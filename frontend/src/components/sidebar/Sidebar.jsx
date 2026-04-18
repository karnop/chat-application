import React from 'react';
import ChannelList from './ChannelList';
import PrivateMessageList from './PrivateMessageList';
import { getUserColor } from '../../utils/colors';

const Sidebar = ({
    username,
    onLogout,
    rooms,
    currentRoom,
    activeTab,
    joinRoom,
    isLoadingRooms,
    potentialPartners,
    activeDMUser,
    startDM,
    fetchPotentialPartners,
    isGuest,
    newRoomName,
    setNewRoomName,
    newRoomIsPrivate,
    setNewRoomIsPrivate,
    handleCreateRoom
}) => {
    const color = getUserColor(username);

    return (
        <div className="w-72 border-r border-white/5 flex flex-col bg-white/[0.02]">
            {/* User Profile */}
            <div className="p-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-4 group">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${color.bg} ${color.text} border ${color.border}`}>
                        {(username || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h2 className="font-semibold text-white/90 truncate">{username}</h2>
                        <button onClick={onLogout} className="text-[10px] text-rose-400/60 hover:text-rose-400 uppercase font-black tracking-tighter transition-colors">Logout</button>
                    </div>
                </div>
            </div>

            {/* List Sections */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <ChannelList
                    rooms={rooms}
                    currentRoom={currentRoom}
                    activeTab={activeTab}
                    joinRoom={joinRoom}
                    isLoadingRooms={isLoadingRooms}
                />

                {!isGuest && (
                    <PrivateMessageList
                        potentialPartners={potentialPartners}
                        activeTab={activeTab}
                        activeDMUser={activeDMUser}
                        startDM={startDM}
                        fetchPotentialPartners={fetchPotentialPartners}
                    />
                )}
            </div>

            {/* Room Creation */}
            {!isGuest && (
                <div className="p-4 border-t border-white/5 bg-white/[0.01]">
                    <form onSubmit={handleCreateRoom} className="space-y-2">
                        <div className="flex gap-2">
                            <input className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500/50 transition-all placeholder-white/20" placeholder="New room..." value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
                            <button type="submit" className="bg-white/10 hover:bg-white/20 p-2 rounded-xl border border-white/10 transition-all"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg></button>
                        </div>
                        <label className="flex items-center gap-2 px-1 cursor-pointer group">
                            <input type="checkbox" className="hidden" checked={newRoomIsPrivate} onChange={(e) => setNewRoomIsPrivate(e.target.checked)} />
                            <div className={`w-3.5 h-3.5 rounded border ${newRoomIsPrivate ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'}`}>{newRoomIsPrivate && <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" /></svg>}</div>
                            <span className="text-[10px] font-bold text-white/30 group-hover:text-white/50 transition-colors uppercase tracking-widest">Private</span>
                        </label>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Sidebar;

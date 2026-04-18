import React from 'react';

const ChannelList = ({ rooms, currentRoom, activeTab, joinRoom, isLoadingRooms }) => {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4 px-2">Channels</h3>

            {isLoadingRooms && rooms.length === 0 ? (
                <div className="flex justify-center items-center py-6">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                rooms.map(room => (
                    <button
                        key={room.id}
                        onClick={() => joinRoom(room.name)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${activeTab === 'rooms' && currentRoom === room.name ? 'bg-white/10 text-white shadow-lg' : 'text-white/50 hover:bg-white/5'}`}
                    >
                        <span className="font-medium truncate mr-2"># {room.name}</span>
                        {room.is_private && <svg className="w-3.5 h-3.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                    </button>
                ))
            )}
        </div>
    );
};

export default ChannelList;

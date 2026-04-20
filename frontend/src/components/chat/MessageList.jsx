import React from 'react';
import { getUserColor } from '../../utils/colors';

const MessageList = ({
    messages,
    username,
    userId,
    isRoomLoading,
    activeTab,
    activeDMUser,
    currentRoom,
    formatTime,
    messagesEndRef,
    sendMessage
}) => {
    const emojis = ['👍', '❤️', '🔥', '😂', '😮', '😢'];

    const handleToggleReaction = (messageId, emoji, existingReactions) => {
        const hasReacted = (existingReactions || []).some(r => r.user_id === userId && r.emoji === emoji);
        const type = hasReacted ? "remove_reaction" : "reaction";

        const target = activeTab === 'dm' ? activeDMUser?.id : currentRoom;
        sendMessage(type, target, username, JSON.stringify({
            message_id: messageId,
            emoji: emoji
        }));
    };

    return (
        <div className="flex-1 px-8 py-6 overflow-y-auto space-y-6 flex flex-col custom-scrollbar">
            {isRoomLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-70">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-xs uppercase tracking-widest font-bold text-indigo-400">Loading {activeTab === 'dm' ? activeDMUser?.username : currentRoom}...</p>
                </div>
            ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 mt-10">
                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-4 border border-white/10">
                        <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-1">
                        Welcome to {activeTab === 'dm' ? `@${activeDMUser?.username}` : `# ${currentRoom}`}
                    </h4>
                    <p className="text-sm text-white/50">There are no messages here yet. Break the ice!</p>
                </div>
            ) : (
                messages.map((msg, idx) => {
                    const isMe = msg.user === username;
                    const color = getUserColor(msg.user);
                    
                    // Group reactions by emoji
                    const reactionGroups = (msg.reactions || []).reduce((acc, curr) => {
                        acc[curr.emoji] = (acc[curr.emoji] || []);
                        acc[curr.emoji].push(curr);
                        return acc;
                    }, {});

                    return (
                        <div key={`${msg.user}-${msg.timestamp}-${idx}`} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-3 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-black border ${color.bg} ${color.text} ${color.border}`}>{(msg.user || "?").charAt(0).toUpperCase()}</div>
                                <div className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                                    {!isMe && (
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className={`text-[10px] font-bold opacity-80 uppercase tracking-wide ${color.text}`}>{msg.user}</span>
                                            <span className="text-[9px] text-white/30">{formatTime(msg.timestamp)}</span>
                                        </div>
                                    )}
                                    <div className="relative flex items-center group/bubble">
                                        <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-indigo-500/20 text-white border border-indigo-500/30 rounded-tr-sm' : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-sm'}`}>
                                            {msg.content}
                                        </div>
                                        
                                        {/* Reaction Picker Trigger */}
                                        <div className={`absolute top-0 ${isMe ? '-left-8' : '-right-8'} opacity-0 group-hover/bubble:opacity-100 transition-opacity flex gap-1`}>
                                            <div className="bg-black/80 backdrop-blur-lg border border-white/10 rounded-full p-1 flex gap-1 shadow-xl">
                                                {emojis.slice(0, 3).map(e => (
                                                    <button 
                                                        key={e} 
                                                        onClick={() => handleToggleReaction(msg.id, e, msg.reactions)}
                                                        className="hover:scale-125 transition-transform text-xs grayscale hover:grayscale-0"
                                                    >
                                                        {e}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Display Reactions */}
                                    {Object.keys(reactionGroups).length > 0 && (
                                        <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {Object.entries(reactionGroups).map(([emoji, users]) => {
                                                const hasReacted = users.some(u => u.user_id === userId);
                                                return (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => handleToggleReaction(msg.id, emoji, msg.reactions)}
                                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border transition-all ${hasReacted ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                                                    >
                                                        <span>{emoji}</span>
                                                        <span>{users.length}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {isMe && <span className="text-[9px] text-white/30 mt-1">{formatTime(msg.timestamp)}</span>}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;

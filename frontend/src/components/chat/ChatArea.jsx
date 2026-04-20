import React from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatArea = ({
    activeTab,
    activeDMUser,
    currentRoom,
    isOwner,
    status,
    showInviteField,
    setShowInviteField,
    messages,
    username,
    isRoomLoading,
    formatTime,
    messagesEndRef,
    input,
    setInput,
    isGuest,
    handleSend,
    chatInputRef,
    handleInvite,
    inviteName,
    setInviteName,
    sendMessage,
    typingUsers,
    userId
}) => {
    const activeRoomId = activeTab === 'dm' ? activeDMUser?.id : currentRoom;
    const currentTyping = typingUsers[activeRoomId] || [];

    return (
        <div className="flex-1 flex flex-col relative">
            <ChatHeader
                activeTab={activeTab}
                activeDMUser={activeDMUser}
                currentRoom={currentRoom}
                isOwner={isOwner}
                status={status}
                showInviteField={showInviteField}
                setShowInviteField={setShowInviteField}
            />

            {showInviteField && activeTab === 'rooms' && (
                <div className="mx-8 mt-4 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <form onSubmit={handleInvite} className="flex gap-3 items-center">
                        <input
                            autoFocus
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-indigo-500/50"
                            placeholder="Enter username to invite..."
                            value={inviteName}
                            onChange={(e) => setInviteName(e.target.value)}
                        />
                        <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 transition-colors text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">Send Invite</button>
                        <button type="button" onClick={() => setShowInviteField(false)} className="text-white/30 hover:text-white transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </form>
                </div>
            )}


            <MessageList
                messages={messages}
                username={username}
                userId={userId}
                isRoomLoading={isRoomLoading}
                activeTab={activeTab}
                activeDMUser={activeDMUser}
                currentRoom={currentRoom}
                formatTime={formatTime}
                messagesEndRef={messagesEndRef}
                sendMessage={sendMessage}
            />

            {currentTyping.length > 0 && (
                <div className="px-8 pb-1 absolute bottom-24 left-0">
                    <p className="text-[10px] text-indigo-400/70 animate-pulse font-medium italic bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-indigo-500/20">
                        {currentTyping.join(', ')} {currentTyping.length === 1 ? 'is' : 'are'} typing...
                    </p>
                </div>
            )}

            <MessageInput
                input={input}
                setInput={setInput}
                isGuest={isGuest}
                handleSend={handleSend}
                activeTab={activeTab}
                activeDMUser={activeDMUser}
                currentRoom={currentRoom}
                chatInputRef={chatInputRef}
                username={username}
                sendMessage={sendMessage}
            />
        </div>
    );
};

export default ChatArea;

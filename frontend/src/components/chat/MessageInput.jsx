import React, { useRef } from 'react';

const MessageInput = ({
    input,
    setInput,
    isGuest,
    handleSend,
    activeTab,
    activeDMUser,
    currentRoom,
    chatInputRef,
    username,
    sendMessage
}) => {
    const lastTypingTime = useRef(0);

    const handleInputChange = (e) => {
        setInput(e.target.value);

        // ✍️ Send typing indicator every 2 seconds while typing
        const now = Date.now();
        if (now - lastTypingTime.current > 2000) {
            lastTypingTime.current = now;
            const target = activeTab === 'dm' ? activeDMUser?.id : currentRoom;
            if (target) {
                sendMessage("typing", target, username, "");
            }
        }
    };

    return (
        <div className="p-6 border-t border-white/5 bg-white/[0.02]">
            <form onSubmit={handleSend} className="flex gap-3 items-center bg-black/60 p-2 rounded-[1.5rem] border border-white/10 focus-within:border-indigo-500/50 transition-colors">
                <input
                    ref={chatInputRef}
                    value={input}
                    onChange={handleInputChange}
                    disabled={isGuest}
                    placeholder={isGuest ? "Login to post..." : (activeTab === 'dm' ? `Message @${activeDMUser?.username}...` : `Message # ${currentRoom}...`)}
                    className="flex-1 bg-transparent border-none px-4 py-3 outline-none text-white text-sm disabled:opacity-30"
                />
                {!isGuest && <button type="submit" disabled={!input.trim()} className="bg-white/10 text-white hover:bg-white/20 px-6 py-2 rounded-xl text-xs font-bold transition-all border border-white/10 uppercase disabled:opacity-30 disabled:hover:bg-white/10">Send</button>}
            </form>
        </div>
    );
};

export default MessageInput;

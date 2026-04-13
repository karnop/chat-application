import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from './hooks/useWebSocket';

const INITIAL_ROOMS = ["General", "Tech", "Random"];

// 🎨 Dynamic color palettes for different users
const USER_COLORS = [
  { name: 'cyan', text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', glow: 'shadow-[0_0_15px_rgba(34,211,238,0.15)]' },
  { name: 'rose', text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', glow: 'shadow-[0_0_15px_rgba(251,113,133,0.15)]' },
  { name: 'emerald', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.15)]' },
  { name: 'amber', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.15)]' },
  { name: 'fuchsia', text: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', glow: 'shadow-[0_0_15px_rgba(232,121,249,0.15)]' },
];

// Helper to consistently assign a color to a username
const getUserColor = (username) => {
  if (!username) return USER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

function App() {
  const { messages, status, sendMessage } = useWebSocket('ws://127.0.0.1:8080/ws');

  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [currentRoom, setCurrentRoom] = useState('General');
  const [input, setInput] = useState('');

  // 🚪 NEW: State to manage the dynamic list of rooms
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [newRoomName, setNewRoomName] = useState('');

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentRoom]);

  const joinRoom = (roomName) => {
    setCurrentRoom(roomName);
    // Add to list if it's a new room
    if (!rooms.includes(roomName)) {
      setRooms(prev => [...prev, roomName]);
    }
    sendMessage("join", roomName, username, "");
  };

  // NEW: Handle creating a room from sidebar
  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (newRoomName.trim()) {
      joinRoom(newRoomName.trim());
      setNewRoomName('');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setIsJoined(true);
      joinRoom('General');
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage("chat", currentRoom, username, input);
      setInput('');
    }
  };

  // 🐛 FIX: Deduplicate messages using the backend TIMESTAMP
  const uniqueMessages = messages
    .filter(m => m.room === currentRoom)
    .filter((msg, index, self) =>
      index === self.findIndex((t) => t.timestamp === msg.timestamp)
    );

  // Background Ambient Orbs
  const AmbientBackground = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#050505]">
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-rose-600/10 blur-[150px] mix-blend-screen" />
      <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-emerald-600/10 blur-[100px] mix-blend-screen" />
    </div>
  );

  // 1. LOGIN SCREEN
  if (!isJoined) {
    return (
      <div className="flex h-screen items-center justify-center font-sans text-white relative">
        <AmbientBackground />
        <form onSubmit={handleLogin} className="relative z-10 bg-white/5 backdrop-blur-2xl p-10 rounded-[2rem] border border-white/10 w-[420px] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto flex items-center justify-center mb-6 border border-white/5">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-light tracking-wide mb-2">Initialize <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Connection</span></h1>
            <p className="text-white/40 text-sm">Enter your designated identifier.</p>
          </div>
          <div className="relative mb-6">
            <input
              autoFocus
              className="w-full bg-black/40 text-white px-6 py-4 rounded-xl outline-none border border-white/10 focus:border-indigo-500/50 transition-all"
              placeholder="Username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <button
            disabled={!username.trim()}
            className="w-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white font-medium py-4 rounded-xl transition-all border border-white/5 flex items-center justify-center gap-2 group"
          >
            Enter Network
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>
      </div>
    );
  }

  // 2. MAIN CHAT INTERFACE
  return (
    <div className="flex h-screen items-center justify-center p-4 sm:p-6 font-sans text-white relative">
      <AmbientBackground />

      <div className="flex w-full max-w-7xl h-full max-h-[90vh] bg-black/40 backdrop-blur-2xl rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">

        {/* Sidebar */}
        <div className="w-72 border-r border-white/5 flex flex-col bg-white/[0.02]">
          {/* User Profile */}
          <div className="p-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${getUserColor(username).bg} ${getUserColor(username).text} border ${getUserColor(username).border}`}>
                {username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-semibold text-white/90 text-lg">{username}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${status === 'Connected' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]'}`}></div>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Rooms List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4 px-2">Secure Channels</h3>
            {rooms.map(room => {
              const isActive = currentRoom === room;
              return (
                <button
                  key={room}
                  onClick={() => joinRoom(room)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative ${isActive ? 'bg-white/10 text-white shadow-lg' : 'text-white/50 hover:bg-white/5'}`}
                >
                  {isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-400 rounded-r-full" />}
                  <svg className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'opacity-40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  <span className="font-medium tracking-wide">{room}</span>
                </button>
              );
            })}
          </div>

          {/* NEW: Create Room Input */}
          <div className="p-4 border-t border-white/5 bg-white/[0.01]">
            <form onSubmit={handleCreateRoom} className="flex gap-2">
              <input
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500/50 transition-all placeholder-white/20"
                placeholder="Create channel..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
              />
              <button
                type="submit"
                className="bg-white/5 hover:bg-white/10 border border-white/10 p-2 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col relative">
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01] backdrop-blur-md">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-2xl text-white tracking-wide"># {currentRoom}</h3>
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase border border-indigo-500/20">Encrypted</span>
            </div>
          </div>

          <div className="flex-1 px-8 py-6 overflow-y-auto space-y-6 flex flex-col scroll-smooth custom-scrollbar">
            {uniqueMessages.length === 0 && (
              <div className="m-auto text-center opacity-30">
                <p className="text-sm font-medium tracking-widest uppercase">Start of transmission</p>
              </div>
            )}

            {uniqueMessages.map((msg, idx) => {
              const isMe = msg.user === username;
              const userStyle = getUserColor(msg.user);
              return (
                <div key={idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMe && (
                      <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold border ${userStyle.bg} ${userStyle.text} ${userStyle.border}`}>
                        {msg.user.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && <span className={`text-[11px] font-bold mb-1 opacity-50 uppercase tracking-tighter ${userStyle.text}`}>{msg.user}</span>}
                      <div className={`px-4 py-2.5 text-[14px] rounded-2xl ${isMe ? 'bg-indigo-500/20 text-white border border-indigo-500/30 rounded-tr-sm' : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-sm'}`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-6 bg-white/[0.02] border-t border-white/5">
            <form onSubmit={handleSend} className="flex gap-3 items-center bg-black/40 p-2 rounded-2xl border border-white/10 focus-within:border-indigo-500/40 transition-all">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Message #${currentRoom}...`}
                className="flex-1 bg-transparent border-none px-4 py-2 outline-none text-white placeholder-white/20 text-sm"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 disabled:opacity-20 h-10 w-10 rounded-xl flex items-center justify-center transition-all border border-indigo-500/30"
              >
                <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
      `}} />
    </div>
  );
}

export default App;
import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from './hooks/useWebSocket';

const INITIAL_ROOMS = ["General", "Tech", "Random"];

// 🎨 Dynamic color palettes (same as before)
const USER_COLORS = [
  { name: 'cyan', text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', glow: 'shadow-[0_0_15px_rgba(34,211,238,0.15)]' },
  { name: 'rose', text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', glow: 'shadow-[0_0_15px_rgba(251,113,133,0.15)]' },
  { name: 'emerald', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.15)]' },
  { name: 'amber', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.15)]' },
  { name: 'fuchsia', text: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', glow: 'shadow-[0_0_15px_rgba(232,121,249,0.15)]' },
];

const getUserColor = (username) => {
  if (!username) return USER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

function App() {
  // --- AUTH & STATE ---
  const [token, setToken] = useState(localStorage.getItem('chat_token') || '');
  const [username, setUsername] = useState(localStorage.getItem('chat_user') || '');
  const [password, setPassword] = useState('');
  const [isJoined, setIsJoined] = useState(!!token);
  const [isGuest, setIsGuest] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [error, setError] = useState('');

  // WebSocket hook now takes the token!
  const { messages, status, sendMessage } = useWebSocket('ws://127.0.0.1:8080/ws', token);

  const [currentRoom, setCurrentRoom] = useState('General');
  const [input, setInput] = useState('');
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [newRoomName, setNewRoomName] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isJoined) scrollToBottom();
  }, [messages, currentRoom, isJoined]);

  // --- API LOGIC ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = authMode === 'login' ? '/api/login' : '/api/signup';

    try {
      const response = await fetch(`http://127.0.0.1:8080${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Authentication failed');

      if (authMode === 'signup') {
        setAuthMode('login');
        setError('Account created! Please login.');
        return;
      }

      // Login successful
      localStorage.setItem('chat_token', data.token);
      localStorage.setItem('chat_user', username);
      setToken(data.token);
      setIsJoined(true);
      setIsGuest(false);
      joinRoom('General');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGuestEntry = () => {
    setUsername('Guest');
    setIsGuest(true);
    setIsJoined(true);
    setToken('');
    joinRoom('General');
  };

  const handleLogout = () => {
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_user');
    window.location.reload(); // Quickest way to reset all states
  };

  const joinRoom = (roomName) => {
    setCurrentRoom(roomName);
    if (!rooms.includes(roomName)) {
      setRooms(prev => [...prev, roomName]);
    }
    sendMessage("join", roomName, username, "");
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (isGuest) return; // Prevention
    if (input.trim()) {
      sendMessage("chat", currentRoom, username, input);
      setInput('');
    }
  };

  const AmbientBackground = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#050505]">
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-rose-600/10 blur-[150px] mix-blend-screen" />
      <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-emerald-600/10 blur-[100px] mix-blend-screen" />
    </div>
  );

  // 1. AUTH SCREEN
  if (!isJoined) {
    return (
      <div className="flex h-screen items-center justify-center font-sans text-white relative p-4">
        <AmbientBackground />
        <div className="relative z-10 bg-white/5 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] border border-white/10 w-full max-w-[440px] shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-white/40 text-sm">Secure multi-room communication</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <div className="bg-rose-500/20 border border-rose-500/50 text-rose-300 px-4 py-3 rounded-xl text-xs text-center">
                {error}
              </div>
            )}
            <input
              className="w-full bg-black/40 text-white px-6 py-4 rounded-xl outline-none border border-white/10 focus:border-indigo-500/50 transition-all placeholder-white/20"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              className="w-full bg-black/40 text-white px-6 py-4 rounded-xl outline-none border border-white/10 focus:border-indigo-500/50 transition-all placeholder-white/20"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20">
              {authMode === 'login' ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-4">
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-white/40 hover:text-white text-sm transition-colors"
            >
              {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </button>
            <div className="w-full h-[1px] bg-white/5" />
            <button
              onClick={handleGuestEntry}
              className="text-indigo-400/60 hover:text-indigo-400 text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Continue as Guest (Read Only)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. MAIN CHAT (Filtered Messages)
  const uniqueMessages = messages
    .filter(m => m.room === currentRoom)
    .filter((msg, index, self) =>
      index === self.findIndex((t) => t.timestamp === msg.timestamp)
    );

  return (
    <div className="flex h-screen items-center justify-center p-4 sm:p-6 font-sans text-white relative">
      <AmbientBackground />
      <div className="flex w-full max-w-7xl h-full max-h-[90vh] bg-black/40 backdrop-blur-2xl rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl">

        {/* Sidebar */}
        <div className="w-72 border-r border-white/5 flex flex-col bg-white/[0.02]">
          <div className="p-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-4 group">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${getUserColor(username).bg} ${getUserColor(username).text} border ${getUserColor(username).border}`}>
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-white/90 truncate">{username} {isGuest && <span className="text-[9px] opacity-40 ml-1">(Guest)</span>}</h2>
                <button onClick={handleLogout} className="text-[10px] text-rose-400/60 hover:text-rose-400 uppercase font-black tracking-tighter transition-colors">Logout</button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4 px-2">Secure Channels</h3>
            {rooms.map(room => (
              <button
                key={room}
                onClick={() => joinRoom(room)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${currentRoom === room ? 'bg-white/10 text-white shadow-lg' : 'text-white/50 hover:bg-white/5'}`}
              >
                <span className="font-medium"># {room}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <h3 className="font-bold text-2xl tracking-tight">Channel: <span className="text-white/40">#</span>{currentRoom}</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${status === 'Connected' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-rose-400'}`}></div>
              <span className="text-[10px] font-bold text-white/30 tracking-widest uppercase">{status}</span>
            </div>
          </div>

          <div className="flex-1 px-8 py-6 overflow-y-auto space-y-6 flex flex-col custom-scrollbar">
            {uniqueMessages.map((msg, idx) => {
              const isMe = msg.user === username;
              const color = getUserColor(msg.user);
              return (
                <div key={idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-black border ${color.bg} ${color.text} ${color.border}`}>
                      {msg.user.charAt(0).toUpperCase()}
                    </div>
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && <span className={`text-[10px] font-bold mb-1 opacity-50 uppercase tracking-wide ${color.text}`}>{msg.user}</span>}
                      <div className={`px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-indigo-500/20 text-white border border-indigo-500/30' : 'bg-white/5 text-white/90 border border-white/10'}`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input - DISABLED for Guests */}
          <div className="p-6 border-t border-white/5 bg-white/[0.02]">
            <form onSubmit={handleSend} className="flex gap-3 items-center bg-black/60 p-2 rounded-[1.5rem] border border-white/10">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isGuest}
                placeholder={isGuest ? "Login to post messages..." : `Message #${currentRoom}...`}
                className="flex-1 bg-transparent border-none px-4 py-3 outline-none text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              />
              {!isGuest && (
                <button type="submit" disabled={!input.trim()} className="bg-white/10 text-white hover:bg-white/20 px-6 py-2 rounded-xl text-xs font-bold transition-all border border-white/10">
                  SEND
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
      `}} />
    </div>
  );
}

export default App;

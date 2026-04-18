import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket';

// Dynamic color palettes
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
  const [userId, setUserId] = useState(localStorage.getItem('chat_user_id') || '');
  const [username, setUsername] = useState(localStorage.getItem('chat_user') || '');
  const [password, setPassword] = useState('');
  const [isJoined, setIsJoined] = useState(!!token);
  const [isGuest, setIsGuest] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [error, setError] = useState('');

  // --- POLISH STATES ---
  const [isRoomLoading, setIsRoomLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', visible: false });
  const chatInputRef = useRef(null);

  // WebSocket hook
  const { messages, status, sendMessage } = useWebSocket('ws://127.0.0.1:8080/ws', token);

  // --- ROOM STATE ---
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('General');
  const [input, setInput] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomIsPrivate, setNewRoomIsPrivate] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  // --- INVITE STATE ---
  const [inviteName, setInviteName] = useState('');
  const [showInviteField, setShowInviteField] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // --- TOAST HELPER ---
  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const fetchRooms = useCallback(async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('http://127.0.0.1:8080/api/rooms', { headers });
      if (response.ok) {
        const data = await response.json();
        const sortedRooms = (data || []).sort((a, b) => a.name.localeCompare(b.name));
        setRooms(sortedRooms);
      }
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      setIsLoadingRooms(false);
    }
  }, [token]);

  useEffect(() => {
    if (isJoined) {
      fetchRooms();
      scrollToBottom();
    }
  }, [messages, currentRoom, isJoined, fetchRooms]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim() || isGuest) return;

    try {
      const response = await fetch('http://127.0.0.1:8080/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newRoomName.trim(),
          description: "A custom channel",
          is_private: newRoomIsPrivate
        }),
      });

      if (response.ok) {
        setNewRoomName('');
        setNewRoomIsPrivate(false);
        fetchRooms();
        showToast(`Channel #${newRoomName} created!`);
      } else {
        const data = await response.json();
        showToast(data.message || "Failed to create room", 'error');
      }
    } catch (err) {
      showToast("Network error creating room", 'error');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteName.trim()) return;

    try {
      const response = await fetch('http://127.0.0.1:8080/api/rooms/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ room_name: currentRoom, username: inviteName.trim() }),
      });

      const data = await response.json();
      if (response.ok) {
        setInviteName('');
        setShowInviteField(false);
        showToast(`Successfully invited ${inviteName}!`, 'success');
      } else {
        showToast(data.message || "Failed to invite user", 'error');
      }
    } catch (err) {
      showToast("Error inviting user", 'error');
    }
  };

  const joinRoom = (roomName) => {
    if (roomName === currentRoom) return; // Don't reload if already in room

    setCurrentRoom(roomName);
    setShowInviteField(false);
    setIsRoomLoading(true);
    sendMessage("join", roomName, username, "");

    // Simulate slight loading delay for UX and to wait for WS sync
    setTimeout(() => {
      setIsRoomLoading(false);
      chatInputRef.current?.focus();
      scrollToBottom();
    }, 600);
  };

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

      localStorage.setItem('chat_token', data.token);
      localStorage.setItem('chat_user', username);
      localStorage.setItem('chat_user_id', data.user_id);
      setToken(data.token);
      setUserId(data.user_id);
      setIsJoined(true);
      setIsGuest(false);

      // Auto-focus input on login
      setTimeout(() => chatInputRef.current?.focus(), 500);
    } catch (err) {
      setError(err.message);
    }
  };

  const currentRoomData = rooms.find(r => r.name === currentRoom);
  const isOwner = currentRoomData?.owner_id === userId;

  const handleSend = (e) => {
    e.preventDefault();
    if (isGuest) return;
    if (input.trim()) {
      sendMessage("chat", currentRoom, username, input);
      setInput('');
      // Keep focus on input after sending
      chatInputRef.current?.focus();
    }
  };

  const AmbientBackground = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#050505]">
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-rose-600/10 blur-[150px] mix-blend-screen" />
      <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-emerald-600/10 blur-[100px] mix-blend-screen" />
    </div>
  );

  // Formatting time function for messages
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
              onClick={() => { setUsername('Guest'); setIsGuest(true); setIsJoined(true); setToken(''); }}
              className="text-indigo-400/60 hover:text-indigo-400 text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Continue as Guest (Read Only)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const uniqueMessages = messages
    .filter(m => m.room === currentRoom)
    .filter((msg, index, self) => index === self.findIndex((t) => t.timestamp === msg.timestamp));

  return (
    <div className="flex h-screen items-center justify-center p-4 sm:p-6 font-sans text-white relative">
      <AmbientBackground />

      {/* 🚀 Global Toast Notification */}
      {toast.visible && (
        <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 ${toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-100' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'}`}>
          <div className="flex items-center gap-3">
            {toast.type === 'error' ? (
              <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="flex w-full max-w-7xl h-full max-h-[90vh] bg-black/40 backdrop-blur-2xl rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl">

        {/* Sidebar */}
        <div className="w-72 border-r border-white/5 flex flex-col bg-white/[0.02]">
          <div className="p-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-4 group">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${getUserColor(username).bg} ${getUserColor(username).text} border ${getUserColor(username).border}`}>
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-white/90 truncate">{username}</h2>
                <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-[10px] text-rose-400/60 hover:text-rose-400 uppercase font-black tracking-tighter transition-colors">Logout</button>
              </div>
            </div>
          </div>

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
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${currentRoom === room.name ? 'bg-white/10 text-white shadow-lg' : 'text-white/50 hover:bg-white/5'}`}
                >
                  <span className="font-medium truncate mr-2"># {room.name}</span>
                  {room.is_private && <svg className="w-3.5 h-3.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                </button>
              ))
            )}
          </div>

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

        {/* Chat Area */}
        <div className="flex-1 flex flex-col relative">
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01] z-10">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-2xl tracking-tight"># {currentRoom}</h3>
              {isOwner && (
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

          {showInviteField && (
            <div className="mx-8 mt-4 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
              <form onSubmit={handleInvite} className="flex gap-3 items-center">
                <input autoFocus className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-indigo-500/50" placeholder="Enter username to invite..." value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
                <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 transition-colors text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">Send Invite</button>
                <button type="button" onClick={() => setShowInviteField(false)} className="text-white/30 hover:text-white transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </form>
            </div>
          )}

          {/* 🚀 Dynamic Message Area */}
          <div className="flex-1 px-8 py-6 overflow-y-auto space-y-6 flex flex-col custom-scrollbar">

            {isRoomLoading ? (
              // Loading State UI
              <div className="flex-1 flex flex-col items-center justify-center opacity-70">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs uppercase tracking-widest font-bold text-indigo-400">Loading {currentRoom}...</p>
              </div>
            ) : uniqueMessages.length === 0 ? (
              // Empty State UI
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 mt-10">
                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-4 border border-white/10">
                  <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <h4 className="text-lg font-bold text-white mb-1">Welcome to # {currentRoom}</h4>
                <p className="text-sm text-white/50">There are no messages here yet. Break the ice!</p>
              </div>
            ) : (
              // Message List
              uniqueMessages.map((msg, idx) => {
                const isMe = msg.user === username;
                const color = getUserColor(msg.user);
                return (
                  <div key={idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-3 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-black border ${color.bg} ${color.text} ${color.border}`}>{msg.user.charAt(0).toUpperCase()}</div>
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && (
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className={`text-[10px] font-bold opacity-80 uppercase tracking-wide ${color.text}`}>{msg.user}</span>
                            <span className="text-[9px] text-white/30">{formatTime(msg.timestamp)}</span>
                          </div>
                        )}
                        <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-indigo-500/20 text-white border border-indigo-500/30 rounded-tr-sm' : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-sm'}`}>
                          {msg.content}
                        </div>
                        {isMe && <span className="text-[9px] text-white/30 mt-1">{formatTime(msg.timestamp)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 border-t border-white/5 bg-white/[0.02]">
            <form onSubmit={handleSend} className="flex gap-3 items-center bg-black/60 p-2 rounded-[1.5rem] border border-white/10 focus-within:border-indigo-500/50 transition-colors">
              <input
                ref={chatInputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isGuest}
                placeholder={isGuest ? "Login to post..." : `Message # ${currentRoom}...`}
                className="flex-1 bg-transparent border-none px-4 py-3 outline-none text-white text-sm disabled:opacity-30"
              />
              {!isGuest && <button type="submit" disabled={!input.trim()} className="bg-white/10 text-white hover:bg-white/20 px-6 py-2 rounded-xl text-xs font-bold transition-all border border-white/10 uppercase disabled:opacity-30 disabled:hover:bg-white/10">Send</button>}
            </form>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; } .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); }` }} />
    </div>
  );
}

export default App;
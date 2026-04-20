import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket';

// Components
import AmbientBackground from './components/common/AmbientBackground';
import Toast from './components/common/Toast';
import AuthScreen from './components/auth/AuthScreen';
import Sidebar from './components/sidebar/Sidebar';
import ChatArea from './components/chat/ChatArea';

const App = () => {
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

    const handleIncomingMessage = useCallback((data, setMessagesFunc) => {
        if (data.type === 'error') {
            showToast(data.content, "error");
            return;
        }

        if (data.type === 'typing') {
            const { room, user } = data;
            if (user === username) return;

            setTypingUsers(prev => ({
                ...prev,
                [room]: Array.from(new Set([...(prev[room] || []), user]))
            }));

            const timeoutKey = `${room}-${user}`;
            if (typingTimeouts.current[timeoutKey]) {
                clearTimeout(typingTimeouts.current[timeoutKey]);
            }
            
            typingTimeouts.current[timeoutKey] = setTimeout(() => {
                setTypingUsers(prev => {
                    const roomUsers = (prev[room] || []).filter(u => u !== user);
                    return { ...prev, [room]: roomUsers };
                });
            }, 3000);
            return;
        }

        if (data.type === 'reaction' || data.type === 'remove_reaction') {
            try {
                const reactionData = JSON.parse(data.content);
                const msgId = reactionData.message_id;

                const applyReaction = (prevMsgs) => prevMsgs.map(m => {
                    if (m.id !== msgId) return m;

                    let newReactions = m.reactions || [];
                    if (data.type === 'reaction') {
                        if (!newReactions.some(r => r.user_id === reactionData.user_id && r.emoji === reactionData.emoji)) {
                            newReactions = [...newReactions, { ...reactionData, user: data.user || reactionData.username }];
                        }
                    } else {
                        newReactions = newReactions.filter(r => !(r.user_id === reactionData.user_id && r.emoji === reactionData.emoji));
                    }
                    return { ...m, reactions: newReactions };
                });
                
                setMessagesFunc(applyReaction);
                setDMHistory(applyReaction);
            } catch (err) {
                console.error("Failed to parse reaction:", err);
            }
            return;
        }

        // Clear loading spinner instantly if history for this room starts arriving
        if (loadingRoomRef.current === data.room) {
            setIsRoomLoading(false);
            loadingRoomRef.current = null;
            setTimeout(scrollToBottom, 50);
        }

        // Standard chat message
        setMessagesFunc(prev => [...prev, data]);
    }, [username]);

    // WebSocket hook
    const { messages, setMessages, status, sendMessage } = useWebSocket('ws://127.0.0.1:8080/ws', token, handleIncomingMessage);

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

    // --- DM STATE ---
    const [potentialPartners, setPotentialPartners] = useState([]);
    const [activeDMUser, setActiveDMUser] = useState(null);
    const [dmHistory, setDMHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('rooms');

    const messagesEndRef = useRef(null);
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    // --- TOAST HELPER ---
    const showToast = (message, type = 'success') => {
        setToast({ message, type, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const [typingUsers, setTypingUsers] = useState({}); // Stores { room: [users...] }
    const typingTimeouts = useRef({}); // To clear indicators after a few seconds

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

    const loadingRoomRef = useRef(null);

    const joinRoom = (roomName) => {
        if (roomName === currentRoom && activeTab === 'rooms') return;

        setActiveTab('rooms');
        setActiveDMUser(null);
        setCurrentRoom(roomName);
        setShowInviteField(false);
        setIsRoomLoading(true);
        loadingRoomRef.current = roomName;
        sendMessage("join", roomName, username, "");

        setTimeout(() => {
            setIsRoomLoading(false);
            chatInputRef.current?.focus();
            scrollToBottom();
        }, 2000); // 2-second safe fallback for empty rooms
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

            setTimeout(() => chatInputRef.current?.focus(), 500);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (isGuest || !input.trim()) return;

        if (activeTab === 'dm' && activeDMUser) {
            sendMessage("dm", activeDMUser.id, username, input.trim());
        } else {
            sendMessage("chat", currentRoom, username, input.trim());
        }

        setInput('');
        chatInputRef.current?.focus();
    };

    const fetchPotentialPartners = useCallback(async () => {
        try {
            const response = await fetch('http://127.0.0.1:8080/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPotentialPartners(data || []);
            }
        } catch (err) {
            console.error("Failed to fetch users:", err);
        }
    }, [token]);

    const startDM = useCallback(async (user) => {
        setActiveTab('dm');
        setActiveDMUser(user);
        setCurrentRoom('');
        setIsRoomLoading(true);

        try {
            const response = await fetch(`http://127.0.0.1:8080/api/dm/history/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setDMHistory(data || []);
            } else {
                showToast("Failed to load chat history", "error");
            }
        } catch (err) {
            showToast("Network error loading chat history", "error");
        } finally {
            setIsRoomLoading(false);
            setTimeout(scrollToBottom, 100);
        }
    }, [token]);

    const currentRoomData = rooms.find(r => r.name === currentRoom);
    const isOwner = currentRoomData?.owner_id === userId;

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    useEffect(() => {
        if (isJoined) {
            fetchRooms();
            fetchPotentialPartners();
        }
    }, [isJoined, fetchRooms, fetchPotentialPartners]);

    useEffect(() => {
        if (isJoined) {
            scrollToBottom();
        }
    }, [messages, dmHistory, currentRoom, activeDMUser, isJoined]);

    if (!isJoined) {
        return (
            <AuthScreen
                authMode={authMode}
                setAuthMode={setAuthMode}
                username={username}
                setUsername={setUsername}
                password={password}
                setPassword={setPassword}
                handleAuth={handleAuth}
                error={error}
                onGuestEntry={() => { setUsername('Guest'); setIsGuest(true); setIsJoined(true); setToken(''); }}
                AmbientBackground={AmbientBackground}
            />
        );
    }

    const isChatMsg = (m) => !m.type || m.type === 'chat' || m.type === 'dm';
    
    const displayMessages = activeTab === 'dm'
        ? [...dmHistory, ...messages.filter(m => isChatMsg(m) && m.room === activeDMUser?.id)]
        : messages.filter(m => isChatMsg(m) && m.room === currentRoom);

    const uniqueMessages = displayMessages.filter((msg, index, self) =>
        index === self.findIndex((t) => (t.id && msg.id && t.id === msg.id) || (!t.id && t.timestamp === msg.timestamp && t.user === msg.user))
    );

    return (
        <div className="flex h-screen items-center justify-center p-4 sm:p-6 font-sans text-white relative">
            <AmbientBackground />
            <Toast toast={toast} />

            <div className="flex w-full max-w-7xl h-full max-h-[90vh] bg-black/40 backdrop-blur-2xl rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl">
                <Sidebar
                    username={username}
                    onLogout={() => { localStorage.clear(); window.location.reload(); }}
                    rooms={rooms}
                    currentRoom={currentRoom}
                    activeTab={activeTab}
                    joinRoom={joinRoom}
                    isLoadingRooms={isLoadingRooms}
                    potentialPartners={potentialPartners}
                    activeDMUser={activeDMUser}
                    startDM={startDM}
                    fetchPotentialPartners={fetchPotentialPartners}
                    isGuest={isGuest}
                    newRoomName={newRoomName}
                    setNewRoomName={setNewRoomName}
                    newRoomIsPrivate={newRoomIsPrivate}
                    setNewRoomIsPrivate={setNewRoomIsPrivate}
                    handleCreateRoom={handleCreateRoom}
                />

                <ChatArea
                    activeTab={activeTab}
                    activeDMUser={activeDMUser}
                    currentRoom={currentRoom}
                    isOwner={isOwner}
                    status={status}
                    showInviteField={showInviteField}
                    setShowInviteField={setShowInviteField}
                    messages={uniqueMessages}
                    username={username}
                    isRoomLoading={isRoomLoading}
                    formatTime={formatTime}
                    messagesEndRef={messagesEndRef}
                    input={input}
                    setInput={setInput}
                    isGuest={isGuest}
                    handleSend={handleSend}
                    chatInputRef={chatInputRef}
                    handleInvite={handleInvite}
                    inviteName={inviteName}
                    setInviteName={setInviteName}
                    sendMessage={sendMessage}
                    typingUsers={typingUsers}
                />
            </div>
        </div>
    );
};

export default App;
/* frontend/src/hooks/useWebSocket.js */
import { useState, useEffect, useCallback, useRef } from 'react';

export const useWebSocket = (url, token) => {
    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState('Disconnected');
    const socketRef = useRef(null);

    useEffect(() => {
        // Append the token if it exists
        const finalUrl = token ? `${url}?token=${token}` : url;

        const socket = new WebSocket(finalUrl);
        socketRef.current = socket;

        socket.onopen = () => setStatus('Connected');
        socket.onclose = () => setStatus('Disconnected');

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setMessages((prev) => [...prev, data]);
        };

        return () => socket.close();
    }, [url, token]); // Re-connect if the token changes (e.g. Login/Logout)

    const sendMessage = useCallback((type, room, user, content) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type, room, user, content }));
        }
    }, []);

    return { messages, status, sendMessage };
};

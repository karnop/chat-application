/* frontend/src/hooks/useWebSocket.js */
import { useState, useEffect, useCallback, useRef } from 'react';

export const useWebSocket = (url) => {
    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState('Disconnected');
    const socketRef = useRef(null);

    useEffect(() => {
        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => setStatus('Connected');
        socket.onclose = () => setStatus('Disconnected');

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // Since we get messages for many rooms, we'll keep them all
            // and filter them in the UI
            setMessages((prev) => [...prev, data]);
        };

        return () => socket.close();
    }, [url]);

    // Now we send objects instead of strings!
    const sendMessage = useCallback((type, room, user, content) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type, room, user, content }));
        }
    }, []);

    return { messages, status, sendMessage };
};

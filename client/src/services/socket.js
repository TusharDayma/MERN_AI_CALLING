/**
 * socket.js — Socket.IO singleton for the React frontend.
 * Exports getSocket() which lazily creates one connection reused across components.
 */

import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
    if (!socket) {
        const token = localStorage.getItem('token');
        socket = io('http://localhost:5000', {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5
        });

        socket.on('connect', () => {
            console.log('[Socket.IO] Connected:', socket.id);
        });

        socket.on('connect_error', (err) => {
            console.warn('[Socket.IO] Connection error:', err.message);
        });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

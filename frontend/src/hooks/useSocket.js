import { useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5050";

export default function useSocket(leadId, onUpdate) {
  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.emit('subscribe:lead', leadId);
    socket.on('score:updated', onUpdate);

    return () => {
      socket.emit('unsubscribe:lead', leadId);
      socket.disconnect();
    };
  }, [leadId, onUpdate]);
}
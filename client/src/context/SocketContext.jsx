import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      setSocket((prev) => {
        if (prev) prev.close();
        return null;
      });
      setConnected(false);
      return;
    }

    // Auth cookies are httpOnly, so they can't be read from document.cookie.
    // The browser sends them automatically with withCredentials:true and the
    // server reads accessToken from the Cookie header.
    const newSocket = io({ withCredentials: true, transports: ['websocket', 'polling'] });

    newSocket.on('connect', () => setConnected(true));
    newSocket.on('disconnect', () => setConnected(false));
    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      setConnected(false);
    };
  }, [user?._id]);

  const on = useCallback((event, handler) => {
    if (!socket) return () => {};
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [socket]);

  const off = useCallback((event, handler) => {
    if (!socket) return;
    socket.off(event, handler);
  }, [socket]);

  const emit = useCallback((event, data) => {
    if (!socket || !socket.connected) return;
    socket.emit(event, data);
  }, [socket]);

  const joinMatch = useCallback((matchId) => {
    emit('join_match_room', matchId);
  }, [emit]);

  const leaveMatch = useCallback((matchId) => {
    emit('leave_match_room', matchId);
  }, [emit]);

  const sendMessage = useCallback((matchId, content) => {
    emit('send_message', { matchId, content });
  }, [emit]);

  const sendTyping = useCallback((matchId) => {
    emit('typing', matchId);
  }, [emit]);

  const sendStopTyping = useCallback((matchId) => {
    emit('stop_typing', matchId);
  }, [emit]);

  const sendReadReceipt = useCallback((matchId) => {
    emit('read_receipt', matchId);
  }, [emit]);

  return (
    <SocketContext.Provider value={{
      socket,
      connected,
      on,
      off,
      emit,
      joinMatch,
      leaveMatch,
      sendMessage,
      sendTyping,
      sendStopTyping,
      sendReadReceipt
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
}

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { Message } from '../models/index.js';
import { Match } from '../models/index.js';

const userSockets = new Map();
const userMatches = new Map();

export const setupSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true
    }
  });
  
  const getCookie = (header, name) => {
    if (!header) return null;
    const m = header.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  };

  io.use(async (socket, next) => {
    try {
      // Auth cookies are httpOnly so the browser sends them automatically
      // (client connects with withCredentials:true); an explicit auth token
      // is still accepted for non-browser clients.
      const token = socket.handshake.auth?.token || getCookie(socket.handshake.headers.cookie, 'accessToken');
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, config.jwtAccessSecret);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });
  
  io.on('connection', (socket) => {
    const userId = socket.userId.toString();
    userSockets.set(userId, socket.id);
    
    socket.on('join_match_room', (matchId) => {
      socket.join(matchId);
      if (!userMatches.has(userId)) userMatches.set(userId, new Set());
      userMatches.get(userId).add(matchId);
    });
    
    socket.on('leave_match_room', (matchId) => {
      socket.leave(matchId);
      userMatches.get(userId)?.delete(matchId);
    });
    
    socket.on('send_message', async (data) => {
      try {
        const { matchId, content } = data;
        const match = await Match.findOne({
          _id: matchId,
          $or: [{ user1Id: userId }, { user2Id: userId }],
          unmatchedAt: null
        });
        
        if (!match) return;
        
        const message = await Message.create({
          matchId,
          senderId: userId,
          content: content.slice(0, 2000)
        });
        
        const populated = await Message.findById(message._id).populate('senderId', 'firstName').lean();
        
        io.to(matchId).emit('receive_message', {
          _id: populated._id,
          matchId: populated.matchId,
          senderId: populated.senderId._id,
          senderName: populated.senderId.firstName,
          content: populated.content,
          sentAt: populated.sentAt,
          readAt: populated.readAt
        });
      } catch (err) {
        console.error('Send message error:', err);
      }
    });
    
    socket.on('typing', (matchId) => {
      socket.to(matchId).emit('user_typing', { userId });
    });
    
    socket.on('stop_typing', (matchId) => {
      socket.to(matchId).emit('user_stop_typing', { userId });
    });
    
    socket.on('read_receipt', async (matchId) => {
      try {
        await Message.updateMany(
          { matchId, senderId: { $ne: userId }, readAt: null },
          { $set: { readAt: new Date() } }
        );
        socket.to(matchId).emit('messages_read', { userId, matchId });
      } catch (err) {
        console.error('Read receipt error:', err);
      }
    });
    
    socket.on('disconnect', () => {
      userSockets.delete(userId);
      userMatches.delete(userId);
    });
  });
  
  return io;
};

export const getUserSocketId = (userId) => userSockets.get(userId.toString());

export const notifyNewMessage = (io, matchId, message, excludeUserId) => {
  io.to(matchId).emit('receive_message', message);
};

export const notifyMatch = (io, userId, matchData) => {
  const socketId = userSockets.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit('new_match', matchData);
  }
};
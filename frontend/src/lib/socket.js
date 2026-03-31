import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  return socket;
}

export function connectSocket(token) {
  disconnectSocket();
  socket = io({
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

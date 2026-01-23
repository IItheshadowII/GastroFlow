import { io, Socket } from 'socket.io-client';

export type TenantRealtimeEvent = {
  type: string;
  payload?: any;
  ts: number;
};

let socket: Socket | null = null;

export const startRealtime = (opts: { tenantId: string }) => {
  const token = localStorage.getItem('gastroflow_token');
  if (!token) return;
  if (!opts?.tenantId) return;

  // Avoid multiple connections
  if (socket?.connected) return;

  socket = io({
    auth: { token },
    query: { tenantId: opts.tenantId },
    transports: ['websocket', 'polling'],
  });

  socket.on('tenant:event', (event: TenantRealtimeEvent) => {
    // Broadcast to the app via a DOM event so any page can subscribe.
    window.dispatchEvent(new CustomEvent('tenant:event', { detail: event }));
  });
};

export const stopRealtime = () => {
  if (!socket) return;
  try {
    socket.removeAllListeners();
    socket.disconnect();
  } finally {
    socket = null;
  }
};

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuthStore } from '@/store/useAuthStore';

interface WebSocketContextValue {
  client: Client | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  client: null,
  isConnected: false,
});

/**
 * Cung cấp một STOMP Client duy nhất, dùng chung cho toàn app.
 * Consumers lấy client qua useWebSocketClient().
 *
 * Quan trọng: client được lưu vào STATE (không chỉ ref) để đảm bảo
 * React tái render consumers và nhận instance client đúng sau khi connect.
 */
export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const clientRef = useRef<Client | null>(null);
  const [clientState, setClientState] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      if (clientRef.current?.active) {
        clientRef.current.deactivate();
      }
      clientRef.current = null;
      setClientState(null);
      setIsConnected(false);
      return;
    }

    if (clientRef.current?.active) return;

    const client = new Client({
      brokerURL:
        import.meta.env.VITE_WS_URL ||
        `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      onConnect: () => {
        console.log('[SharedWS] Connected');
        setClientState(client);
        setIsConnected(true);
      },
      onDisconnect: () => {
        console.log('[SharedWS] Disconnected');
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('[SharedWS] STOMP error:', frame.headers['message']);
        setIsConnected(false);
      },
      onWebSocketError: () => {
        console.warn('[SharedWS] WebSocket error, will retry...');
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setClientState(null);
      setIsConnected(false);
    };
  }, [token, user]);

  return (
    <WebSocketContext.Provider value={{ client: clientState, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketClient = () => useContext(WebSocketContext);

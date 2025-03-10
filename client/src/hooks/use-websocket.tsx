import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./use-auth";

type WebSocketContextType = {
  connected: boolean;
  sendMessage: (data: any) => void;
  wsRef: React.MutableRefObject<WebSocket | null>;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) {
      console.log("WebSocket: No user authenticated, skipping connection");
      return;
    }

    const sessionId = crypto.randomUUID();
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}&sessionId=${sessionId}`;

    console.log("WebSocket: Attempting connection to", wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket: Connected successfully");
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket: Received message", data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("WebSocket: Error parsing message:", error);
      }
    };

    ws.onclose = (event) => {
      console.log("WebSocket: Disconnected", { code: event.code, reason: event.reason });
      setConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket: Connection error", error);
      setConnected(false);
    };

    wsRef.current = ws;

    return () => {
      console.log("WebSocket: Cleaning up connection");
      ws.close();
    };
  }, [user]);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case "chat":
        // Handle chat message
        break;
      case "notification":
        // Handle notification
        break;
      // Add more message type handlers
    }
  };

  const sendMessage = (data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify(data);
      console.log("WebSocket: Sending message", data);
      wsRef.current.send(payload);
    } else {
      console.warn("WebSocket: Cannot send message, connection not open");
    }
  };

  return (
    <WebSocketContext.Provider value={{ connected, sendMessage, wsRef }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
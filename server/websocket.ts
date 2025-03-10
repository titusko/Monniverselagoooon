import { WebSocket, WebSocketServer } from "ws";
import { Server } from "http";
import { parse } from "url";

interface Client {
  ws: WebSocket;
  userId: number;
  sessionId: string;
}

class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<number, Client[]> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on("connection", (ws: WebSocket, request) => {
      const { userId, sessionId } = this.parseConnectionParams(request.url);
      if (!userId || !sessionId) {
        ws.close(1008, "Invalid connection parameters");
        return;
      }

      this.addClient(userId, sessionId, ws);

      ws.on("message", (data: string) => {
        this.handleMessage(userId, data);
      });

      ws.on("close", () => {
        this.removeClient(userId, sessionId);
      });

      // Send initial connection success message
      ws.send(JSON.stringify({ type: "connected", userId }));
    });
  }

  private parseConnectionParams(url: string | undefined): { userId?: number; sessionId?: string } {
    if (!url) return {};
    const { query } = parse(url, true);
    return {
      userId: query.userId ? Number(query.userId) : undefined,
      sessionId: query.sessionId as string | undefined,
    };
  }

  private addClient(userId: number, sessionId: string, ws: WebSocket) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, []);
    }
    this.clients.get(userId)?.push({ ws, userId, sessionId });
  }

  private removeClient(userId: number, sessionId: string) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      this.clients.set(
        userId,
        userClients.filter((client) => client.sessionId !== sessionId)
      );
    }
  }

  private handleMessage(userId: number, data: string) {
    try {
      const message = JSON.parse(data);
      switch (message.type) {
        case "chat":
          this.broadcastToTeam(message.teamId, {
            type: "chat",
            userId,
            content: message.content,
            timestamp: new Date().toISOString(),
          });
          break;
        case "notification":
          this.sendToUser(message.targetUserId, {
            type: "notification",
            content: message.content,
            timestamp: new Date().toISOString(),
          });
          break;
        // Add more message types as needed
      }
    } catch (error) {
      console.error("Error handling websocket message:", error);
    }
  }

  public broadcastToTeam(teamId: number, data: any) {
    // Implement logic to get team members and send to all connected clients
    // This would require database integration to get team members
  }

  public sendToUser(userId: number, data: any) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const payload = JSON.stringify(data);
      userClients.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(payload);
        }
      });
    }
  }

  public broadcastGlobal(data: any) {
    const payload = JSON.stringify(data);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
}

export let wsService: WebSocketService;

export function setupWebSocket(server: Server) {
  wsService = new WebSocketService(server);
  return wsService;
}

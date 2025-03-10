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
    this.wss = new WebSocketServer({ 
      server,
      // Add error handling for WebSocket server
      clientTracking: true,
      perMessageDeflate: false // Disable compression to avoid some potential issues
    });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    // Add error handler for the WebSocket server
    this.wss.on('error', (error) => {
      console.error('WebSocket Server Error:', error);
    });

    this.wss.on("connection", (ws: WebSocket, request) => {
      // Add error handler for each connection
      ws.on('error', (error) => {
        console.error('WebSocket Connection Error:', error);
      });

      try {
        const { userId, sessionId } = this.parseConnectionParams(request.url);
        if (!userId || !sessionId) {
          ws.close(1000, "Invalid connection parameters");
          return;
        }

        this.addClient(userId, sessionId, ws);

        ws.on("message", (data) => {
          try {
            // Handle data as buffer or string
            const message = typeof data === 'string' ? data : data.toString();
            this.handleMessage(userId, message);
          } catch (err) {
            console.error("Error processing message:", err);
          }
        });

        ws.on("close", () => {
          this.removeClient(userId, sessionId);
        });

        // Send initial connection success message
        ws.send(JSON.stringify({ type: "connected", userId }));
      } catch (err) {
        console.error("Error in WebSocket connection setup:", err);
        try {
          ws.close(1011, "Internal server error");
        } catch (closeErr) {
          console.error("Error closing WebSocket:", closeErr);
        }
      }
    });
  }

  private parseConnectionParams(url: string | undefined): { userId?: number; sessionId?: string } {
    if (!url) return {};
    try {
      const { query } = parse(url, true);
      return {
        userId: query.userId ? Number(query.userId) : undefined,
        sessionId: query.sessionId as string | undefined,
      };
    } catch (err) {
      console.error("Error parsing connection parameters:", err);
      return {};
    }
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
    // Implement a simplified version for now
    console.log(`Broadcasting to team ${teamId}: ${JSON.stringify(data)}`);
    // In a real implementation, we would fetch team members from storage
    // and send to each member individually
  }

  public sendToUser(userId: number, data: any) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const payload = JSON.stringify(data);
      userClients.forEach((client) => {
        try {
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(payload);
          }
        } catch (err) {
          console.error(`Error sending to user ${userId}:`, err);
        }
      });
    }
  }

  public broadcastGlobal(data: any) {
    const payload = JSON.stringify(data);
    this.wss.clients.forEach((client) => {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      } catch (err) {
        console.error("Error in global broadcast:", err);
      }
    });
  }
}

export let wsService: WebSocketService;

export function setupWebSocket(server: Server) {
  wsService = new WebSocketService(server);
  return wsService;
}

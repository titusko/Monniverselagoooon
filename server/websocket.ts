import { WebSocket, WebSocketServer } from "ws";
import { Server } from "http";
import { parse } from "url";
import { storage } from "./storage";
import { db } from "./db";
import { messages } from "@shared/schema";

interface Client {
  ws: WebSocket;
  userId: number;
  sessionId: string;
}

class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<number, Client[]> = new Map();

  constructor(server: Server) {
    console.log("Initializing WebSocket Service...");
    this.wss = new WebSocketServer({ 
      server,
      clientTracking: true,
      perMessageDeflate: false
    });
    this.setupWebSocket();
    console.log("WebSocket Server initialized successfully");
  }

  private setupWebSocket() {
    this.wss.on('error', (error) => {
      console.error('WebSocket Server Error:', error);
    });

    this.wss.on("connection", (ws: WebSocket, request) => {
      console.log("New WebSocket connection attempt", request.url);

      ws.on('error', (error) => {
        console.error('WebSocket Connection Error:', error);
      });

      try {
        const { userId, sessionId } = this.parseConnectionParams(request.url);
        if (!userId || !sessionId) {
          console.log("Invalid connection parameters", { userId, sessionId });
          ws.close(1000, "Invalid connection parameters");
          return;
        }

        console.log("Client connected successfully", { userId, sessionId });
        this.addClient(userId, sessionId, ws);

        ws.on("message", async (data) => {
          try {
            const message = typeof data === 'string' ? data : data.toString();
            console.log("Received message from client", { userId, message });
            await this.handleMessage(userId, message);
          } catch (err) {
            console.error("Error processing message:", err);
          }
        });

        ws.on("close", () => {
          console.log("Client disconnected", { userId, sessionId });
          this.removeClient(userId, sessionId);
        });

        ws.send(JSON.stringify({ type: "connected", userId }));
      } catch (err) {
        console.error("Error in WebSocket connection setup:", err);
        ws.close(1011, "Internal server error");
      }
    });
  }

  private parseConnectionParams(url: string | undefined): { userId?: number; sessionId?: string } {
    if (!url) return {};
    try {
      const { query } = parse(url, true);
      console.log("Parsing connection parameters", { url, query });
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
    console.log("Client added to clients map", { userId, sessionId, totalClients: this.clients.size });
  }

  private removeClient(userId: number, sessionId: string) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      this.clients.set(
        userId,
        userClients.filter((client) => client.sessionId !== sessionId)
      );
      console.log("Client removed from clients map", { userId, sessionId, remainingClients: this.clients.size });
    }
  }

  private async handleMessage(userId: number, data: string) {
    try {
      const message = JSON.parse(data);
      console.log("Processing message", { type: message.type, userId });

      switch (message.type) {
        case "chat":
          // Store the message in the database
          const [storedMessage] = await db
            .insert(messages)
            .values({
              senderId: userId,
              teamId: message.teamId,
              content: message.content,
              type: "text",
              createdAt: new Date(),
            })
            .returning();

          // Get sender info
          const sender = await storage.getUser(userId);
          console.log("Message stored and sender fetched", { messageId: storedMessage.id, sender: sender?.username });

          // Broadcast to team
          await this.broadcastToTeam(message.teamId, {
            type: "chat",
            message: {
              ...storedMessage,
              senderName: sender?.username || "Unknown",
            },
          });
          break;

        case "notification":
          this.sendToUser(message.targetUserId, {
            type: "notification",
            content: message.content,
            timestamp: new Date().toISOString(),
          });
          break;
      }
    } catch (error) {
      console.error("Error handling websocket message:", error);
    }
  }

  public async broadcastToTeam(teamId: number, data: any) {
    try {
      // Get all team members
      const teamMembers = await storage.getTeamMembers(teamId);
      console.log("Broadcasting to team", { teamId, memberCount: teamMembers.length });

      const payload = JSON.stringify(data);

      for (const member of teamMembers) {
        const userClients = this.clients.get(member.userId);
        if (userClients) {
          userClients.forEach((client) => {
            if (client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(payload);
              console.log("Message sent to team member", { userId: member.userId });
            }
          });
        }
      }
    } catch (err) {
      console.error(`Error broadcasting to team ${teamId}:`, err);
    }
  }

  public sendToUser(userId: number, data: any) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const payload = JSON.stringify(data);
      userClients.forEach((client) => {
        try {
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(payload);
            console.log("Message sent to user", { userId });
          }
        } catch (err) {
          console.error(`Error sending to user ${userId}:`, err);
        }
      });
    }
  }

  public broadcastGlobal(data: any) {
    const payload = JSON.stringify(data);
    console.log("Broadcasting global message", { clientCount: this.wss.clients.size });

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
  console.log("Setting up WebSocket service on server...");
  wsService = new WebSocketService(server);
  return wsService;
}
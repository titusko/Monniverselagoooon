import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import web3 from "./web3";
import { insertQuestSchema, insertTeamSchema } from "@shared/schema";
import { requireAdmin } from "./middleware/admin";
import { setupWebSocket } from "./websocket";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, {
      query: req.query,
      body: req.body,
      authenticated: req.isAuthenticated(),
      userId: req.user?.id,
    });

    // Log response
    const originalSend = res.send;
    res.send = function (body) {
      console.log(`Response ${res.statusCode}`, {
        url: req.url,
        userId: req.user?.id,
      });
      return originalSend.call(this, body);
    };

    next();
  });

  // Add health check endpoint
  app.get("/health", (req, res) => {
    console.log("Health check requested");
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  setupAuth(app);

  app.post("/api/connect-wallet", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { address } = req.body;
    if (!web3.isValidAddress(address)) {
      return res.status(400).send("Invalid wallet address");
    }
    const user = await storage.updateUserWallet(req.user.id, address);
    res.json(user);
  });

  app.post("/api/disconnect-wallet", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = await storage.updateUserWallet(req.user.id, null);
    res.json(user);
  });

  app.get("/api/quests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const [quests, userQuests] = await Promise.all([
      storage.getAllQuests(),
      storage.getUserQuests(req.user.id),
    ]);
    res.json({ quests, userQuests });
  });

  app.post("/api/quests", requireAdmin, async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const parsed = insertQuestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).send(parsed.error.message);
    }

    const quest = await storage.createQuest({
      ...parsed.data,
      createdBy: req.user.id,
      createdAt: new Date(),
      isActive: true,
    });
    res.status(201).json(quest);
  });

  app.post("/api/quests/:id/complete", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const questId = parseInt(req.params.id);
    if (isNaN(questId)) {
      return res.status(400).send("Invalid quest ID");
    }
    const quest = await storage.getQuest(questId);
    if (!quest) {
      return res.status(404).send("Quest not found");
    }
    if (!req.user.walletAddress) {
      return res.status(400).send("Wallet not connected");
    }
    if (quest.contractAddress) {
      const verified = await web3.verifyQuest(
        quest.contractAddress,
        req.user.walletAddress
      );
      if (!verified) {
        return res.status(400).send("Quest requirements not met");
      }
    }
    const userQuest = await storage.completeQuest(req.user.id, questId);

    // Check and update achievements
    await storage.checkAndUpdateAchievements(req.user.id);

    res.json(userQuest);
  });

  // Achievement Routes
  app.get("/api/achievements", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const [achievements, userAchievements] = await Promise.all([
      storage.getAllAchievements(),
      storage.getUserAchievements(req.user.id),
    ]);
    res.json({ achievements, userAchievements });
  });

  // Team Routes
  app.post("/api/teams", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const parsed = insertTeamSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).send(parsed.error.message);
    }

    const team = await storage.createTeam({
      ...parsed.data,
      leaderId: req.user.id,
      createdAt: new Date(),
    });

    // Add creator as team leader
    await storage.addTeamMember({
      teamId: team.id,
      userId: req.user.id,
      role: "leader",
      joinedAt: new Date(),
    });

    res.status(201).json(team);
  });

  app.get("/api/teams", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const teams = await storage.getUserTeams(req.user.id);
    res.json(teams);
  });

  app.post("/api/teams/:id/join", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const teamId = parseInt(req.params.id);
    if (isNaN(teamId)) {
      return res.status(400).send("Invalid team ID");
    }

    const team = await storage.getTeam(teamId);
    if (!team) {
      return res.status(404).send("Team not found");
    }

    const member = await storage.addTeamMember({
      teamId,
      userId: req.user.id,
      role: "member",
      joinedAt: new Date(),
    });

    // Check for team-related achievements
    await storage.checkAndUpdateAchievements(req.user.id);

    res.json(member);
  });

  app.post("/api/teams/:id/leave", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const teamId = parseInt(req.params.id);
    if (isNaN(teamId)) {
      return res.status(400).send("Invalid team ID");
    }

    await storage.removeTeamMember(teamId, req.user.id);
    res.sendStatus(200);
  });

  // Add team messages endpoint with detailed logging
  app.get("/api/teams/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const teamId = parseInt(req.params.id);
    console.log("Fetching team messages", { teamId, userId: req.user.id });

    if (isNaN(teamId)) {
      console.log("Invalid team ID provided", { teamId });
      return res.status(400).send("Invalid team ID");
    }

    try {
      // First verify user is a member of the team
      const teamMembers = await storage.getTeamMembers(teamId);
      const isMember = teamMembers.some(member => member.userId === req.user.id);

      console.log("Team membership check", { 
        teamId, 
        userId: req.user.id, 
        isMember,
        memberCount: teamMembers.length
      });

      if (!isMember) {
        return res.status(403).send("Not a team member");
      }

      // Get all messages for the team
      const teamMessages = await storage.getTeamMessages(teamId);
      console.log("Team messages retrieved", { 
        teamId, 
        messageCount: teamMessages.length 
      });

      res.json(teamMessages);
    } catch (error) {
      console.error("Error fetching team messages:", error);
      res.status(500).send("Internal server error");
    }
  });

  const httpServer = createServer(app);
  console.log("Setting up HTTP server on port 5000...");
  setupWebSocket(httpServer);
  return httpServer;
}
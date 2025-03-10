import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { web3 } from "./web3";
import { insertQuestSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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

  app.post("/api/quests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const parsed = insertQuestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).send(parsed.error.message);
    }

    const quest = await storage.createQuest(parsed.data);
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
    res.json(userQuest);
  });

  const httpServer = createServer(app);
  return httpServer;
}

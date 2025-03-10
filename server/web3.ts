
import { ethers } from "ethers";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { quests, users, userQuests } from "@shared/schema";
import { ENV } from './environment';

interface ChainConfig {
  rpcUrl: string;
  chainId: number;
  name: string;
  questSystemAddress: string;
  nftBadgeAddress: string;
}

class Web3Service {
  private providers: Map<number, ethers.JsonRpcProvider>;
  private chains: Map<number, ChainConfig>;

  constructor() {
    this.providers = new Map();
    this.chains = new Map();

    // Initialize supported chains
    this.addChain({
      rpcUrl: ENV.ETHEREUM_RPC_URL,
      chainId: 1,
      name: "Ethereum",
      questSystemAddress: ENV.ETHEREUM_QUEST_CONTRACT,
      nftBadgeAddress: ENV.ETHEREUM_BADGE_CONTRACT,
    });

    this.addChain({
      rpcUrl: ENV.POLYGON_RPC_URL,
      chainId: 137,
      name: "Polygon",
      questSystemAddress: ENV.POLYGON_QUEST_CONTRACT,
      nftBadgeAddress: ENV.POLYGON_BADGE_CONTRACT,
    });
    
    // Log available chains for debugging
    console.log(`Web3 service initialized with chains: ${Array.from(this.chains.keys()).join(', ')}`);
  }

  private addChain(config: ChainConfig) {
    this.chains.set(config.chainId, config);
    this.providers.set(config.chainId, new ethers.JsonRpcProvider(config.rpcUrl));
  }

  private getProvider(chainId: number): ethers.JsonRpcProvider {
    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(`Chain ${chainId} not supported`);
    }
    return provider;
  }

  private getQuestContract(chainId: number) {
    const config = this.chains.get(chainId);
    if (!config) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    const abi = [
      "function verifyCompletion(address user) view returns (bool)",
      "function completeQuest(uint256 questId)",
      "function isQuestCompleted(uint256 questId, address user) view returns (bool)",
    ];

    return new ethers.Contract(
      config.questSystemAddress,
      abi,
      this.getProvider(chainId)
    );
  }

  private getNFTContract(chainId: number) {
    const config = this.chains.get(chainId);
    if (!config) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    const abi = [
      "function mintBadge(address recipient, string name, string description, string imageURI, string rarity) returns (uint256)",
      "function getBadgeDetails(uint256 tokenId) view returns (tuple(string name, string description, string imageURI, string rarity))",
    ];

    return new ethers.Contract(
      config.nftBadgeAddress,
      abi,
      this.getProvider(chainId)
    );
  }

  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  async verifyQuest(
    contractAddress: string,
    userAddress: string,
    chainId: number = 1
  ): Promise<boolean> {
    try {
      const contract = this.getQuestContract(chainId);
      return await contract.verifyCompletion(userAddress);
    } catch (error) {
      console.error("Quest verification failed:", error);
      return false;
    }
  }

  async completeQuest(
    questId: number,
    userAddress: string,
    chainId: number = 1
  ): Promise<string> {
    try {
      const contract = this.getQuestContract(chainId);
      const tx = await contract.completeQuest(questId);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error("Quest completion failed:", error);
      throw error;
    }
  }

  async mintBadge(
    recipient: string,
    name: string,
    description: string,
    imageURI: string,
    rarity: string,
    chainId: number = 1
  ): Promise<number> {
    try {
      const contract = this.getNFTContract(chainId);
      const tx = await contract.mintBadge(
        recipient,
        name,
        description,
        imageURI,
        rarity
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log: any) => log.eventName === "BadgeMinted"
      );
      return event.args.tokenId;
    } catch (error) {
      console.error("Badge minting failed:", error);
      throw error;
    }
  }

  async getTransactionStatus(txHash: string, chainId: number = 1): Promise<string> {
    try {
      const provider = this.getProvider(chainId);
      const tx = await provider.getTransaction(txHash);
      if (!tx) return "not_found";

      const receipt = await tx.wait();
      return receipt.status === 1 ? "success" : "failed";
    } catch (error) {
      console.error("Transaction status check failed:", error);
      return "error";
    }
  }
}

export const web3 = new Web3Service();

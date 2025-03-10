import { ethers } from "ethers";

class Web3Service {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    // Connect to an Ethereum node (e.g. Infura)
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  }

  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  async verifyQuest(
    contractAddress: string,
    userAddress: string
  ): Promise<boolean> {
    try {
      // Simple quest verification ABI
      const abi = [
        "function verifyCompletion(address user) view returns (bool)",
      ];

      const contract = new ethers.Contract(contractAddress, abi, this.provider);
      return await contract.verifyCompletion(userAddress);
    } catch (error) {
      console.error("Quest verification failed:", error);
      return false;
    }
  }
}

export const web3 = new Web3Service();

// Temporarily fix ES Module import error in web3.ts by using CommonJS
// Stub out blockchain functionality for now, to be implemented later
export const web3Stub = {
  isConnected: false,
  
  connect: async () => {
    web3Stub.isConnected = true;
    console.log('Blockchain connection stubbed');
    return true;
  },
  
  getBalance: async (address: string) => {
    if (!web3Stub.isConnected) {
      throw new Error('Not connected to blockchain');
    }
    return '0';
  },
  
  disconnect: async () => {
    web3Stub.isConnected = false;
    console.log('Blockchain disconnected');
  }
};
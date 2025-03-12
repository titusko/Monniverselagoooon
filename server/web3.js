export const web3Stub = {
  isConnected: false,
  connect: async () => {
    web3Stub.isConnected = true;
    console.log('Blockchain connection stubbed');
    return true;
  },
  getBalance: async (address) => {
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
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { Loader2, Wallet } from "lucide-react";

export function ConnectWallet() {
  const { address, isConnecting, connect, disconnect } = useWallet();

  if (address) {
    return (
      <Button variant="outline" onClick={disconnect}>
        <Wallet className="mr-2 h-4 w-4" />
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
    );
  }

  return (
    <Button onClick={connect} disabled={isConnecting}>
      {isConnecting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Wallet className="mr-2 h-4 w-4" />
      )}
      Connect Wallet
    </Button>
  );
}

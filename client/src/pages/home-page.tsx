import { ConnectWallet } from "@/components/connect-wallet";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-16">
          <h1 className="text-4xl font-bold">Monniverse Lagoon</h1>
          <div className="flex gap-4">
            <ConnectWallet />
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>
              Logout
            </Button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Welcome back, {user?.username}!
          </h2>
          <p className="text-muted-foreground mb-8">
            Complete quests, earn rewards, and build your Web3 portfolio in the
            Monniverse ecosystem.
          </p>
          <Link href="/quests">
            <Button size="lg" className="w-full md:w-auto">
              View Available Quests
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

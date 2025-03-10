import { ConnectWallet } from "@/components/connect-wallet";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  return (
    <div 
      className="min-h-screen bg-cover bg-center relative"
      style={{
        backgroundImage: 'url("/background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-16">
          <div className="flex justify-between items-center mb-16">
            <img 
              src="/logo.png"
              alt="Monniverse Logo"
              className="h-12"
            />
            <div className="flex gap-4">
              <ConnectWallet />
              <Button variant="outline" onClick={() => logoutMutation.mutate()}>
                Logout
              </Button>
            </div>
          </div>

          <div className="max-w-2xl mx-auto text-center text-white">
            <h2 className="text-3xl font-bold mb-6">
              Welcome back, {user?.username}!
            </h2>
            <p className="text-xl mb-8">
              Complete quests, earn rewards, and build your Web3 portfolio in the
              Monniverse ecosystem.
            </p>
            <Link href="/quests">
              <Button size="lg" className="w-full md:w-auto bg-purple-600 hover:bg-purple-700">
                View Available Quests
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
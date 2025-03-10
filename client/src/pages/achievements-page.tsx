import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy,
  Star,
  Award,
  Shield,
  Zap,
  Users
} from "lucide-react";

const achievements = [
  {
    id: 1,
    name: "Early Adopter",
    description: "Joined during the platform's launch phase",
    icon: Star,
    rarity: "rare",
    unlocked: true,
  },
  {
    id: 2,
    name: "Quest Master",
    description: "Complete 10 quests",
    icon: Trophy,
    rarity: "epic",
    unlocked: false,
    progress: 3,
    total: 10,
  },
  {
    id: 3,
    name: "Team Player",
    description: "Join a team and complete a team quest",
    icon: Users,
    rarity: "common",
    unlocked: false,
  },
  {
    id: 4,
    name: "NFT Collector",
    description: "Mint your first NFT badge",
    icon: Shield,
    rarity: "rare",
    unlocked: false,
  },
  {
    id: 5,
    name: "Web3 Pioneer",
    description: "Connect your wallet and complete a blockchain quest",
    icon: Zap,
    rarity: "epic",
    unlocked: false,
  },
];

function AchievementCard({ achievement }: { achievement: typeof achievements[0] }) {
  const Icon = achievement.icon;
  const rarityColors = {
    common: "bg-slate-500",
    rare: "bg-blue-500",
    epic: "bg-purple-500",
    legendary: "bg-orange-500",
  };

  return (
    <Card className={`${!achievement.unlocked && "opacity-75"}`}>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${rarityColors[achievement.rarity]}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              {achievement.name}
              <Badge variant="outline" className="ml-2">
                {achievement.rarity}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {achievement.description}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {achievement.progress !== undefined && (
          <div className="mt-4">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{
                  width: `${(achievement.progress / achievement.total) * 100}%`,
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Progress: {achievement.progress} / {achievement.total}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AchievementsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Award className="h-8 w-8" />
        <h1 className="text-4xl font-bold">Achievements</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}

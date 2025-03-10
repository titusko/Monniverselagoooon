import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy,
  Star,
  Award,
  Shield,
  Zap,
  Users,
  Loader2
} from "lucide-react";

type Rarity = "common" | "rare" | "epic" | "legendary";

type Achievement = {
  id: number;
  name: string;
  description: string;
  type: string;
  rarity: Rarity;
  image?: string;
  requirements: any;
};

type UserAchievement = {
  id: number;
  userId: number;
  achievementId: number;
  unlockedAt: string;
};

const rarityColors: Record<Rarity, string> = {
  common: "bg-slate-500",
  rare: "bg-blue-500",
  epic: "bg-purple-500",
  legendary: "bg-orange-500",
};

const achievementIcons: Record<string, any> = {
  quest: Trophy,
  social: Users,
  web3: Shield,
  team: Star,
  special: Award,
  skill: Zap,
};

function AchievementCard({ 
  achievement, 
  unlocked,
  unlockedAt 
}: { 
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: string;
}) {
  const Icon = achievementIcons[achievement.type] || Trophy;

  return (
    <Card className={`${!unlocked && "opacity-75"}`}>
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
        {unlocked && (
          <p className="text-sm text-muted-foreground mt-2">
            Unlocked: {new Date(unlockedAt!).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AchievementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/achievements"],
    queryFn: () => apiRequest("GET", "/api/achievements").then((res) => res.json()),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const { achievements, userAchievements } = data || { achievements: [], userAchievements: [] };
  const unlockedMap = new Map(userAchievements.map(ua => [ua.achievementId, ua]));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Award className="h-8 w-8" />
        <h1 className="text-4xl font-bold">Achievements</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {achievements.map((achievement: Achievement) => (
          <AchievementCard 
            key={achievement.id} 
            achievement={achievement}
            unlocked={unlockedMap.has(achievement.id)}
            unlockedAt={unlockedMap.get(achievement.id)?.unlockedAt}
          />
        ))}
      </div>
    </div>
  );
}
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Trophy, 
  Award,
  Star,
  Activity
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>
                  <User className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{user?.username}</CardTitle>
                <p className="text-muted-foreground">Level {user?.level || 1}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Activity className="h-6 w-6 mx-auto mb-2" />
                <p className="font-semibold">{user?.experience || 0}</p>
                <p className="text-sm text-muted-foreground">Experience</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Trophy className="h-6 w-6 mx-auto mb-2" />
                <p className="font-semibold">0</p>
                <p className="text-sm text-muted-foreground">Quests Completed</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Award className="h-6 w-6 mx-auto mb-2" />
                <p className="font-semibold">0</p>
                <p className="text-sm text-muted-foreground">Achievements</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Star className="h-6 w-6 mx-auto mb-2" />
                <p className="font-semibold">{user?.reputation || 0}</p>
                <p className="text-sm text-muted-foreground">Reputation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Info */}
        <Card>
          <CardHeader>
            <CardTitle>Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            {user?.walletAddress ? (
              <p className="font-mono text-sm break-all">
                {user.walletAddress}
              </p>
            ) : (
              <p className="text-muted-foreground">
                No wallet connected
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

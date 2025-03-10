import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWallet } from "@/hooks/use-wallet";
import { Quest } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function QuestCard({ quest, completed }: { quest: Quest; completed: boolean }) {
  const { address } = useWallet();
  const { toast } = useToast();

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/quests/${quest.id}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      toast({
        title: "Quest Completed",
        description: "Congratulations! You've completed the quest",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to complete quest",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{quest.title}</CardTitle>
        <CardDescription>{quest.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span>Reward: {quest.reward}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full"
          onClick={() => completeMutation.mutate()}
          disabled={!address || completed || completeMutation.isPending}
        >
          {completeMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : completed ? (
            "Completed"
          ) : !address ? (
            "Connect Wallet to Complete"
          ) : (
            "Complete Quest"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

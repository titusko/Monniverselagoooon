import { useQuery } from "@tanstack/react-query";
import { Quest, UserQuest } from "@shared/schema";
import { QuestCard } from "@/components/quest-card";
import { Loader2 } from "lucide-react";

export default function QuestsPage() {
  const { data: questsData, isLoading } = useQuery<{
    quests: Quest[];
    userQuests: UserQuest[];
  }>({
    queryKey: ["/api/quests"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const { quests, userQuests } = questsData!;
  const completedQuestIds = new Set(
    userQuests.filter((uq) => uq.completed).map((uq) => uq.questId)
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Available Quests</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quests.map((quest) => (
          <QuestCard
            key={quest.id}
            quest={quest}
            completed={completedQuestIds.has(quest.id)}
          />
        ))}
      </div>
    </div>
  );
}

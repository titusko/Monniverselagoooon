import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuestSchema, type InsertQuest } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const questTypes = [
  { value: "nft_mint", label: "NFT Minting" },
  { value: "token_stake", label: "Token Staking" },
  { value: "governance", label: "Governance Participation" },
  { value: "social", label: "Social Interaction" },
];

const difficulties = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const rewardTypes = [
  { value: "token", label: "Token Reward" },
  { value: "nft", label: "NFT Badge" },
  { value: "xp", label: "Experience Points" },
  { value: "badge", label: "Achievement Badge" },
];

export default function QuestCreator() {
  const { toast } = useToast();

  const form = useForm<InsertQuest>({
    resolver: zodResolver(insertQuestSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "nft_mint",
      difficulty: "beginner",
      reward: "",
      rewardType: "token",
      rewardAmount: "0",
      contractAddress: "",
      chainId: 1,
      isActive: true,
    },
  });

  const createQuestMutation = useMutation({
    mutationFn: async (data: InsertQuest) => {
      const res = await apiRequest("POST", "/api/quests", {
        ...data,
        rewardAmount: data.rewardAmount ? parseFloat(data.rewardAmount) : 0,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      toast({
        title: "Quest Created",
        description: "The quest has been created successfully.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create quest",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Create New Quest</h1>

      <div className="max-w-2xl mx-auto">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => createQuestMutation.mutate(data))}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quest Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quest Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quest type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {questTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {difficulties.map((diff) => (
                          <SelectItem key={diff.value} value={diff.value}>
                            {diff.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rewardType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reward type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rewardTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rewardAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Amount</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={(e) => field.onChange(e.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contractAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Address (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={createQuestMutation.isPending}
            >
              {createQuestMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Quest
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
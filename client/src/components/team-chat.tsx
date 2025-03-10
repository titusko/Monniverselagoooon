import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Message = {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  createdAt: string;
};

interface TeamChatProps {
  teamId: number;
}

export function TeamChat({ teamId }: TeamChatProps) {
  const { user } = useAuth();
  const { connected, sendMessage, wsRef } = useWebSocket(); // Added wsRef
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch existing messages
  const { data: initialMessages } = useQuery({
    queryKey: [`/api/teams/${teamId}/messages`],
    queryFn: () => apiRequest("GET", `/api/teams/${teamId}/messages`).then(res => res.json()),
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    const handleWebSocketMessage = (event: any) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "chat" && data.message.teamId === teamId) {
          setMessages(prev => [...prev, data.message]);
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    };

    if (connected) {
      wsRef.current?.addEventListener("message", handleWebSocketMessage);
    }

    return () => {
      wsRef.current?.removeEventListener("message", handleWebSocketMessage);
    };
  }, [teamId, connected]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !connected) return;

    sendMessage({
      type: "chat",
      teamId,
      content: newMessage,
    });

    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <div className="p-4 border-b bg-muted">
        <h3 className="font-semibold">Team Chat</h3>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.senderId === user?.id ? "flex-row-reverse" : ""
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>

              <div
                className={`max-w-[70%] ${
                  message.senderId === user?.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                } rounded-lg p-3`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {message.senderId === user?.id ? "You" : message.senderName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={!connected}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!connected || !newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TeamChat;
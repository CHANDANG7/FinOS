import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MessageBubbleProps {
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
}

export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
    const isUser = role === "user";

    return (
        <div
            className={cn(
                "flex w-full mb-4",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            <div
                className={cn(
                    "flex max-w-[80%] md:max-w-[70%]",
                    isUser ? "flex-row-reverse" : "flex-row"
                )}
            >
                <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src={isUser ? "/user-avatar.png" : "/ai-avatar.png"} />
                    <AvatarFallback className={isUser ? "bg-blue-600" : "bg-indigo-600"}>
                        {isUser ? "U" : "AI"}
                    </AvatarFallback>
                </Avatar>

                <div
                    className={cn(
                        "mx-3 p-3 rounded-lg text-sm",
                        isUser
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700"
                    )}
                >
                    <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
                    {timestamp && (
                        <span className="text-[10px] opacity-50 mt-1 block text-right">
                            {timestamp}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

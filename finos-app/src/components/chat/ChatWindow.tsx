"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { InputArea } from "./InputArea";
import { PersonaSelector, Persona } from "./PersonaSelector";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

export function ChatWindow() {
    const [persona, setPersona] = useState<Persona>("professor");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: "Hello! I am FinOS. How can I assist you with your financial journey today? I can analyze markets, review your portfolio, or explain complex economic concepts.",
            timestamp: new Date().toLocaleTimeString(),
        },
    ]);

    const handleSendMessage = (content: string, files?: File[]) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: content,
            timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, newMessage]);

        // Mock AI response
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `[${persona.toUpperCase()}] I received your message: "${content}". I am analyzing the data...`,
                timestamp: new Date().toLocaleTimeString(),
            };
            setMessages((prev) => [...prev, aiResponse]);
        }, 1000);
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
                <div>
                    <h2 className="text-lg font-semibold text-white">Financial Assistant</h2>
                    <p className="text-xs text-gray-400">Powered by Custom Finance LLM</p>
                </div>
                <PersonaSelector currentPersona={persona} onPersonaChange={setPersona} />
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="max-w-3xl mx-auto space-y-6 py-4">
                    {messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            role={msg.role}
                            content={msg.content}
                            timestamp={msg.timestamp}
                        />
                    ))}
                </div>
            </ScrollArea>

            <div className="max-w-3xl mx-auto w-full">
                <InputArea onSendMessage={handleSendMessage} />
            </div>
        </div>
    );
}

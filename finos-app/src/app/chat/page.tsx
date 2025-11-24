"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, BrainCircuit, TrendingUp, PieChart, BarChart3 } from "lucide-react";
import { chatWithTenali } from "@/lib/api/tenali";

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hello! I'm Tenali, your AI financial analyst. I can help you with market analysis, portfolio insights, technical analysis, and financial education. What would you like to know?",
        },
    ]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isStreaming) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsStreaming(true);

        try {
            const stream = await chatWithTenali([...messages, userMessage]);
            const reader = stream.getReader();
            const decoder = new TextDecoder();

            let assistantMessage: Message = { role: 'assistant', content: '' };
            setMessages(prev => [...prev, assistantMessage]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                assistantMessage.content += chunk;
                setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }]);
            }
        } catch (error) {
            console.error('Tenali error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'I apologize, but I encountered an error. Please try again.',
            }]);
        } finally {
            setIsStreaming(false);
        }
    };

    const quickActions = [
        { label: 'Analyze My Portfolio', icon: PieChart, query: 'Analyze my current portfolio holdings and provide insights' },
        { label: 'Market Overview', icon: TrendingUp, query: 'Give me a comprehensive market overview for today' },
        { label: 'Nifty 50 Analysis', icon: BarChart3, query: 'Provide technical and fundamental analysis of Nifty 50' },
        { label: 'Risk Assessment', icon: BrainCircuit, query: 'Assess the risk in my current portfolio' },
    ];

    return (
        <div className="flex flex-col h-screen bg-gray-950">
            {/* Header */}
            <div className="border-b border-gray-800 p-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg">
                        <BrainCircuit className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Tenali AI</h1>
                        <p className="text-sm text-gray-400">Your Financial Intelligence Assistant</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-4 whitespace-pre-wrap ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-800 text-gray-100 border border-gray-700'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isStreaming && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="border-t border-gray-800 p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    {quickActions.map((action, i) => {
                        const Icon = action.icon;
                        return (
                            <Button
                                key={i}
                                variant="outline"
                                onClick={() => setInput(action.query)}
                                className="h-auto py-3 flex flex-col items-center gap-2 border-gray-700 bg-gray-800 hover:bg-gray-700 text-white"
                                disabled={isStreaming}
                            >
                                <Icon className="h-5 w-5 text-indigo-400" />
                                <span className="text-xs">{action.label}</span>
                            </Button>
                        );
                    })}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Ask Tenali anything about finance..."
                        className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                        disabled={isStreaming}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={isStreaming || !input.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {isStreaming ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                <p className="text-xs text-gray-500 mt-2 text-center">
                    Tenali provides educational analysis only. Not financial advice.
                </p>
            </div>
        </div>
    );
}

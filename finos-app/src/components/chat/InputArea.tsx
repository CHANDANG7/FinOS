"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Image as ImageIcon, X } from "lucide-react";

interface InputAreaProps {
    onSendMessage: (message: string, attachments?: File[]) => void;
    disabled?: boolean;
}

export function InputArea({ onSendMessage, disabled }: InputAreaProps) {
    const [input, setInput] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = () => {
        if (input.trim() || files.length > 0) {
            onSendMessage(input, files);
            setInput("");
            setFiles([]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="p-4 bg-gray-900 border-t border-gray-800">
            {files.length > 0 && (
                <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                    {files.map((file, i) => (
                        <div
                            key={i}
                            className="relative flex items-center bg-gray-800 px-3 py-1 rounded-md border border-gray-700"
                        >
                            <span className="text-xs text-gray-300 max-w-[100px] truncate">
                                {file.name}
                            </span>
                            <button
                                onClick={() => removeFile(i)}
                                className="ml-2 text-gray-500 hover:text-red-400"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex items-end gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Paperclip className="h-5 w-5" />
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.csv"
                />
                <div className="flex-1 relative">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about markets, stocks, or upload charts..."
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-indigo-500 pr-10"
                        disabled={disabled}
                    />
                </div>
                <Button
                    onClick={handleSend}
                    disabled={disabled || (!input.trim() && files.length === 0)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

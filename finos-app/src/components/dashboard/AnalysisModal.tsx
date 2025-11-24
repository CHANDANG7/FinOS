"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { chatWithTenali } from '@/lib/api/tenali';

interface AnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    prompt: string;
}

export function AnalysisModal({ isOpen, onClose, title, prompt }: AnalysisModalProps) {
    const [analysis, setAnalysis] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    // Fetch analysis when modal opens
    const fetchAnalysis = async () => {
        if (!prompt || analysis) return; // Don't refetch if already loaded

        setLoading(true);
        setError('');
        setAnalysis('');

        try {
            let fullResponse = '';
            await chatWithTenali(
                prompt,
                [],
                {},
                (chunk) => {
                    fullResponse += chunk;
                    setAnalysis(fullResponse);
                }
            );
        } catch (err) {
            setError('Failed to fetch analysis. Please ensure the Tenali API is running.');
        } finally {
            setLoading(false);
        }
    };

    // Trigger analysis when modal opens
    if (isOpen && !loading && !analysis && !error) {
        fetchAnalysis();
    }

    const handleClose = () => {
        setAnalysis('');
        setError('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                            className="text-gray-400 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="mt-4">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                            <span className="ml-3 text-gray-400">Analyzing...</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-900/20 border border-red-900 rounded-lg p-4 text-red-400">
                            {error}
                        </div>
                    )}

                    {analysis && (
                        <div className="prose prose-invert max-w-none">
                            <div className="bg-gray-800/50 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed">
                                {analysis}
                            </div>
                        </div>
                    )}

                    {!loading && !error && !analysis && (
                        <div className="text-gray-500 text-center py-8">
                            Click to start analysis...
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

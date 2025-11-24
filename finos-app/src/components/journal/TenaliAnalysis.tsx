"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuit, Loader2, TrendingUp, TrendingDown, AlertTriangle, Lightbulb } from "lucide-react";

interface Trade {
    id: string;
    symbol: string;
    trade_type: string;
    net_pnl: number | null;
    strategy: string | null;
    pre_trade_emotion: string | null;
    post_trade_emotion: string | null;
}

interface TenaliAnalysisProps {
    trades: Trade[];
}

export function TenaliAnalysis({ trades }: TenaliAnalysisProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);

    const analyzeTrading = () => {
        setIsAnalyzing(true);

        // Simulate AI analysis (in production, this would call your LLM API)
        setTimeout(() => {
            const closedTrades = trades.filter(t => t.net_pnl !== null);
            const winningTrades = closedTrades.filter(t => t.net_pnl! > 0);
            const losingTrades = closedTrades.filter(t => t.net_pnl! < 0);
            const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

            // Analyze emotions
            const emotionCounts = trades.reduce((acc, t) => {
                if (t.pre_trade_emotion) {
                    acc[t.pre_trade_emotion] = (acc[t.pre_trade_emotion] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);

            const dominantEmotion = Object.entries(emotionCounts).length > 0
                ? Object.entries(emotionCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0]
                : null;

            // Generate insights
            const insights: {
                strengths: string[];
                weaknesses: string[];
                patterns: string[];
                recommendations: string[];
            } = {
                strengths: [],
                weaknesses: [],
                patterns: [],
                recommendations: [],
            };

            if (winRate > 60) {
                insights.strengths.push("Strong win rate indicates good trade selection");
            } else if (winRate < 40) {
                insights.weaknesses.push("Low win rate suggests need for better entry criteria");
            }

            if (dominantEmotion === "Fearful" || dominantEmotion === "Anxious") {
                insights.patterns.push("High frequency of fear-based trading detected");
                insights.recommendations.push("Consider implementing a pre-trade checklist to reduce emotional decision-making");
            }

            if (dominantEmotion === "Greedy" || dominantEmotion === "Excited") {
                insights.patterns.push("Tendency towards excitement-driven trades");
                insights.recommendations.push("Set strict profit targets and stick to your trading plan");
            }

            const avgWin = winningTrades.length > 0
                ? winningTrades.reduce((sum, t) => sum + t.net_pnl!, 0) / winningTrades.length
                : 0;

            const avgLoss = losingTrades.length > 0
                ? Math.abs(losingTrades.reduce((sum, t) => sum + t.net_pnl!, 0) / losingTrades.length)
                : 0;

            if (avgLoss > avgWin) {
                insights.weaknesses.push("Average loss exceeds average win - poor risk/reward ratio");
                insights.recommendations.push("Improve your stop-loss placement and let winners run longer");
            }

            // Strategy analysis
            const strategyCounts = trades.reduce((acc, t) => {
                if (t.strategy) {
                    acc[t.strategy] = (acc[t.strategy] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);

            if (Object.keys(strategyCounts).length > 3) {
                insights.patterns.push("Using multiple strategies - may indicate lack of focus");
                insights.recommendations.push("Focus on mastering 1-2 strategies before diversifying");
            }

            // Default recommendations
            if (insights.recommendations.length === 0) {
                insights.recommendations.push("Continue maintaining your trading journal consistently");
                insights.recommendations.push("Review your trades weekly to identify patterns");
            }

            if (insights.strengths.length === 0) {
                insights.strengths.push("You're tracking your trades - that's the first step to improvement!");
            }

            setAnalysis(insights);
            setIsAnalyzing(false);
        }, 2000);
    };

    const handleAnalyze = () => {
        if (trades.length === 0) {
            alert("Please add some trades first to get analysis");
            return;
        }
        analyzeTrading();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-indigo-600 text-indigo-400 hover:bg-indigo-600/10" onClick={handleAnalyze}>
                    <BrainCircuit className="mr-2 h-4 w-4" />
                    Analyze with Tenali
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5 text-indigo-400" />
                        Tenali AI Analysis
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        AI-powered insights into your trading performance
                    </DialogDescription>
                </DialogHeader>

                {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-12 w-12 text-indigo-400 animate-spin mb-4" />
                        <p className="text-gray-400">Analyzing your trading patterns...</p>
                    </div>
                ) : analysis ? (
                    <div className="space-y-6">
                        {/* Strengths */}
                        {analysis.strengths.length > 0 && (
                            <Card className="bg-green-500/10 border-green-500/20">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3">
                                        <TrendingUp className="h-5 w-5 text-green-400 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-green-400 mb-2">Strengths</h3>
                                            <ul className="space-y-1">
                                                {analysis.strengths.map((strength: string, i: number) => (
                                                    <li key={i} className="text-sm text-gray-300">• {strength}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Weaknesses */}
                        {analysis.weaknesses.length > 0 && (
                            <Card className="bg-red-500/10 border-red-500/20">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3">
                                        <TrendingDown className="h-5 w-5 text-red-400 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-red-400 mb-2">Areas for Improvement</h3>
                                            <ul className="space-y-1">
                                                {analysis.weaknesses.map((weakness: string, i: number) => (
                                                    <li key={i} className="text-sm text-gray-300">• {weakness}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Patterns */}
                        {analysis.patterns.length > 0 && (
                            <Card className="bg-yellow-500/10 border-yellow-500/20">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-yellow-400 mb-2">Patterns Detected</h3>
                                            <ul className="space-y-1">
                                                {analysis.patterns.map((pattern: string, i: number) => (
                                                    <li key={i} className="text-sm text-gray-300">• {pattern}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Recommendations */}
                        {analysis.recommendations.length > 0 && (
                            <Card className="bg-indigo-500/10 border-indigo-500/20">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3">
                                        <Lightbulb className="h-5 w-5 text-indigo-400 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-indigo-400 mb-2">Recommendations</h3>
                                            <ul className="space-y-1">
                                                {analysis.recommendations.map((rec: string, i: number) => (
                                                    <li key={i} className="text-sm text-gray-300">• {rec}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        Click "Analyze with Tenali" to get AI-powered insights
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

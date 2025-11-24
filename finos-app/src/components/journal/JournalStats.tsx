"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, Target, DollarSign, BarChart3 } from "lucide-react";

interface Trade {
    id: string;
    symbol: string;
    net_pnl: number | null;
    strategy: string | null;
}

interface JournalStatsProps {
    trades: Trade[];
}

export function JournalStats({ trades }: JournalStatsProps) {
    // Calculate statistics
    const closedTrades = trades.filter(t => t.net_pnl !== null);
    const totalTrades = closedTrades.length;
    const winningTrades = closedTrades.filter(t => t.net_pnl! > 0);
    const losingTrades = closedTrades.filter(t => t.net_pnl! < 0);

    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.net_pnl || 0), 0);
    const avgPnl = totalTrades > 0 ? totalPnl / totalTrades : 0;

    const bestTrade = closedTrades.length > 0
        ? closedTrades.reduce((best, t) => (t.net_pnl! > (best.net_pnl || 0) ? t : best))
        : null;

    const worstTrade = closedTrades.length > 0
        ? closedTrades.reduce((worst, t) => (t.net_pnl! < (worst.net_pnl || 0) ? t : worst))
        : null;

    // Most traded symbol
    const symbolCounts = trades.reduce((acc, t) => {
        acc[t.symbol] = (acc[t.symbol] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const mostTradedSymbol = Object.entries(symbolCounts).length > 0
        ? Object.entries(symbolCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0]
        : null;

    const formatCurrency = (value: number) => {
        return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    };

    const stats = [
        {
            title: "Total Trades",
            value: totalTrades.toString(),
            icon: Activity,
            color: "text-blue-400",
            bgColor: "bg-blue-500/10",
        },
        {
            title: "Win Rate",
            value: `${winRate.toFixed(1)}%`,
            icon: Target,
            color: "text-green-400",
            bgColor: "bg-green-500/10",
        },
        {
            title: "Total P&L",
            value: formatCurrency(totalPnl),
            icon: totalPnl >= 0 ? TrendingUp : TrendingDown,
            color: totalPnl >= 0 ? "text-green-400" : "text-red-400",
            bgColor: totalPnl >= 0 ? "bg-green-500/10" : "bg-red-500/10",
        },
        {
            title: "Avg P&L",
            value: formatCurrency(avgPnl),
            icon: DollarSign,
            color: avgPnl >= 0 ? "text-green-400" : "text-red-400",
            bgColor: avgPnl >= 0 ? "bg-green-500/10" : "bg-red-500/10",
        },
        {
            title: "Best Trade",
            value: bestTrade ? formatCurrency(bestTrade.net_pnl!) : "-",
            subtitle: bestTrade?.symbol,
            icon: TrendingUp,
            color: "text-green-400",
            bgColor: "bg-green-500/10",
        },
        {
            title: "Worst Trade",
            value: worstTrade ? formatCurrency(worstTrade.net_pnl!) : "-",
            subtitle: worstTrade?.symbol,
            icon: TrendingDown,
            color: "text-red-400",
            bgColor: "bg-red-500/10",
        },
        {
            title: "Most Traded",
            value: mostTradedSymbol || "-",
            subtitle: mostTradedSymbol ? `${symbolCounts[mostTradedSymbol]} trades` : undefined,
            icon: BarChart3,
            color: "text-indigo-400",
            bgColor: "bg-indigo-500/10",
        },
        {
            title: "Win/Loss",
            value: `${winningTrades.length}/${losingTrades.length}`,
            icon: Activity,
            color: "text-gray-400",
            bgColor: "bg-gray-500/10",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <Card key={index} className="bg-gray-900 border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                <Icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${stat.color}`}>
                                {stat.value}
                            </div>
                            {stat.subtitle && (
                                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

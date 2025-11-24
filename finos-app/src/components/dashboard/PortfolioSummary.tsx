"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, DollarSign, Wallet, RefreshCw } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/context/PortfolioContext";

const data = [
    { value: 10000 },
    { value: 10500 },
    { value: 10200 },
    { value: 10800 },
    { value: 11500 },
    { value: 11200 },
    { value: 12000 },
];

export function PortfolioSummary() {
    const { totalValue, totalInvestment, totalReturn, totalReturnPercent, refreshData } = usePortfolio();
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gray-900 border-gray-800 text-white col-span-1 lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="h-6 text-xs border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300"
                        >
                            <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">
                        ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <p className={`text-xs flex items-center mt-1 ${totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {totalReturn >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                        {totalReturn >= 0 ? '+' : ''}₹{Math.abs(totalReturn).toLocaleString()} ({totalReturnPercent.toFixed(2)}%)
                    </p>
                    <div className="h-[80px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#1f2937", border: "none" }}
                                    itemStyle={{ color: "#fff" }}
                                    cursor={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#8884d8"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
                    <Wallet className="h-4 w-4 text-indigo-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        ₹{totalInvestment.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        Invested Capital
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
                    <ArrowUpRight className={`h-4 w-4 ${totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {totalReturn >= 0 ? '+' : ''}₹{Math.abs(totalReturn).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        Unrealized P&L
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

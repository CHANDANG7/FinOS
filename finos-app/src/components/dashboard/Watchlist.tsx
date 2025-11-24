"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";

export function Watchlist() {
    const { watchlist, removeFromWatchlist } = usePortfolio();

    return (
        <Card className="bg-gray-900 border-gray-800 text-white h-full">
            <CardHeader>
                <CardTitle className="text-lg">Watchlist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {watchlist.length === 0 && (
                    <div className="text-gray-500 text-center py-4">No items in watchlist</div>
                )}
                {watchlist.map((item) => (
                    <div key={item.symbol} className="flex items-center justify-between p-2 hover:bg-gray-800 rounded-lg transition group">
                        <div>
                            <div className="font-bold">{item.symbol}</div>
                            <div className="text-xs text-gray-400">{item.name}</div>
                        </div>
                        <div className="text-right flex-1 mx-4">
                            <div className="font-medium">
                                {item.price ? `₹${item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'Loading...'}
                            </div>
                            {item.change !== undefined && (
                                <div className={`text-xs flex items-center justify-end ${item.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                                    {item.change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                    {item.change.toFixed(2)} ({item.changePercent?.toFixed(2)}%)
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => removeFromWatchlist(item.symbol)}
                            className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

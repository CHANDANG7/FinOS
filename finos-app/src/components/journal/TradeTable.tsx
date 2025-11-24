"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Trade {
    id: string;
    symbol: string;
    trade_type: string;
    quantity: number;
    entry_price: number;
    exit_price: number | null;
    entry_date: string;
    exit_date: string | null;
    net_pnl: number | null;
    strategy: string | null;
    pre_trade_emotion: string | null;
    post_trade_emotion: string | null;
    notes: string | null;
}

interface TradeTableProps {
    trades: Trade[];
    onTradeUpdated: () => void;
    isLoading: boolean;
}

export function TradeTable({ trades, onTradeUpdated, isLoading }: TradeTableProps) {
    const supabase = createClient();
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this trade?")) return;

        const { error } = await supabase
            .from('trading_journal')
            .delete()
            .eq('id', id);

        if (!error) {
            onTradeUpdated();
        } else {
            alert("Failed to delete trade");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatCurrency = (value: number) => {
        return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    };

    if (isLoading) {
        return <div className="text-center py-8 text-gray-400">Loading trades...</div>;
    }

    if (trades.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No trades recorded yet</p>
                <p className="text-sm text-gray-500">Start by adding your first trade!</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border border-gray-800">
            <Table>
                <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableHead className="text-gray-400">Date</TableHead>
                        <TableHead className="text-gray-400">Symbol</TableHead>
                        <TableHead className="text-gray-400">Type</TableHead>
                        <TableHead className="text-right text-gray-400">Qty</TableHead>
                        <TableHead className="text-right text-gray-400">Entry</TableHead>
                        <TableHead className="text-right text-gray-400">Exit</TableHead>
                        <TableHead className="text-right text-gray-400">P&L</TableHead>
                        <TableHead className="text-gray-400">Strategy</TableHead>
                        <TableHead className="text-right text-gray-400">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {trades.map((trade) => (
                        <>
                            <TableRow
                                key={trade.id}
                                className="border-gray-800 hover:bg-gray-800/50 cursor-pointer"
                                onClick={() => setExpandedRow(expandedRow === trade.id ? null : trade.id)}
                            >
                                <TableCell className="text-white">{formatDate(trade.entry_date)}</TableCell>
                                <TableCell className="font-medium text-indigo-400">{trade.symbol}</TableCell>
                                <TableCell>
                                    <Badge variant={trade.trade_type === "BUY" ? "default" : "secondary"} className={trade.trade_type === "BUY" ? "bg-green-600" : "bg-red-600"}>
                                        {trade.trade_type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right text-white">{trade.quantity}</TableCell>
                                <TableCell className="text-right text-white">{formatCurrency(trade.entry_price)}</TableCell>
                                <TableCell className="text-right text-white">
                                    {trade.exit_price ? formatCurrency(trade.exit_price) : <span className="text-gray-500">Open</span>}
                                </TableCell>
                                <TableCell className="text-right">
                                    {trade.net_pnl !== null ? (
                                        <div className={`flex items-center justify-end gap-1 ${trade.net_pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                                            {trade.net_pnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                            {formatCurrency(Math.abs(trade.net_pnl))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-500">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-gray-400">{trade.strategy || "-"}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedRow(expandedRow === trade.id ? null : trade.id);
                                            }}
                                            className="text-gray-400 hover:text-white"
                                        >
                                            {expandedRow === trade.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(trade.id);
                                            }}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>

                            {/* Expanded Row */}
                            {expandedRow === trade.id && (
                                <TableRow className="border-gray-800 bg-gray-800/30">
                                    <TableCell colSpan={9} className="p-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-semibold text-indigo-400">Trade Details</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Exit Date:</span>
                                                        <span className="text-white">{trade.exit_date ? formatDate(trade.exit_date) : "Still Open"}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Pre-trade Emotion:</span>
                                                        <span className="text-white">{trade.pre_trade_emotion || "-"}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Post-trade Emotion:</span>
                                                        <span className="text-white">{trade.post_trade_emotion || "-"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-semibold text-indigo-400">Notes</h4>
                                                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                                                    {trade.notes || "No notes added"}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

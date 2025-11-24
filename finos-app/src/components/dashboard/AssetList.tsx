"use client";

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";
import { useRouter } from 'next/navigation';

export function AssetList() {
    const { assets, addAsset, removeAsset } = usePortfolio();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    // Form State
    const [symbol, setSymbol] = useState('');
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        addAsset({
            symbol: symbol.toUpperCase(),
            name,
            quantity: parseFloat(quantity),
            avgPrice: parseFloat(price)
        });
        setIsOpen(false);
        // Reset form
        setSymbol('');
        setName('');
        setQuantity('');
        setPrice('');
    };

    const handleAnalyze = () => {
        // Construct portfolio summary for analysis
        const portfolioText = assets.map(a =>
            `- ${a.symbol}: ${a.quantity} shares @ ₹${a.avgPrice} (Current: ₹${a.currentPrice || 'N/A'})`
        ).join('\n');

        router.push(`/chat?q=Analyze my portfolio:\n${encodeURIComponent(portfolioText)}`);
    };

    return (
        <div className="rounded-md border border-gray-800 bg-gray-900 text-white">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h3 className="font-semibold">Your Assets</h3>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAnalyze}
                        className="bg-purple-900/20 text-purple-400 border-purple-900 hover:bg-purple-900/40"
                    >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Analyze
                    </Button>

                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Asset
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-800 text-white">
                            <DialogHeader>
                                <DialogTitle>Add New Asset</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAdd} className="space-y-4 mt-4">
                                <div>
                                    <label className="text-sm text-gray-400">Symbol (e.g., RELIANCE.NS)</label>
                                    <Input
                                        value={symbol}
                                        onChange={e => setSymbol(e.target.value)}
                                        className="bg-gray-800 border-gray-700 text-white mt-1"
                                        placeholder="RELIANCE.NS"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400">Name</label>
                                    <Input
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="bg-gray-800 border-gray-700 text-white mt-1"
                                        placeholder="Reliance Industries"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-400">Quantity</label>
                                        <Input
                                            type="number"
                                            value={quantity}
                                            onChange={e => setQuantity(e.target.value)}
                                            className="bg-gray-800 border-gray-700 text-white mt-1"
                                            placeholder="10"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400">Avg Price (₹)</label>
                                        <Input
                                            type="number"
                                            value={price}
                                            onChange={e => setPrice(e.target.value)}
                                            className="bg-gray-800 border-gray-700 text-white mt-1"
                                            placeholder="2400"
                                            required
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                                    Add to Portfolio
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <Table>
                <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableHead className="text-gray-400">Asset</TableHead>
                        <TableHead className="text-gray-400">Price</TableHead>
                        <TableHead className="text-gray-400">Change</TableHead>
                        <TableHead className="text-gray-400">Holdings</TableHead>
                        <TableHead className="text-right text-gray-400">Value</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {assets.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                No assets added yet. Click "Add Asset" to start.
                            </TableCell>
                        </TableRow>
                    )}
                    {assets.map((asset) => (
                        <TableRow key={asset.symbol} className="border-gray-800 hover:bg-gray-800/50 group">
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 bg-gray-800">
                                        <AvatarFallback>{asset.symbol[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="text-sm font-bold">{asset.name}</div>
                                        <div className="text-xs text-gray-500">{asset.symbol}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                {asset.currentPrice ? `₹${asset.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'Loading...'}
                            </TableCell>
                            <TableCell className={asset.change && asset.change >= 0 ? "text-green-500" : "text-red-500"}>
                                {asset.change ? `${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)} (${asset.changePercent?.toFixed(2)}%)` : '-'}
                            </TableCell>
                            <TableCell>
                                <div>{asset.quantity}</div>
                                <div className="text-xs text-gray-500">Avg: ₹{asset.avgPrice.toLocaleString()}</div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                {asset.value ? `₹${asset.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                            </TableCell>
                            <TableCell>
                                <button
                                    onClick={() => removeAsset(asset.symbol)}
                                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

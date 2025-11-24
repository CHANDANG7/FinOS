"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

interface AddTradeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTradeAdded: () => void;
}

export function AddTradeDialog({ open, onOpenChange, onTradeAdded }: AddTradeDialogProps) {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        symbol: "",
        trade_type: "BUY",
        quantity: "",
        entry_price: "",
        exit_price: "",
        entry_date: "",
        exit_date: "",
        commission: "0",
        taxes: "0",
        strategy: "",
        pre_trade_emotion: "",
        post_trade_emotion: "",
        notes: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert("Please log in to add trades");
                return;
            }

            // Calculate P&L
            const quantity = parseFloat(formData.quantity);
            const entryPrice = parseFloat(formData.entry_price);
            const exitPrice = formData.exit_price ? parseFloat(formData.exit_price) : null;
            const commission = parseFloat(formData.commission);
            const taxes = parseFloat(formData.taxes);

            let netPnl = null;
            if (exitPrice) {
                const grossPnl = formData.trade_type === "BUY"
                    ? (exitPrice - entryPrice) * quantity
                    : (entryPrice - exitPrice) * quantity;
                netPnl = grossPnl - commission - taxes;
            }

            const { error } = await supabase.from('trading_journal').insert({
                user_id: user.id,
                symbol: formData.symbol.toUpperCase(),
                trade_type: formData.trade_type,
                quantity,
                entry_price: entryPrice,
                exit_price: exitPrice,
                entry_date: formData.entry_date,
                exit_date: formData.exit_date || null,
                commission,
                taxes,
                net_pnl: netPnl,
                strategy: formData.strategy || null,
                pre_trade_emotion: formData.pre_trade_emotion || null,
                post_trade_emotion: formData.post_trade_emotion || null,
                notes: formData.notes || null,
            });

            if (error) {
                console.error("Error adding trade:", error);
                alert("Failed to add trade. Please try again.");
            } else {
                // Reset form
                setFormData({
                    symbol: "",
                    trade_type: "BUY",
                    quantity: "",
                    entry_price: "",
                    exit_price: "",
                    entry_date: "",
                    exit_date: "",
                    commission: "0",
                    taxes: "0",
                    strategy: "",
                    pre_trade_emotion: "",
                    post_trade_emotion: "",
                    notes: "",
                });
                onTradeAdded();
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Trade</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Record your trade details for analysis
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Symbol */}
                        <div className="space-y-2">
                            <Label>Symbol *</Label>
                            <Input
                                placeholder="e.g., RELIANCE, TCS"
                                className="bg-gray-800 border-gray-700 text-white"
                                value={formData.symbol}
                                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                                required
                            />
                        </div>

                        {/* Trade Type */}
                        <div className="space-y-2">
                            <Label>Type *</Label>
                            <Select value={formData.trade_type} onValueChange={(value) => setFormData({ ...formData, trade_type: value })}>
                                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                    <SelectItem value="BUY">Buy</SelectItem>
                                    <SelectItem value="SELL">Sell</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Quantity */}
                        <div className="space-y-2">
                            <Label>Quantity *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="Number of shares"
                                className="bg-gray-800 border-gray-700 text-white"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                required
                            />
                        </div>

                        {/* Entry Price */}
                        <div className="space-y-2">
                            <Label>Entry Price (₹) *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="Price per share"
                                className="bg-gray-800 border-gray-700 text-white"
                                value={formData.entry_price}
                                onChange={(e) => setFormData({ ...formData, entry_price: e.target.value })}
                                required
                            />
                        </div>

                        {/* Exit Price */}
                        <div className="space-y-2">
                            <Label>Exit Price (₹)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="Leave empty if open"
                                className="bg-gray-800 border-gray-700 text-white"
                                value={formData.exit_price}
                                onChange={(e) => setFormData({ ...formData, exit_price: e.target.value })}
                            />
                        </div>

                        {/* Entry Date */}
                        <div className="space-y-2">
                            <Label>Entry Date *</Label>
                            <Input
                                type="datetime-local"
                                className="bg-gray-800 border-gray-700 text-white"
                                value={formData.entry_date}
                                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                                required
                            />
                        </div>

                        {/* Exit Date */}
                        <div className="space-y-2">
                            <Label>Exit Date</Label>
                            <Input
                                type="datetime-local"
                                className="bg-gray-800 border-gray-700 text-white"
                                value={formData.exit_date}
                                onChange={(e) => setFormData({ ...formData, exit_date: e.target.value })}
                            />
                        </div>

                        {/* Commission */}
                        <div className="space-y-2">
                            <Label>Commission (₹)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                className="bg-gray-800 border-gray-700 text-white"
                                value={formData.commission}
                                onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                            />
                        </div>

                        {/* Taxes */}
                        <div className="space-y-2">
                            <Label>Taxes (₹)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                className="bg-gray-800 border-gray-700 text-white"
                                value={formData.taxes}
                                onChange={(e) => setFormData({ ...formData, taxes: e.target.value })}
                            />
                        </div>

                        {/* Strategy */}
                        <div className="space-y-2">
                            <Label>Strategy</Label>
                            <Select value={formData.strategy} onValueChange={(value) => setFormData({ ...formData, strategy: value })}>
                                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                    <SelectValue placeholder="Select strategy" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                    <SelectItem value="Day Trading">Day Trading</SelectItem>
                                    <SelectItem value="Swing Trading">Swing Trading</SelectItem>
                                    <SelectItem value="Scalping">Scalping</SelectItem>
                                    <SelectItem value="Position Trading">Position Trading</SelectItem>
                                    <SelectItem value="Breakout">Breakout</SelectItem>
                                    <SelectItem value="Mean Reversion">Mean Reversion</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Pre-trade Emotion */}
                        <div className="space-y-2">
                            <Label>Pre-trade Emotion</Label>
                            <Select value={formData.pre_trade_emotion} onValueChange={(value) => setFormData({ ...formData, pre_trade_emotion: value })}>
                                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                    <SelectValue placeholder="How did you feel?" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                    <SelectItem value="Confident">Confident</SelectItem>
                                    <SelectItem value="Fearful">Fearful</SelectItem>
                                    <SelectItem value="Greedy">Greedy</SelectItem>
                                    <SelectItem value="Calm">Calm</SelectItem>
                                    <SelectItem value="Anxious">Anxious</SelectItem>
                                    <SelectItem value="Excited">Excited</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Post-trade Emotion */}
                        <div className="space-y-2">
                            <Label>Post-trade Emotion</Label>
                            <Select value={formData.post_trade_emotion} onValueChange={(value) => setFormData({ ...formData, post_trade_emotion: value })}>
                                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                    <SelectValue placeholder="How do you feel now?" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                    <SelectItem value="Satisfied">Satisfied</SelectItem>
                                    <SelectItem value="Regretful">Regretful</SelectItem>
                                    <SelectItem value="Relieved">Relieved</SelectItem>
                                    <SelectItem value="Frustrated">Frustrated</SelectItem>
                                    <SelectItem value="Proud">Proud</SelectItem>
                                    <SelectItem value="Disappointed">Disappointed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Trade Notes</Label>
                        <Textarea
                            placeholder="Why did you take this trade? What was your rationale? What did you learn?"
                            className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
                            {isLoading ? "Adding..." : "Add Trade"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { AddTradeDialog } from "@/components/journal/AddTradeDialog";
import { TradeTable } from "@/components/journal/TradeTable";
import { JournalStats } from "@/components/journal/JournalStats";
import { TenaliAnalysis } from "@/components/journal/TenaliAnalysis";
import { createClient } from "@/lib/supabase/client";

export default function JournalPage() {
    const [trades, setTrades] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const supabase = createClient();

    const fetchTrades = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data, error } = await supabase
                .from('trading_journal')
                .select('*')
                .eq('user_id', user.id)
                .order('entry_date', { ascending: false });

            if (!error && data) {
                setTrades(data);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchTrades();
    }, []);

    const handleTradeAdded = () => {
        fetchTrades();
        setShowAddDialog(false);
    };

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Trading Journal</h1>
                    <p className="text-gray-400 mt-1">Track, analyze, and improve your trading performance</p>
                </div>
                <div className="flex gap-3">
                    <TenaliAnalysis trades={trades} />
                    <Button onClick={() => setShowAddDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="mr-2 h-4 w-4" />
                        New Trade
                    </Button>
                </div>
            </div>

            {/* Statistics */}
            <JournalStats trades={trades} />

            {/* Trades Table */}
            <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                    <CardTitle className="text-white">Trade History</CardTitle>
                    <CardDescription className="text-gray-400">
                        All your trades in one place
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TradeTable trades={trades} onTradeUpdated={fetchTrades} isLoading={isLoading} />
                </CardContent>
            </Card>

            {/* Add Trade Dialog */}
            <AddTradeDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
                onTradeAdded={handleTradeAdded}
            />
        </div>
    );
}

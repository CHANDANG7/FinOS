"use client";

import { Button } from "@/components/ui/button";
import { AddAssetDialog } from "./AddAssetDialog";
import { Link as LinkIcon, Sparkles } from "lucide-react";

export function PortfolioHeader() {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <h2 className="text-3xl font-bold text-white">My Portfolio</h2>
                <p className="text-gray-400">Manage your holdings and analyze performance.</p>
            </div>
            <div className="flex gap-3">
                <Button variant="outline" className="border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Connect Broker
                </Button>
                <Button variant="secondary" className="bg-purple-600 hover:bg-purple-700 text-white border-none">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze with FinLLM
                </Button>
                <AddAssetDialog />
            </div>
        </div>
    );
}

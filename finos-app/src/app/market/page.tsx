"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketTable, MarketItem } from "@/components/market/MarketTable";

const indices: MarketItem[] = [
    { symbol: "^GSPC", name: "S&P 500", price: "5,234.12", change: "+24.50", changePercent: "+0.47%", volume: "2.1B" },
    { symbol: "^DJI", name: "Dow Jones", price: "39,120.80", change: "-45.20", changePercent: "-0.12%", volume: "300M" },
    { symbol: "^IXIC", name: "Nasdaq", price: "16,340.50", change: "+120.30", changePercent: "+0.74%", volume: "4.5B" },
    { symbol: "^NSEI", name: "Nifty 50", price: "22,450.00", change: "+85.00", changePercent: "+0.38%", volume: "12M" },
    { symbol: "^BSESN", name: "Sensex", price: "74,100.20", change: "+210.50", changePercent: "+0.28%", volume: "8M" },
];

const forex: MarketItem[] = [
    { symbol: "EUR/USD", name: "Euro / US Dollar", price: "1.0845", change: "+0.0020", changePercent: "+0.18%", volume: "-" },
    { symbol: "USD/JPY", name: "US Dollar / Yen", price: "151.20", change: "-0.30", changePercent: "-0.20%", volume: "-" },
    { symbol: "GBP/USD", name: "British Pound / US Dollar", price: "1.2650", change: "+0.0015", changePercent: "+0.12%", volume: "-" },
    { symbol: "USD/INR", name: "US Dollar / Indian Rupee", price: "83.45", change: "+0.05", changePercent: "+0.06%", volume: "-" },
];

const crypto: MarketItem[] = [
    { symbol: "BTC-USD", name: "Bitcoin", price: "$65,230.00", change: "+1200.00", changePercent: "+1.87%", volume: "35B" },
    { symbol: "ETH-USD", name: "Ethereum", price: "$3,450.20", change: "-25.00", changePercent: "-0.72%", volume: "15B" },
    { symbol: "SOL-USD", name: "Solana", price: "$185.40", change: "+8.50", changePercent: "+4.80%", volume: "4B" },
];

const commodities: MarketItem[] = [
    { symbol: "GC=F", name: "Gold", price: "$2,180.50", change: "+15.20", changePercent: "+0.70%", volume: "150K" },
    { symbol: "CL=F", name: "Crude Oil", price: "$81.40", change: "-0.50", changePercent: "-0.61%", volume: "300K" },
    { symbol: "SI=F", name: "Silver", price: "$24.80", change: "+0.30", changePercent: "+1.22%", volume: "80K" },
];

export default function MarketPage() {
    return (
        <div className="p-6 text-white h-full overflow-y-auto">
            <div className="mb-6">
                <h2 className="text-3xl font-bold">Market Overview</h2>
                <p className="text-gray-400">Real-time global market data.</p>
            </div>

            <Tabs defaultValue="indices" className="w-full">
                <TabsList className="bg-gray-900 border border-gray-800">
                    <TabsTrigger value="indices">Indices</TabsTrigger>
                    <TabsTrigger value="forex">Forex</TabsTrigger>
                    <TabsTrigger value="crypto">Crypto</TabsTrigger>
                    <TabsTrigger value="commodities">Commodities</TabsTrigger>
                </TabsList>
                <TabsContent value="indices" className="mt-4">
                    <MarketTable items={indices} />
                </TabsContent>
                <TabsContent value="forex" className="mt-4">
                    <MarketTable items={forex} />
                </TabsContent>
                <TabsContent value="crypto" className="mt-4">
                    <MarketTable items={crypto} />
                </TabsContent>
                <TabsContent value="commodities" className="mt-4">
                    <MarketTable items={commodities} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

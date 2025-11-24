import { PortfolioSummary } from "@/components/dashboard/PortfolioSummary";
import { AssetList } from "@/components/dashboard/AssetList";
import { Watchlist } from "@/components/dashboard/Watchlist";
import { StockSearch } from "@/components/dashboard/StockSearch";

export default function DashboardPage() {
    return (
        <div className="p-6 space-y-6 text-white h-full overflow-y-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Dashboard</h2>
                <div className="text-sm text-gray-400">Last updated: Just now</div>
            </div>

            <StockSearch />

            <PortfolioSummary />

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                    <AssetList />
                </div>
                <div>
                    <Watchlist />
                </div>
            </div>
        </div>
    );
}

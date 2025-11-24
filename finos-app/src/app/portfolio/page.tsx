import { PortfolioHeader } from "@/components/portfolio/PortfolioHeader";
import { AssetList } from "@/components/dashboard/AssetList";
import { PortfolioSummary } from "@/components/dashboard/PortfolioSummary";

export default function PortfolioPage() {
    return (
        <div className="p-6 h-full overflow-y-auto">
            <PortfolioHeader />

            <div className="space-y-8">
                <PortfolioSummary />

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">Current Holdings</h3>
                    <AssetList />
                </div>
            </div>
        </div>
    );
}

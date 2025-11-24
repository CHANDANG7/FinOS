"use client";

import { useState } from 'react';
import { Search, Plus, TrendingUp, BarChart2, MessageSquare } from 'lucide-react';
import { fetchRealTimeQuote } from '@/lib/api/marketData';
import { useRouter } from 'next/navigation';

export function StockSearch() {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const data = await fetchRealTimeQuote(query);
            setResult(data);
        } catch (err) {
            setError(`Stock not found. Try using the ticker symbol (e.g., "INFY" for Infosys, "HDFCBANK" for HDFC Bank)`);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = () => {
        if (result) {
            // Redirect to chat with pre-filled query
            // Note: You might need to implement query param handling in Chat page
            // For now, we'll just go to chat
            router.push(`/chat?q=Analyze ${result.symbol}`);
        }
    };

    const handleViewChart = () => {
        if (result) {
            // Redirect to TradingView
            const symbol = result.symbol.replace('.NS', '');
            window.open(`https://in.tradingview.com/chart/?symbol=NSE:${symbol}`, '_blank');
        }
    };

    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-6">
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search stock (e.g., RELIANCE, TCS)..."
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            {result && (
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-white">{result.symbol}</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-bold text-white">
                                    ₹{result.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                                <span className={`text-sm font-medium ${result.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {result.change >= 0 ? '+' : ''}{result.change.toFixed(2)} ({result.change_percent.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                        <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                            <div className="text-gray-400">Day High</div>
                            <div className="text-white">₹{result.day_high.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-gray-400">Day Low</div>
                            <div className="text-white">₹{result.day_low.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-gray-400">Volume</div>
                            <div className="text-white">{result.volume.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-gray-400">Prev Close</div>
                            <div className="text-white">₹{result.previous_close.toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-gray-700">
                        <button
                            onClick={handleViewChart}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                            <BarChart2 className="h-4 w-4" />
                            View Chart
                        </button>
                        <button
                            onClick={handleAnalyze}
                            className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                            <MessageSquare className="h-4 w-4" />
                            Analyze with Tenali
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

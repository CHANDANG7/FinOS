"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchRealTimeQuote } from '@/lib/api/marketData';

export interface Asset {
    symbol: string;
    name: string;
    quantity: number;
    avgPrice: number;
    currentPrice?: number;
    value?: number;
    change?: number;
    changePercent?: number;
}

export interface WatchlistItem {
    symbol: string;
    name: string;
    price?: number;
    change?: number;
    changePercent?: number;
}

interface PortfolioContextType {
    assets: Asset[];
    watchlist: WatchlistItem[];
    addAsset: (asset: Asset) => void;
    removeAsset: (symbol: string) => void;
    addToWatchlist: (symbol: string) => void;
    removeFromWatchlist: (symbol: string) => void;
    refreshData: () => Promise<void>;
    totalValue: number;
    totalInvestment: number;
    totalReturn: number;
    totalReturnPercent: number;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
    // Initial State (Empty)
    const [assets, setAssets] = useState<Asset[]>([]);
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

    // Derived Totals
    const [totalValue, setTotalValue] = useState(0);
    const [totalInvestment, setTotalInvestment] = useState(0);
    const [totalReturn, setTotalReturn] = useState(0);
    const [totalReturnPercent, setTotalReturnPercent] = useState(0);

    // Fetch live prices
    const refreshData = async () => {
        // Update Assets
        const updatedAssets = await Promise.all(assets.map(async (asset) => {
            try {
                const quote = await fetchRealTimeQuote(asset.symbol);
                return {
                    ...asset,
                    currentPrice: quote.price,
                    value: quote.price * asset.quantity,
                    change: quote.change,
                    changePercent: quote.change_percent
                };
            } catch (e) {
                return asset; // Keep old data if fetch fails
            }
        }));
        setAssets(updatedAssets);

        // Update Watchlist
        const updatedWatchlist = await Promise.all(watchlist.map(async (item) => {
            try {
                const quote = await fetchRealTimeQuote(item.symbol);
                return {
                    ...item,
                    price: quote.price,
                    change: quote.change,
                    changePercent: quote.change_percent
                };
            } catch (e) {
                return item;
            }
        }));
        setWatchlist(updatedWatchlist);
    };

    // Calculate Totals whenever assets change
    useEffect(() => {
        let invest = 0;
        let value = 0;

        assets.forEach(asset => {
            invest += asset.quantity * asset.avgPrice;
            value += (asset.currentPrice || asset.avgPrice) * asset.quantity;
        });

        setTotalInvestment(invest);
        setTotalValue(value);
        setTotalReturn(value - invest);
        setTotalReturnPercent(invest > 0 ? ((value - invest) / invest) * 100 : 0);
    }, [assets]);

    // Initial Load
    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 60000); // Auto-refresh every minute
        return () => clearInterval(interval);
    }, []);

    const addAsset = (newAsset: Asset) => {
        setAssets(prev => [...prev, newAsset]);
        refreshData(); // Fetch price for new asset
    };

    const removeAsset = (symbol: string) => {
        setAssets(prev => prev.filter(a => a.symbol !== symbol));
    };

    const addToWatchlist = (symbol: string) => {
        if (!watchlist.find(w => w.symbol === symbol)) {
            setWatchlist(prev => [...prev, { symbol, name: symbol }]);
            refreshData();
        }
    };

    const removeFromWatchlist = (symbol: string) => {
        setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
    };

    return (
        <PortfolioContext.Provider value={{
            assets,
            watchlist,
            addAsset,
            removeAsset,
            addToWatchlist,
            removeFromWatchlist,
            refreshData,
            totalValue,
            totalInvestment,
            totalReturn,
            totalReturnPercent
        }}>
            {children}
        </PortfolioContext.Provider>
    );
}

export function usePortfolio() {
    const context = useContext(PortfolioContext);
    if (context === undefined) {
        throw new Error('usePortfolio must be used within a PortfolioProvider');
    }
    return context;
}

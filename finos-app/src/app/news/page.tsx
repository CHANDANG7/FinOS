"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Search, TrendingUp, TrendingDown, Minus, ExternalLink, Brain } from "lucide-react";
import { fetchFinancialNews, getMarketNews, type NewsArticle } from "@/lib/api/news";

export default function NewsPage() {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    // Load news on mount
    useEffect(() => {
        loadNews();
    }, []);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            loadNews();
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, []);

    const loadNews = async () => {
        setLoading(true);
        try {
            const articles = await fetchFinancialNews('business', 'us');
            setNews(articles);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error loading news:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMarketNews = async (market: 'stocks' | 'crypto' | 'forex' | 'commodities') => {
        setLoading(true);
        try {
            const articles = await getMarketNews(market);
            setNews(articles);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error loading market news:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            const { searchFinancialNews } = await import('@/lib/api/news');
            const articles = await searchFinancialNews(searchQuery);
            setNews(articles);
        } catch (error) {
            console.error('Error searching news:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSentimentIcon = (sentiment?: string) => {
        switch (sentiment) {
            case 'bullish':
                return <TrendingUp className="h-4 w-4" />;
            case 'bearish':
                return <TrendingDown className="h-4 w-4" />;
            default:
                return <Minus className="h-4 w-4" />;
        }
    };

    const getSentimentColor = (sentiment?: string) => {
        switch (sentiment) {
            case 'bullish':
                return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'bearish':
                return 'bg-red-500/10 text-red-400 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Financial News</h1>
                    <p className="text-gray-400 mt-1">Real-time market news and analysis</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm text-green-400 font-medium">Live</span>
                    </div>
                    <span className="text-sm text-gray-400">
                        Updated: {lastUpdate.toLocaleTimeString()}
                    </span>
                    <Button
                        onClick={loadNews}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        className="border-gray-700"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="flex gap-2">
                <Input
                    placeholder="Search financial news..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 bg-gray-800 border-gray-700 text-white"
                />
                <Button onClick={handleSearch} className="bg-indigo-600 hover:bg-indigo-700">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-gray-800 border-gray-700">
                    <TabsTrigger value="all" onClick={() => loadNews()}>All News</TabsTrigger>
                    <TabsTrigger value="stocks" onClick={() => loadMarketNews('stocks')}>Stocks</TabsTrigger>
                    <TabsTrigger value="crypto" onClick={() => loadMarketNews('crypto')}>Crypto</TabsTrigger>
                    <TabsTrigger value="forex" onClick={() => loadMarketNews('forex')}>Forex</TabsTrigger>
                    <TabsTrigger value="commodities" onClick={() => loadMarketNews('commodities')}>Commodities</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4 mt-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-4" />
                            <p className="text-gray-400">Loading news...</p>
                        </div>
                    ) : news.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-400">No news articles found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {news.map((article, index) => (
                                <Card key={index} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                                    {article.image && (
                                        <div className="h-48 overflow-hidden">
                                            <img
                                                src={article.image}
                                                alt={article.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <Badge variant="outline" className="text-xs">
                                                {article.source}
                                            </Badge>
                                            {article.sentiment && (
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs flex items-center gap-1 ${getSentimentColor(article.sentiment)}`}
                                                >
                                                    {getSentimentIcon(article.sentiment)}
                                                    <Brain className="h-3 w-3" />
                                                    {article.sentiment}
                                                </Badge>
                                            )}
                                        </div>
                                        <CardTitle className="text-white text-lg line-clamp-2">
                                            {article.title}
                                        </CardTitle>
                                        <CardDescription className="text-gray-400 text-sm">
                                            {new Date(article.publishedAt).toLocaleString()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-300 text-sm line-clamp-3 mb-4">
                                            {article.description}
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full border-gray-700"
                                            onClick={() => window.open(article.url, '_blank')}
                                        >
                                            Read More
                                            <ExternalLink className="h-3 w-3 ml-2" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

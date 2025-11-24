import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Clock, BrainCircuit } from "lucide-react";
import Link from "next/link";

interface NewsItem {
    id: string;
    title: string;
    source: string;
    time: string;
    summary: string;
    sentiment: "Positive" | "Negative" | "Neutral";
    tags: string[];
    url: string;
}

interface NewsCardProps {
    news: NewsItem;
}

export function NewsCard({ news }: NewsCardProps) {
    const sentimentColor =
        news.sentiment === "Positive"
            ? "bg-green-900/50 text-green-300 border-green-800"
            : news.sentiment === "Negative"
                ? "bg-red-900/50 text-red-300 border-red-800"
                : "bg-gray-700/50 text-gray-300 border-gray-600";

    return (
        <Card className="bg-gray-900 border-gray-800 text-white hover:border-gray-700 transition group">
            <CardHeader>
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="font-semibold text-indigo-400">{news.source}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {news.time}
                            </span>
                        </div>
                        <CardTitle className="text-lg leading-tight group-hover:text-indigo-400 transition cursor-pointer">
                            <Link href={news.url} target="_blank">
                                {news.title}
                            </Link>
                        </CardTitle>
                    </div>
                    <Badge variant="outline" className={`${sentimentColor} flex items-center gap-1 whitespace-nowrap`}>
                        <BrainCircuit className="h-3 w-3" />
                        AI: {news.sentiment}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-400 line-clamp-3">{news.summary}</p>
            </CardContent>
            <CardFooter className="flex gap-2 flex-wrap">
                {news.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-gray-800 text-gray-400 hover:bg-gray-700">
                        #{tag}
                    </Badge>
                ))}
                <Link href={news.url} target="_blank" className="ml-auto">
                    <ExternalLink className="h-4 w-4 text-gray-500 hover:text-white" />
                </Link>
            </CardFooter>
        </Card>
    );
}

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface MarketItem {
    symbol: string;
    name: string;
    price: string;
    change: string;
    changePercent: string;
    volume: string;
}

interface MarketTableProps {
    items: MarketItem[];
}

export function MarketTable({ items }: MarketTableProps) {
    return (
        <div className="rounded-md border border-gray-800 bg-gray-900 text-white">
            <Table>
                <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableHead className="text-gray-400">Symbol</TableHead>
                        <TableHead className="text-gray-400">Name</TableHead>
                        <TableHead className="text-right text-gray-400">Price</TableHead>
                        <TableHead className="text-right text-gray-400">Change</TableHead>
                        <TableHead className="text-right text-gray-400">% Change</TableHead>
                        <TableHead className="text-right text-gray-400">Volume</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={item.symbol} className="border-gray-800 hover:bg-gray-800/50">
                            <TableCell className="font-medium text-indigo-400">{item.symbol}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right">{item.price}</TableCell>
                            <TableCell className={`text-right flex justify-end items-center gap-1 ${item.change.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
                                {item.change}
                            </TableCell>
                            <TableCell className={`text-right ${item.changePercent.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
                                <div className="flex items-center justify-end">
                                    {item.changePercent.startsWith("+") ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                    {item.changePercent}
                                </div>
                            </TableCell>
                            <TableCell className="text-right text-gray-400">{item.volume}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

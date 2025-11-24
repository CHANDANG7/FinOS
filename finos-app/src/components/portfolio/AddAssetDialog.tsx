"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { useState } from "react";

export function AddAssetDialog() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Asset
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-800">
                <DialogHeader>
                    <DialogTitle>Add New Asset</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Enter the details of the stock or asset you want to track.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right text-gray-300">
                            Symbol
                        </Label>
                        <Input
                            id="name"
                            placeholder="e.g., AAPL"
                            className="col-span-3 bg-gray-800 border-gray-700 text-white"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="quantity" className="text-right text-gray-300">
                            Quantity
                        </Label>
                        <Input
                            id="quantity"
                            type="number"
                            placeholder="0"
                            className="col-span-3 bg-gray-800 border-gray-700 text-white"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right text-gray-300">
                            Buy Price
                        </Label>
                        <Input
                            id="price"
                            type="number"
                            placeholder="0.00"
                            className="col-span-3 bg-gray-800 border-gray-700 text-white"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={() => setOpen(false)} className="bg-indigo-600 hover:bg-indigo-700">
                        Add to Portfolio
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

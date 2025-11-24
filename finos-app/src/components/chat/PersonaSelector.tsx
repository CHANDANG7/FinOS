"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { GraduationCap, TrendingUp, Briefcase, Globe } from "lucide-react";

export type Persona = "professor" | "trader" | "investor" | "hedge_fund";

interface PersonaSelectorProps {
    currentPersona: Persona;
    onPersonaChange: (persona: Persona) => void;
}

export function PersonaSelector({
    currentPersona,
    onPersonaChange,
}: PersonaSelectorProps) {
    return (
        <Select
            value={currentPersona}
            onValueChange={(value) => onPersonaChange(value as Persona)}
        >
            <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select Persona" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="professor">
                    <div className="flex items-center">
                        <GraduationCap className="mr-2 h-4 w-4 text-blue-400" />
                        <span>Professor</span>
                    </div>
                </SelectItem>
                <SelectItem value="trader">
                    <div className="flex items-center">
                        <TrendingUp className="mr-2 h-4 w-4 text-green-400" />
                        <span>Trader</span>
                    </div>
                </SelectItem>
                <SelectItem value="investor">
                    <div className="flex items-center">
                        <Briefcase className="mr-2 h-4 w-4 text-purple-400" />
                        <span>Investor</span>
                    </div>
                </SelectItem>
                <SelectItem value="hedge_fund">
                    <div className="flex items-center">
                        <Globe className="mr-2 h-4 w-4 text-gold-400" />
                        <span>Hedge Fund Mgr</span>
                    </div>
                </SelectItem>
            </SelectContent>
        </Select>
    );
}

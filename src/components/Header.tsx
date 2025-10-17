"use client";

//import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
//import Image from "next/image";
//import { Badge } from "@/components/ui/badge";

export default function Header() {
    return (
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <Link href="/">
                        <h1 className="text-2xl font-bold text-primary">TRIBU TEAM</h1>
                    </Link>

                    <nav className="flex items-center gap-6">
                        <Link href="#servicios" className="text-sm font-medium hover:text-primary transition-colors">
                            Servicios
                        </Link>

                        <Link href="/store" passHref>
                            <Button variant="outline" className="gap-2 bg-transparent">
                                <ShoppingBag className="w-4 h-4" />
                                Tienda
                            </Button>
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}
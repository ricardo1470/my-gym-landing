"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

export default function Hero() {
    const [totalDiscountCupos, setTotalDiscountCupos] = useState<number | null>(null);

    useEffect(() => {
        const fetchDiscountCupos = async () => {
            try {
                const res = await fetch("/api/cupos");
                const data = await res.json();
                setTotalDiscountCupos(data.totalDiscountedCupos || 0);
            } catch (err) {
                console.error("Error obteniendo cupos con descuento:", err);
            }
        };
        fetchDiscountCupos();
    }, []);

    const scrollToPricing = () => {
        const pricingSection = document.getElementById("pricing");
        pricingSection?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
            <Image
                src="/banner.jpg"
                fill={true}
                className="object-cover object-top"
                alt="Background image"
            />
            <div className="absolute inset-0 bg-black/50" />

            <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
                    Transforma tu cuerpo. <br className="hidden sm:block" />
                    <span className="sm:hidden"> </span>
                    <span className="text-primary">Transforma tu vida.</span>
                </h1>

                <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 px-2 sm:px-0">
                    Servicios personalizados de entrenamiento, nutrición y suplementación
                    que te llevarán al siguiente nivel
                </p>

                <Button
                    size="lg"
                    className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 bg-primary hover:bg-primary/90 mb-6 sm:mb-0"
                    onClick={scrollToPricing}
                >
                    Ver Ofertas Especiales
                </Button>

                <div className="mt-6 sm:mt-8">
                    <Badge variant="secondary" className="text-xs sm:text-sm px-3 sm:px-4 py-2 bg-red-100 text-red-700 border border-red-200 inline-block max-w-full">
                        🔥 Descuentos especiales limitados – Solo {totalDiscountCupos} cupos con descuento disponibles
                    </Badge>
                </div>

                <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-300">
                    <p>Hasta 30% de descuento en planes selectos</p>
                </div>
            </div>
        </section>
    );
}

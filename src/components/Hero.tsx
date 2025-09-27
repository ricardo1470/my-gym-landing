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
                src="/banner2.jpg"
                fill
                className="object-cover object-top"
                alt="Background image"
            />
            <div className="absolute inset-0 bg-black/50" />

            <div className="relative z-10 text-center text-white px-2 sm:px-6 lg:px-8 max-w-4xl mx-auto">

                {/* Título */}
                <h1 className="font-bold mb-4 sm:mb-6 leading-snug sm:leading-tight text-[clamp(1.5rem,5vw,3rem)] sm:text-[clamp(2rem,4vw,4rem)]">
                    <span className="block sm:hidden">
                        Transforma tu cuerpo y tu vida
                    </span>
                    <span className="hidden sm:block">
                        Transforma tu cuerpo. <br />
                        <span className="text-primary">Transforma tu vida.</span>
                    </span>
                </h1>

                {/* Párrafo */}
                <p className="mb-6 sm:mb-8 px-2 sm:px-0 mx-auto leading-relaxed text-[clamp(0.9rem,2.5vw,1.25rem)] max-w-xs sm:max-w-2xl">
                    Entrenamiento, nutrición y suplementación personalizados para llevarte al siguiente nivel
                </p>

                {/* Botón CTA */}
                <Button
                    size="lg"
                    className="text-sm sm:text-lg px-5 sm:px-8 py-3 sm:py-6 bg-primary hover:bg-primary/90 mb-6 sm:mb-0"
                    onClick={scrollToPricing}
                >
                    Ver Ofertas Especiales
                </Button>

                {/* Badge */}
                <div className="mt-6 sm:mt-8">
                    <Badge
                        variant="secondary"
                        className="text-[clamp(0.65rem,2vw,0.85rem)] sm:text-sm px-3 sm:px-4 py-1 sm:py-2 bg-red-100 text-red-700 border border-red-200 inline-block max-w-full"
                    >
                        🔥 Descuentos especiales limitados – Solo {totalDiscountCupos} cupos con descuento disponibles
                    </Badge>
                </div>

                {/* Texto pequeño */}
                <div className="mt-4 sm:mt-6 text-[clamp(0.65rem,2vw,0.85rem)] sm:text-sm text-gray-300">
                    <p>Hasta 30% de descuento en planes selectos</p>
                </div>
            </div>
        </section>
    );
}

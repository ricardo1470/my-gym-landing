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

            <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                    Transforma tu cuerpo. <br />
                    <span className="text-primary">Transforma tu vida.</span>
                </h1>

                <p className="text-xl md:text-2xl mb-8">
                    Servicios personalizados de entrenamiento, nutrición y suplementación
                    que te llevarán al siguiente nivel
                </p>

                <Button
                    size="lg"
                    className="text-lg px-8 py-6 bg-primary hover:bg-primary/90"
                    onClick={scrollToPricing}
                >
                    Ver Ofertas Especiales
                </Button>

                <div className="mt-8">
                    <Badge variant="secondary" className="text-sm px-4 py-2 bg-red-100 text-red-700 border border-red-200">
                        🔥 Descuentos especiales limitados – Solo {totalDiscountCupos} cupos con descuento disponibles
                    </Badge>
                </div>

                <div className="mt-6 text-sm text-gray-300">
                    <p>Hasta 30% de descuento en planes selectos</p>
                </div>
            </div>
        </section>
    );
}
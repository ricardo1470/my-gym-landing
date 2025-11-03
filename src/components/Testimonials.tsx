// src/components/Testimonials.tsx
"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type Testimonial = {
    name: string;
    result: string;
    quote: string;
    images: string[];
    story: string;
};

const testimonials: Testimonial[] = [
    {
        name: "Paola Calambas",
        result: "Perdí 15kg en 4 meses",
        quote: "El plan personalizado cambió completamente mi relación con el ejercicio y la comida.",
        images: ["/PaolaCalambas8.jpg", "/PaolaCalambas9.jpg", "/PaolaCalambas10.jpg" ],
        story: "Paola comenzó con la meta clara de transformar su core y mejorar su condición física. Con disciplina, constancia y acompañamiento, logró reducir grasa abdominal, tonificar sus piernas y fortalecer su abdomen. Hoy refleja la seguridad de alguien que ha tomado el control de su salud.",
    },
    {
        name: "Christopher Parra",
        result: "Ganó 8kg de músculo",
        quote: "Nunca pensé que podría lograr estos resultados. El seguimiento semanal fue clave.",
        images: ["/christopherParra6.jpg", "/christopherParra7.jpg", "/christopherParra8.jpg"],
        story: "Christopher empezó siendo delgado y sin mucha fuerza. Gracias a un plan estructurado de fuerza y nutrición, logró aumentar masa muscular de manera saludable y sostenible.",
    },
    {
        name: "Jessica Obando",
        result: "Redujo grasa abdominal y tonificó su cuerpo",
        quote: "La disciplina y constancia me ayudaron a transformar mi cuerpo y mi autoestima.",
        images: ["/JessicaObando.jpg", "/JessicaObando8.jpg", "/JessicaObando9.jpg"],
        story: "Jessica inició con el objetivo de mejorar su condición física y su salud. Con dedicación y un plan estructurado, logró reducir notablemente la grasa abdominal, tonificar su cuerpo y fortalecer su autoestima. Hoy se siente más segura y motivada para seguir cuidándose.",
    },
]

function TestimonialStaticImage({ image, alt }: { image: string; alt: string }) {
    return (
        <div className="relative w-20 h-20 mx-auto mb-4">
            <Image
                src={image}
                alt={alt}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover object-top"
            />
        </div>
    )
}

function ModalImageCarousel({ images, alt }: { images: string[]; alt: string }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="relative w-full h-[480px] mx-auto overflow-hidden rounded-lg">
            <Image
                src={images[currentIndex]}
                alt={`${alt} - Imagen ${currentIndex + 1}`}
                fill
                style={{ objectFit: "contain" }}
                className="transition-opacity duration-500 bg-gray-200"
            />

            <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                onClick={prevImage}
                aria-label="Imagen anterior"
            >
                <ChevronLeft className="w-6 h-6" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                onClick={nextImage}
                aria-label="Imagen siguiente"
            >
                <ChevronRight className="w-6 h-6" />
            </Button>

            <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
                {images.map((_, i) => (
                    <span
                        key={i}
                        className={`block w-2.5 h-2.5 rounded-full transition-colors ${i === currentIndex ? 'bg-primary' : 'bg-white/50'
                            }`}
                        onClick={() => setCurrentIndex(i)}
                    />
                ))}
            </div>
        </div>
    );
}


export default function Testimonials() {
    const [selected, setSelected] = useState<Testimonial | null>(null)

    return (
        <section className="py-20 bg-muted">
            <div className="container mx-auto px-4">
                <h2 className="text-4xl font-bold text-center mb-16 text-balance">
                    Casos de <span className="text-primary">Éxito Real</span>
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((t, index) => (
                        <Card
                            key={index}
                            className="text-center cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => setSelected(t)}
                        >
                            <CardHeader>
                                <TestimonialStaticImage
                                    image={t.images[1]}
                                    alt={t.name}
                                />
                                <CardTitle className="text-xl">{t.name}</CardTitle>
                                <CardDescription className="text-primary font-semibold text-lg">
                                    {t.result}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-center mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 fill-secondary text-secondary" />
                                    ))}
                                </div>
                                <p className="text-muted-foreground italic">&ldquo;{t.quote}&rdquo;</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Modal */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="max-w-xl p-0">
                    {selected && (
                        <>
                            <div className="p-6 sm:p-8">
                                <DialogHeader>
                                    <DialogTitle>{selected.name}</DialogTitle>
                                    <DialogDescription className="text-primary font-semibold text-lg">{selected.result}</DialogDescription>
                                </DialogHeader>
                            </div>

                            <ModalImageCarousel images={selected.images} alt={selected.name} />

                            <div className="text-center mt-4 p-6 sm:p-8 pt-0">
                                <p className="italic text-lg text-muted-foreground mb-4">&ldquo;{selected.quote}&rdquo;</p>
                                <p className="text-sm text-gray-700">{selected.story}</p>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    )
}

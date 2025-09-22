"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"

const testimonials = [
    {
        name: "Paola Calambas",
        result: "Perdí 15kg en 4 meses",
        quote:
            "El plan personalizado cambió completamente mi relación con el ejercicio y la comida.",
        images: ["/PaolaCalambas3.jpg", "/PaolaCalambas2.jpg"],
        story:
            "Paola comenzó con la meta clara de transformar su core y mejorar su condición física. Con disciplina, constancia y acompañamiento, logró reducir grasa abdominal, tonificar sus piernas y fortalecer su abdomen. Hoy refleja la seguridad de alguien que ha tomado el control de su salud.",
    },
    {
        name: "Christopher Parra",
        result: "Ganó 8kg de músculo",
        quote: "Nunca pensé que podría lograr estos resultados. El seguimiento semanal fue clave.",
        images: ["/christopherParra3.jpg", "/christopherParra2.jpg"], // 👈 agregamos ambas imágenes
        story:
            "Christopher empezó siendo delgado y sin mucha fuerza. Gracias a un plan estructurado de fuerza y nutrición, logró aumentar masa muscular de manera saludable y sostenible.",
    },
    {
        name: "Jessica Obando",
        result: "Redujo grasa abdominal y tonificó su cuerpo",
        quote:
            "La disciplina y constancia me ayudaron a transformar mi cuerpo y mi autoestima.",
        images: ["/JessicaObando3.jpg", "/JessicaObando2.jpg"], // 👈 antes y después
        story:
            "Jessica inició con el objetivo de mejorar su condición física y su salud. Con dedicación y un plan estructurado, logró reducir notablemente la grasa abdominal, tonificar su cuerpo y fortalecer su autoestima. Hoy se siente más segura y motivada para seguir cuidándose.",
    },

]

// 👇 Componente para hacer el slideshow con fade
function TestimonialImageSlider({ images, alt }: { images: string[]; alt: string }) {
    const [index, setIndex] = useState(0)

    useEffect(() => {
        if (images.length > 1) {
            const interval = setInterval(() => {
                setIndex((prev) => (prev + 1) % images.length)
            }, 2500) // cambia cada 2.5s
            return () => clearInterval(interval)
        }
    }, [images])

    return (
        <div className="relative w-20 h-20 mx-auto mb-4">
            {images.map((img, i) => (
                <Image
                    key={i}
                    src={img}
                    alt={alt}
                    width={80}
                    height={80}
                    className={`w-20 h-20 rounded-full object-cover object-top absolute top-0 left-0 transition-opacity duration-700 ${i === index ? "opacity-100" : "opacity-0"
                        }`}
                />
            ))}
        </div>
    )
}

export default function Testimonials() {
    const [selected, setSelected] = useState<typeof testimonials[0] | null>(null)

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
                                <TestimonialImageSlider images={t.images} alt={t.name} />
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
                <DialogContent className="max-w-lg">
                    {selected && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{selected.name}</DialogTitle>
                                <DialogDescription>{selected.result}</DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col items-center text-center space-y-4">
                                {selected.images.length > 1 ? (
                                    <div className="flex gap-4 justify-center">
                                        {selected.images.map((img, i) => (
                                            <Image
                                                key={i}
                                                src={img}
                                                alt={`${selected.name} ${i === 0 ? "antes" : "después"}`}
                                                width={160}
                                                height={160}
                                                className="rounded-lg object-cover"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <Image
                                        src={selected.images[0]}
                                        alt={selected.name}
                                        width={160}
                                        height={160}
                                        className="rounded-full object-cover object-top"
                                    />
                                )}
                                <p className="italic text-muted-foreground">&ldquo;{selected.quote}&rdquo;</p>
                                <p className="text-sm text-gray-700">{selected.story}</p>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    )
}

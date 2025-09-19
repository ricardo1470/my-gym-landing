"use client"

import { useState } from "react"
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
        quote: "El plan personalizado cambió completamente mi relación con el ejercicio y la comida.",
        image: "/PaolaCalambas2.jpg",
        story:
            "Con dedicación, disciplina y el acompañamiento semanal, Paola logró transformar no solo su cuerpo sino también su estilo de vida. Hoy inspira a más mujeres a dar el primer paso.",
    },
    {
        name: "Christopher Parra",
        result: "Ganó 8kg de músculo",
        quote: "Nunca pensé que podría lograr estos resultados. El seguimiento semanal fue clave.",
        image: "/christopherParra2.jpg",
        story:
            "Christopher empezó siendo delgado y sin mucha fuerza. Gracias a un plan estructurado de fuerza y nutrición, logró aumentar masa muscular de manera saludable y sostenible.",
    },
    {
        name: "Jessica Obando",
        result: "Corrió su primer maratón",
        quote:
            "De no poder correr 5 minutos a completar 42km. Los seminarios me dieron la mentalidad correcta.",
        image: "/JessicaObando2.jpg",
        story:
            "Jessica pasó de ser una corredora amateur a completar un maratón completo. Su perseverancia y la guía mental y física del programa fueron clave en su éxito.",
    },
]

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
                                <Image
                                    src={t.image}
                                    alt={t.name}
                                    width={80}
                                    height={80}
                                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover object-top"
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
                <DialogContent className="max-w-lg">
                    {selected && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{selected.name}</DialogTitle>
                                <DialogDescription>{selected.result}</DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col items-center text-center space-y-4">
                                <Image
                                    src={selected.image}
                                    alt={selected.name}
                                    width={160}
                                    height={160}
                                    className="rounded-full object-cover object-top"
                                />
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

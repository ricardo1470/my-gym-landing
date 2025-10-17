"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Star, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import Footer from '@/components/Footer';

interface Product {
    name: string
    price: string
    description: string
    image: string
    rating: number
    logo?: boolean
}

export default function TiendaPage() {
    const [cart, setCart] = useState<number>(0)

    const addToCart = () => {
        setCart((prev) => prev + 1)
    }

    const supplements: Product[] = [
        {
            name: "Creatina Monohidrato",
            price: "120000",
            description: "Aumenta fuerza y masa muscular. 100% pura.",
            image: "/creatine-supplement-product.jpg",
            rating: 5,
        },
        {
            name: "Proteína Whey Premium",
            price: "195000",
            description: "25g de proteína por servicio. Sabor chocolate.",
            image: "/whey-protein-chocolate-product.jpg",
            rating: 5,
        },
        {
            name: "BCAA 2:1:1",
            price: "135000",
            description: "Aminoácidos esenciales para recuperación muscular.",
            image: "/bcaa-amino-acids-product.jpg",
            rating: 4,
        },
        {
            name: "Pre-Entreno Explosivo",
            price: "160000",
            description: "Energía y enfoque máximo para tus entrenamientos.",
            image: "/pre-workout-energy-product.jpg",
            rating: 5,
        },
    ]

    const mensClothing: Product[] = [
        {
            name: "Camiseta TRIBU TEAM",
            price: "75000",
            description: "Camiseta deportiva con logo TRIBU. Tela transpirable.",
            image: "/tribu-mens-shirt-black.png",
            rating: 5,
            logo: true,
        },
        {
            name: "Pantaloneta Deportiva",
            price: "90000",
            description: "Pantaloneta con logo TRIBU. Secado rápido.",
            image: "/tribu-mens-shorts-black.png",
            rating: 5,
            logo: true,
        },
        {
            name: "Tank Top TRIBU",
            price: "60000",
            description: "Camiseta sin mangas con logo TRIBU.",
            image: "/tribu-mens-tank-black.png",
            rating: 4,
            logo: true,
        },
    ]

    const womensClothing: Product[] = [
        {
            name: "Top Deportivo TRIBU",
            price: "85000",
            description: "Top deportivo con logo TRIBU. Soporte medio.",
            image: "/tribu-womens-sports-bra.png",
            rating: 5,
            logo: true,
        },
        {
            name: "Leggings TRIBU TEAM",
            price: "130000",
            description: "Leggings de alto rendimiento con logo TRIBU.",
            image: "/tribu-womens-leggings.png",
            rating: 5,
            logo: true,
        },
        {
            name: "Camiseta Mujer TRIBU",
            price: "75000",
            description: "Camiseta deportiva femenina con logo TRIBU.",
            image: "/tribu-womens-shirt.png",
            rating: 4,
            logo: true,
        },
    ]

    const accessories: Product[] = [
        {
            name: "Gorra TRIBU TEAM",
            price: "50000",
            description: "Gorra ajustable con logo TRIBU bordado.",
            image: "/tribu-cap-black.png",
            rating: 5,
            logo: true,
        },
        {
            name: "Cinturón de Levantamiento",
            price: "170000",
            description: "Cinturón profesional con logo TRIBU.",
            image: "/tribu-lifting-belt.png",
            rating: 5,
            logo: true,
        },
        {
            name: "Rodilleras Deportivas",
            price: "110000",
            description: "Rodilleras de compresión con logo TRIBU.",
            image: "/tribu-knee-sleeves.png",
            rating: 4,
            logo: true,
        },
        {
            name: "Guantes de Entrenamiento",
            price: "80000",
            description: "Guantes con agarre superior y logo TRIBU.",
            image: "/tribu-training-gloves.png",
            rating: 4,
            logo: true,
        },
    ]

    const ProductCard = ({ product }: { product: Product }) => (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="p-0">
                <div className="relative h-64 overflow-hidden rounded-t-lg">
                    <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                    />
                    {product.logo && (
                        <Badge className="absolute top-2 right-2 bg-primary">
                            <Image src="/tribu-logo1.jpg" alt="TRIBU" width={16} height={16} className="mr-1 inline" />
                            TRIBU
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <span className="text-xl font-bold text-primary">${product.price}</span>
                </div>
                <CardDescription className="mb-3">{product.description}</CardDescription>
                <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={`w-4 h-4 ${i < product.rating ? "fill-secondary text-secondary" : "text-gray-300"}`}
                        />
                    ))}
                    <span className="text-sm text-muted-foreground ml-2">({product.rating}.0)</span>
                </div>
                <Button className="w-full" onClick={addToCart}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Agregar al carrito
                </Button>
            </CardContent>
        </Card>
    )

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/">
                            <Button variant="ghost" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Volver al inicio
                            </Button>
                        </Link>
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold">TRIBU TEAM Store</h1>
                        </div>
                        <Button variant="outline" className="relative bg-transparent">
                            <ShoppingCart className="w-5 h-5" />
                            {cart > 0 && (
                                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-primary">
                                    {cart}
                                </Badge>
                            )}
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-16 bg-gradient-to-r from-primary/10 to-secondary/10">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
                        Tienda Oficial <span className="text-primary">TRIBU TEAM</span>
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                        Suplementos de calidad premium y ropa deportiva exclusiva con el logo TRIBU TEAM
                    </p>
                </div>
            </section>

            {/* Products Section */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <Tabs defaultValue="supplements" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-12">
                            <TabsTrigger value="supplements">Suplementos</TabsTrigger>
                            <TabsTrigger value="mens">Ropa Hombre</TabsTrigger>
                            <TabsTrigger value="womens">Ropa Mujer</TabsTrigger>
                            <TabsTrigger value="accessories">Accesorios</TabsTrigger>
                        </TabsList>

                        <TabsContent value="supplements">
                            <div className="mb-8">
                                <h3 className="text-3xl font-bold mb-2">Suplementos Deportivos</h3>
                                <p className="text-muted-foreground">
                                    Productos de la más alta calidad para potenciar tu rendimiento y recuperación
                                </p>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {supplements.map((product, index) => (
                                    <ProductCard key={index} product={product} />
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="mens">
                            <div className="mb-8">
                                <h3 className="text-3xl font-bold mb-2">Ropa Deportiva para Hombre</h3>
                                <p className="text-muted-foreground">Diseños exclusivos TRIBU TEAM con máximo confort y estilo</p>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {mensClothing.map((product, index) => (
                                    <ProductCard key={index} product={product} />
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="womens">
                            <div className="mb-8">
                                <h3 className="text-3xl font-bold mb-2">Ropa Deportiva para Mujer</h3>
                                <p className="text-muted-foreground">Colección femenina TRIBU TEAM con diseño y funcionalidad</p>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {womensClothing.map((product, index) => (
                                    <ProductCard key={index} product={product} />
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="accessories">
                            <div className="mb-8">
                                <h3 className="text-3xl font-bold mb-2">Accesorios TRIBU TEAM</h3>
                                <p className="text-muted-foreground">
                                    Complementa tu entrenamiento con nuestros accesorios profesionales
                                </p>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {accessories.map((product, index) => (
                                    <ProductCard key={index} product={product} />
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-muted">
                <div className="container mx-auto px-4 text-center">
                    <h3 className="text-3xl font-bold mb-4">¿Necesitas asesoría personalizada?</h3>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Nuestros expertos pueden ayudarte a elegir los mejores suplementos según tus objetivos
                    </p>
                    <Link href="/">
                        <Button size="lg" className="text-lg px-8">
                            Solicitar asesoría
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    )
}

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    CheckCircle,
    Crown,
    Dumbbell,
    MessageCircle,
    Trophy
} from "lucide-react"

interface PlanFeature {
    text: string
    included: boolean
}

interface Plan {
    id: string
    name: string
    description: string
    price: number
    period: string
    popular?: boolean
    premium?: boolean
    features: PlanFeature[]
    icon: React.ReactElement
    buttonText: string
    buttonVariant: "default" | "outline" | "secondary"
}

const plans: Plan[] = [
    {
        id: "basico",
        name: "Plan Básico",
        description: "Perfecto para comenzar tu transformación",
        price: 150000,
        period: "mes",
        icon: <Dumbbell className="w-6 h-6" />,
        buttonText: "Comenzar Ahora",
        buttonVariant: "outline",
        features: [
            { text: "Rutina de entrenamiento personalizada", included: true },
            { text: "Plan nutricional básico", included: true },
            { text: "Seguimiento semanal", included: true },
            { text: "Acceso a la app móvil", included: true },
            { text: "Soporte por WhatsApp", included: true },
            { text: "Seminarios mensuales", included: false },
            { text: "Suplementación guiada", included: false },
            { text: "Asesoría nutricional avanzada", included: false },
        ]
    },
    {
        id: "premium",
        name: "Plan Premium",
        description: "La experiencia completa de transformación",
        price: 280000,
        period: "mes",
        popular: true,
        icon: <Crown className="w-6 h-6" />,
        buttonText: "¡Más Popular!",
        buttonVariant: "default",
        features: [
            { text: "Rutina de entrenamiento personalizada", included: true },
            { text: "Plan nutricional completo y detallado", included: true },
            { text: "Seguimiento semanal personalizado", included: true },
            { text: "Acceso a la app móvil", included: true },
            { text: "Soporte 24/7 por WhatsApp", included: true },
            { text: "Seminarios mensuales exclusivos", included: true },
            { text: "Suplementación guiada personalizada", included: true },
            { text: "Asesoría nutricional avanzada", included: true },
        ]
    },
    {
        id: "elite",
        name: "Plan Elite",
        description: "Para atletas y objetivos avanzados",
        price: 420000,
        period: "mes",
        premium: true,
        icon: <Trophy className="w-6 h-6" />,
        buttonText: "Ser Elite",
        buttonVariant: "secondary",
        features: [
            { text: "Todo lo incluido en Plan Premium", included: true },
            { text: "Sesiones de coaching 1:1 mensuales", included: true },
            { text: "Plan de competencia o objetivos específicos", included: true },
            { text: "Acceso prioritario a seminarios VIP", included: true },
            { text: "Análisis corporal avanzado mensual", included: true },
            { text: "Protocolo de suplementación premium", included: true },
            { text: "Soporte nutricional especializado", included: true },
            { text: "Comunidad exclusiva Elite", included: true },
        ]
    }
]

const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price)
}

const handlePlanSelection = (planId: string, planName: string) => {
    // Aquí puedes implementar la lógica de selección del plan
    // Por ejemplo, redirigir a WhatsApp con mensaje predefinido
    const message = encodeURIComponent(
        `¡Hola! Estoy interesado en el ${planName}. Me gustaría obtener más información y comenzar mi transformación.`
    )
    window.open(`https://wa.me/573185228487?text=${message}`, '_blank')
}

export default function PricingCards() {
    return (
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
                <Card
                    key={plan.id}
                    className={`relative transition-all duration-300 hover:shadow-xl ${plan.popular
                            ? 'border-primary shadow-lg scale-105'
                            : plan.premium
                                ? 'border-yellow-500 shadow-lg'
                                : 'border-border hover:scale-102'
                        }`}
                >
                    {plan.popular && (
                        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1">
                            Más Popular
                        </Badge>
                    )}
                    {plan.premium && (
                        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-4 py-1">
                            Premium
                        </Badge>
                    )}

                    <CardHeader className="text-center pb-2">
                        <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${plan.popular
                                ? 'bg-primary text-primary-foreground'
                                : plan.premium
                                    ? 'bg-yellow-500 text-black'
                                    : 'bg-muted text-muted-foreground'
                            }`}>
                            {plan.icon}
                        </div>
                        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                        <CardDescription className="text-base mt-2">
                            {plan.description}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-4">
                        <div className="text-center mb-6">
                            <div className="text-4xl font-bold text-primary mb-1">
                                {formatPrice(plan.price)}
                            </div>
                            <div className="text-muted-foreground">por {plan.period}</div>
                        </div>

                        <ul className="space-y-3 mb-8">
                            {plan.features.map((feature, index) => (
                                <li key={index} className="flex items-start space-x-3">
                                    <CheckCircle
                                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${feature.included
                                                ? 'text-green-500'
                                                : 'text-gray-300'
                                            }`}
                                    />
                                    <span className={`text-sm ${feature.included
                                            ? 'text-foreground'
                                            : 'text-muted-foreground line-through'
                                        }`}>
                                        {feature.text}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <Button
                            className={`w-full text-lg py-6 ${plan.popular
                                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                                    : plan.premium
                                        ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                                        : ''
                                }`}
                            variant={plan.buttonVariant}
                            onClick={() => handlePlanSelection(plan.id, plan.name)}
                        >
                            <MessageCircle className="w-5 h-5 mr-2" />
                            {plan.buttonText}
                        </Button>

                        <p className="text-xs text-muted-foreground text-center mt-3">
                            Sin permanencia • Cancela cuando quieras
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
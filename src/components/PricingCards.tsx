// src/components/PricingCards.tsx (CÓDIGO ACTUALIZADO)
"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    CheckCircle,
    Crown,
    Dumbbell,
    MessageCircle,
    Trophy,
} from "lucide-react"
import LeadForm from './LeadForm';
import { toast } from 'sonner';

interface DiscountData {
    planId: string;
    maxCupos: number;
    usedCupos: number;
    availableCupos: number;
    discountPercentage: number;
    hasDiscount: boolean;
}

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
    discountPercentage?: number;
    availableCupos?: number;
    discountedPrice?: number;
    hasDiscount?: boolean;
}

interface LeadFormData {
    name: string;
    email: string;
    phone: string;
}

const basePlans: Omit<Plan, 'discountedPrice' | 'discountPercentage' | 'availableCupos' | 'hasDiscount'>[] = [
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
            { text: "Soporte por WhatsApp", included: false },
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
            { text: "Soporte 24/7 por WhatsApp", included: true },
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
            { text: "Análisis corporal avanzado mensual", included: true },
            { text: "Protocolo de suplementación premium", included: true },
            { text: "Soporte nutricional especializado", included: true },
            { text: "Comunidad exclusiva Elite", included: true },
        ]
    }
];

const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price)
}

const handlePaymentAndWhatsapp = (planId: string, planName: string, discountedPrice: number, formData: LeadFormData) => {

    const paymentURL = `https://pay-gateway.com/checkout?plan=${planId}&price=${discountedPrice}&name=${formData.name}`;

    window.open(paymentURL, '_blank');

    toast.info("Esperando confirmación de pago...", {
        description: "Serás redirigido a WhatsApp en 5 segundos (simulación de pago exitoso).",
        duration: 5000,
    });

    setTimeout(() => {
        const whatsappMessage = encodeURIComponent(
            `¡Hola! Acabo de completar el registro y el pago para el ${planName} por ${formatPrice(discountedPrice)}. Mi nombre es ${formData.name}.`
        );
        window.open(`https://wa.me/573185228487?text=${whatsappMessage}`, '_blank');
        toast.success("¡Pago completado!", {
            description: "Te hemos enviado a WhatsApp para que coordines el inicio con tu entrenador.",
            duration: 5000,
        });
    }, 5000);
};


export default function PricingCards() {
    const [plans, setPlans] = useState<Plan[]>(basePlans as Plan[]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    const handlePlanSelection = (plan: Plan) => {
        fetch('/api/visit', { method: 'POST' }).catch(e => console.error('Failed to track plan selection:', e));

        setSelectedPlan(plan);
        setIsModalOpen(true);
    }

    const handleLeadSubmission = (formData: LeadFormData) => {
        if (!selectedPlan) return;

        setIsModalOpen(false);

        handlePaymentAndWhatsapp(
            selectedPlan.id,
            selectedPlan.name,
            selectedPlan.discountedPrice ?? selectedPlan.price,
            formData
        );
    }


    useEffect(() => {
        const fetchDiscounts = async () => {
            try {
                const response = await fetch('/api/cupos');
                const data = await response.json();

                if (response.ok && data.planDiscounts) {
                    const discountsMap = new Map<string, DiscountData>(
                        data.planDiscounts.map((d: DiscountData) => [d.planId, d])
                    );

                    const updatedPlans = basePlans.map((plan) => {
                        const discount = discountsMap.get(plan.id);

                        if (discount && discount.hasDiscount && discount.availableCupos > 0) {
                            const discountAmount = plan.price * (discount.discountPercentage / 100);
                            const discountedPrice = plan.price - discountAmount;

                            return {
                                ...plan,
                                discountPercentage: discount.discountPercentage,
                                availableCupos: discount.availableCupos,
                                discountedPrice: discountedPrice,
                                hasDiscount: true,
                            } as Plan;
                        }

                        return {
                            ...plan,
                            hasDiscount: false,
                            discountedPrice: plan.price,
                        } as Plan;
                    });

                    setPlans(updatedPlans);
                } else {
                    console.error("Error al cargar descuentos:", data.error);
                }
            } catch (error) {
                console.error("Error de red al cargar descuentos:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDiscounts();
    }, []);

    if (isLoading) {
        return (
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div className="h-[500px] bg-gray-100 rounded-lg animate-pulse"></div>
                <div className="h-[550px] bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-[500px] bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
        );
    }

    return (
        <>
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
                        {(plan.popular || plan.premium) && (
                            <Badge
                                className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 ${plan.popular ? 'bg-primary text-primary-foreground' : 'bg-yellow-500 text-black'}`}
                            >
                                {plan.popular ? 'Más Popular' : 'Premium'}
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
                                {plan.hasDiscount && plan.discountedPrice !== undefined ? (
                                    <>
                                        <div className="text-xl font-normal text-muted-foreground line-through mb-1">
                                            {formatPrice(plan.price)}
                                        </div>
                                        {plan.hasDiscount && plan.availableCupos !== undefined && (
                                            <div className="flex justify-center mt-1 mb-2">
                                                <Badge
                                                    className="bg-red-600 text-white flex items-center gap-1 animate-pulse"
                                                >
                                                    {plan.discountPercentage}% OFF - {plan.availableCupos} Cupos
                                                </Badge>
                                            </div>
                                        )}
                                        <div className="text-4xl font-bold text-red-600 mb-1">
                                            {formatPrice(plan.discountedPrice)}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-4xl font-bold text-primary mb-1">
                                        {formatPrice(plan.price)}
                                    </div>
                                )}

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
                                onClick={() => handlePlanSelection(plan)}
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

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-center">Inscripción al Plan {selectedPlan?.name}</DialogTitle>
                        <CardDescription className="sr-only">
                            Formulario para ingresar tus datos personales antes de proceder al pago.
                        </CardDescription>
                    </DialogHeader>
                    {selectedPlan && (
                        <LeadForm
                            planId={selectedPlan.id}
                            planName={selectedPlan.name}
                            onSuccess={handleLeadSubmission}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}

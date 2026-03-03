// src/components/PricingCards.tsx (ACTUALIZADO CON FLUJO COMPLETO)
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
    MapPin,
    Clock,
    Loader2,
} from "lucide-react"
import LeadForm from './LeadForm';
import CalendarBooking from './CalendarBooking';
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
    daily?: boolean
    features: PlanFeature[]
    icon: React.ReactElement
    buttonText: string
    buttonVariant: "default" | "outline" | "secondary"
    discountPercentage?: number;
    availableCupos?: number;
    discountedPrice?: number;
    hasDiscount?: boolean;
    locationRestriction?: string;
}

interface LeadFormData {
    name: string;
    email: string;
    phone: string;
}

const basePlans: Omit<Plan, 'discountedPrice' | 'discountPercentage' | 'availableCupos' | 'hasDiscount'>[] = [
    {
        id: "diario",
        name: "Sesión Personal",
        description: "1 hora de entrenamiento personalizado a domicilio",
        price: 60000,
        period: "sesión",
        daily: true,
        icon: <Clock className="w-6 h-6" />,
        buttonText: "Reservar Sesión",
        buttonVariant: "outline",
        locationRestriction: "Cali, Colombia",
        features: [
            { text: "1 hora de entrenamiento personalizado", included: true },
            { text: "El entrenador se desplaza a tu ubicación", included: true },
            { text: "Asesoría enfocada en tus objetivos", included: true },
            { text: "Disponible solo en Cali, Colombia", included: true },
            { text: "Horario flexible según disponibilidad", included: true },
            { text: "persona adisional tendra un valor adicional de $20.000", included: true },
            { text: "Sin compromiso de permanencia", included: true },
        ]
    },
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

type FlowStep = 'selection' | 'form' | 'payment' | 'calendar';

export default function PricingCards() {
    const [plans, setPlans] = useState<Plan[]>(basePlans as Plan[]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [flowStep, setFlowStep] = useState<FlowStep>('selection');
    const [reservaId, setReservaId] = useState<string>('');
    const [paymentSessionToken, setPaymentSessionToken] = useState<string>('');

    const handlePlanSelection = (plan: Plan) => {
        fetch('/api/visit', { method: 'POST' }).catch(e => console.error('Failed to track:', e));
        setSelectedPlan(plan);
        setFlowStep('form');
        setIsModalOpen(true);
    }

    const handleLeadSubmission = async (formData: LeadFormData) => {
        if (!selectedPlan) return;
        
        // El inscripcionId ya viene del formulario
        const response = await fetch('/api/inscribir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formData,
                planId: selectedPlan.id,
            })
        });

        const data = await response.json();
        
        if (data.ok && data.inscripcionId) {
            setFlowStep('payment');
            handlePaymentFlow(data.inscripcionId);
        }
    }

    const handlePaymentFlow = async (inscrId: string) => {
        
        try {
            // Iniciar proceso de pago
            const paymentResponse = await fetch('/api/payment/nequi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inscripcionId: inscrId,
                })
            });

            const paymentData = await paymentResponse.json();

            if (paymentData.ok) {
                if (!paymentData.sessionToken) {
                    toast.error("No se pudo iniciar sesión de pago segura");
                    return;
                }

                setReservaId(paymentData.reservaId);
                setPaymentSessionToken(paymentData.sessionToken);
                
                if (paymentData.simulationMode) {
                    toast.info("Modo simulación activado", {
                        description: "El pago se aprobará automáticamente para pruebas",
                        duration: 3000,
                    });
                } else {
                    toast.success("Notificación enviada a Nequi", {
                        description: "Verifica tu app Nequi para confirmar el pago",
                        duration: 10000,
                    });
                }

                // En ambos modos el estado se confirma desde backend.
                checkPaymentStatus(paymentData.reservaId, paymentData.sessionToken);
            } else {
                toast.error(paymentData.error || "Error iniciando pago");
            }
        } catch (error) {
            console.error("Error en pago:", error);
            toast.error("Error procesando el pago");
        }
    }

    const checkPaymentStatus = async (resId: string, token: string) => {
        const maxAttempts = 60; // 5 minutos máximo (60 * 5 segundos)
        let attempts = 0;

        const pollStatus = async () => {
            try {
                const response = await fetch(`/api/payment/status?reservaId=${resId}&token=${encodeURIComponent(token)}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();

                if (response.status === 403 || response.status === 400) {
                    toast.error("Sesión de pago inválida o expirada", {
                        description: "Cierra y vuelve a iniciar el proceso de pago.",
                    });
                    setIsModalOpen(false);
                    return;
                }

                if (response.status === 429) {
                    attempts++;
                    if (attempts < maxAttempts) {
                        const retryAfter = Number(response.headers.get('Retry-After') || '5');
                        setTimeout(pollStatus, Math.max(5, retryAfter) * 1000);
                    }
                    return;
                }

                if (data.pagoEstado === 'aprobado') {
                    toast.success("¡Pago confirmado!", {
                        description: "Ahora puedes agendar tu horario",
                    });
                    setFlowStep('calendar');
                    return;
                }

                if (data.pagoEstado === 'rechazado') {
                    toast.error("Pago rechazado", {
                        description: "El pago fue rechazado. Por favor intenta nuevamente.",
                    });
                    setIsModalOpen(false);
                    return;
                }

                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(pollStatus, 5000); // Verificar cada 5 segundos
                } else {
                    toast.warning("Tiempo de espera agotado", {
                        description: "No hemos recibido confirmación del pago. Verifica tu cuenta.",
                    });
                }
            } catch (error) {
                console.error("Error verificando pago:", error);
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(pollStatus, 5000);
                }
            }
        };

        pollStatus();
    }

    const handleBookingComplete = () => {
        setIsModalOpen(false);
        setFlowStep('selection');
        setSelectedPlan(null);
        setReservaId('');
        setPaymentSessionToken('');
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
                }
            } catch (error) {
                console.error("Error cargando descuentos:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDiscounts();
    }, []);

    if (isLoading) {
        return (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-[500px] bg-gray-100 rounded-lg animate-pulse"></div>
                ))}
            </div>
        );
    }

    return (
        <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                {plans.map((plan) => (
                    <Card
                        key={plan.id}
                        className={`relative transition-all duration-300 hover:shadow-xl ${
                            plan.popular
                                ? 'border-primary shadow-lg md:scale-105'
                                : plan.premium
                                    ? 'border-yellow-500 shadow-lg'
                                    : plan.daily
                                        ? 'border-blue-500 shadow-md'
                                        : 'border-border hover:scale-102'
                        }`}
                    >
                        {(plan.popular || plan.premium || plan.daily) && (
                            <Badge
                                className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 ${
                                    plan.popular
                                        ? 'bg-primary text-primary-foreground'
                                        : plan.premium
                                            ? 'bg-yellow-500 text-black'
                                            : 'bg-blue-500 text-white'
                                }`}
                            >
                                {plan.popular ? 'Más Popular' : plan.premium ? 'Premium' : 'Pago por Sesión'}
                            </Badge>
                        )}

                        <CardHeader className="text-center pb-2">
                            <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                                plan.popular
                                    ? 'bg-primary text-primary-foreground'
                                    : plan.premium
                                        ? 'bg-yellow-500 text-black'
                                        : plan.daily
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-muted text-muted-foreground'
                            }`}>
                                {plan.icon}
                            </div>
                            <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                            <CardDescription className="text-base mt-2">
                                {plan.description}
                            </CardDescription>
                            {plan.locationRestriction && (
                                <div className="flex items-center justify-center gap-1 mt-2 text-sm text-blue-600">
                                    <MapPin className="w-4 h-4" />
                                    <span>{plan.locationRestriction}</span>
                                </div>
                            )}
                        </CardHeader>

                        <CardContent className="pt-4">
                            <div className="text-center mb-6">
                                {plan.hasDiscount && plan.discountedPrice !== undefined ? (
                                    <>
                                        <div className="text-xl font-normal text-muted-foreground line-through mb-1">
                                            {formatPrice(plan.price)}
                                        </div>
                                        {plan.availableCupos !== undefined && (
                                            <div className="flex justify-center mt-1 mb-2">
                                                <Badge className="bg-red-600 text-white flex items-center gap-1 animate-pulse">
                                                    {plan.discountPercentage}% OFF - {plan.availableCupos} Cupos
                                                </Badge>
                                            </div>
                                        )}
                                        <div className="text-4xl font-bold text-red-600 mb-1">
                                            {formatPrice(plan.discountedPrice)}
                                        </div>
                                    </>
                                ) : (
                                    <div className={`text-4xl font-bold mb-1 ${plan.daily ? 'text-blue-600' : 'text-primary'}`}>
                                        {formatPrice(plan.price)}
                                    </div>
                                )}
                                <div className="text-muted-foreground">por {plan.period}</div>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start space-x-3">
                                        <CheckCircle
                                            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                                feature.included
                                                    ? 'text-green-500'
                                                    : 'text-gray-300'
                                            }`}
                                        />
                                        <span className={`text-sm ${
                                            feature.included
                                                ? 'text-foreground'
                                                : 'text-muted-foreground line-through'
                                        }`}>
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className={`w-full text-lg py-6 ${
                                    plan.popular
                                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                                        : plan.premium
                                            ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                                            : plan.daily
                                                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                                : ''
                                }`}
                                variant={plan.buttonVariant}
                                onClick={() => handlePlanSelection(plan)}
                            >
                                <MessageCircle className="w-5 h-5 mr-2" />
                                {plan.buttonText}
                            </Button>

                            <p className="text-xs text-muted-foreground text-center mt-3">
                                {plan.daily ? 'Reserva tu sesión ahora' : 'Sin permanencia • Cancela cuando quieras'}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-center">
                            {flowStep === 'form' && `Inscripción al ${selectedPlan?.name}`}
                            {flowStep === 'payment' && 'Procesando Pago...'}
                            {flowStep === 'calendar' && 'Agenda tu Horario'}
                        </DialogTitle>
                    </DialogHeader>
                    
                    {flowStep === 'form' && selectedPlan && (
                        <LeadForm
                            planId={selectedPlan.id}
                            planName={selectedPlan.name}
                            onSuccess={handleLeadSubmission}
                        />
                    )}

                    {flowStep === 'payment' && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="w-12 h-12 animate-spin text-primary" />
                            <h3 className="text-xl font-semibold">Procesando tu pago...</h3>
                            <p className="text-muted-foreground text-center">
                                Serás redirigido a Nequi para completar el pago de forma segura.
                            </p>
                        </div>
                    )}

                    {flowStep === 'calendar' && reservaId && (
                        <CalendarBooking
                            reservaId={reservaId}
                            paymentSessionToken={paymentSessionToken}
                            onComplete={handleBookingComplete}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}

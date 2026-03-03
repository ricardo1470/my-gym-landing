// src/components/AdminDashboard.tsx (MEJORADO)
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { 
    Hourglass, TrendingUp, Users, MapPin, Repeat2, Zap,
    Calendar, DollarSign, CheckCircle, XCircle, Clock as ClockIcon,
    CreditCard, ShoppingCart
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { toast } from 'sonner';

// Interfaces existentes...
interface PlanStat {
    _id: string;
    count: number;
}

interface GeoStat {
    _id: { country: string; city: string };
    count: number;
}

interface HourlyStat {
    _id: number;
    count: number;
}

interface CupoStatus {
    planId: string;
    maxCupos: number;
    usedCupos: number;
    remainingCupos: number;
    discountPercentage: number;
}

// ✨ Nuevas interfaces
interface ReservasStats {
    total: number;
    porEstado: Array<{ _id: string; count: number }>;
    porPagoEstado: Array<{ _id: string; count: number }>;
    completadas: number;
    tasaConversion: string;
}

interface IngresosStats {
    total: number;
    porPlan: Array<{
        _id: string;
        count: number;
        total: number;
        promedio: number;
    }>;
}

interface ProximaReserva {
    id: string;
    cliente: string;
    plan: string;
    fecha: string;
    estado: string;
    monto: number;
}

interface UltimaReserva {
    id: string;
    cliente: string;
    email: string;
    plan: string;
    monto: number;
    pagoEstado: string;
    estado: string;
    fechaReserva: string;
    createdAt: string;
}

interface DashboardData {
    totalVisitas: number;
    totalInscripciones: number;
    planSelections: PlanStat[];
    geoData: GeoStat[];
    hourlyData: HourlyStat[];
    cupos: CupoStatus[];
    lastCupoReset: string | null;
    // Nuevos campos
    reservas: ReservasStats;
    ingresos: IngresosStats;
    proximasReservas: ProximaReserva[];
    reservasPorDia: Array<{ _id: number; count: number }>;
    metodosPago: Array<{ _id: string; count: number }>;
    ultimasReservas: UltimaReserva[];
    paymentAudit: {
        alerts24h: number;
        byType: Array<{ _id: string; count: number }>;
        recent: Array<{
            id: string;
            source: string;
            eventType: string;
            transactionId: string;
            statusCode: string;
            amount: number | null;
            createdAt: string | null;
        }>;
    };
    memberships: {
        totalMonthly: number;
        dueSoonCount: number;
        expiredCount: number;
        dueSoon: Array<{
            id: string;
            clienteNombre: string;
            clienteEmail: string;
            planId: string;
            planNombre: string;
            membershipEndDate: string;
            renewalStatus: string;
            diasRestantes: number;
            renewalReminderCount: number;
            lastRenewalReminderAt: string | null;
        }>;
        expired: Array<{
            id: string;
            clienteNombre: string;
            clienteEmail: string;
            planId: string;
            planNombre: string;
            membershipEndDate: string;
            renewalStatus: string;
            diasRestantes: number;
            renewalReminderCount: number;
            lastRenewalReminderAt: string | null;
        }>;
    };
}

interface DashboardApiResponse {
    error?: string;
    stats?: {
        totalVisitas?: number;
        totalInscripciones?: number;
        planSelections?: PlanStat[];
        geoData?: GeoStat[];
        hourlyData?: HourlyStat[];
    };
    totalVisitas?: number;
    totalInscripciones?: number;
    planSelections?: PlanStat[];
    geoData?: GeoStat[];
    hourlyData?: HourlyStat[];
    cupos?: CupoStatus[];
    lastCupoReset?: string | null;
    reservas?: ReservasStats;
    ingresos?: IngresosStats;
    proximasReservas?: ProximaReserva[];
    reservasPorDia?: Array<{ _id: number; count: number }>;
    metodosPago?: Array<{ _id: string; count: number }>;
    ultimasReservas?: UltimaReserva[];
    paymentAudit?: {
        alerts24h?: number;
        byType?: Array<{ _id: string; count: number }>;
        recent?: Array<{
            id: string;
            source: string;
            eventType: string;
            transactionId: string;
            statusCode: string;
            amount: number | null;
            createdAt: string | null;
        }>;
    };
    memberships?: {
        totalMonthly?: number;
        dueSoonCount?: number;
        expiredCount?: number;
        dueSoon?: Array<{
            id: string;
            clienteNombre: string;
            clienteEmail: string;
            planId: string;
            planNombre: string;
            membershipEndDate: string;
            renewalStatus: string;
            diasRestantes: number;
            renewalReminderCount: number;
            lastRenewalReminderAt: string | null;
        }>;
        expired?: Array<{
            id: string;
            clienteNombre: string;
            clienteEmail: string;
            planId: string;
            planNombre: string;
            membershipEndDate: string;
            renewalStatus: string;
            diasRestantes: number;
            renewalReminderCount: number;
            lastRenewalReminderAt: string | null;
        }>;
    };
}

interface AdminDashboardProps {
    password: string;
}

const COLORS = ['#FF8042', '#00C49F', '#0088FE', '#FFBB28', '#8884d8', '#82ca9d'];
const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ password }) => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isResetting, setIsResetting] = useState(false);
    const [isSendingReminders, setIsSendingReminders] = useState(false);

    const handleLogout = () => {
        window.location.href = '/';
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/dashboard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            
            const result: DashboardApiResponse = await response.json();

            if (response.ok) {
                const normalizedData: DashboardData = {
                    totalVisitas: result.totalVisitas ?? result.stats?.totalVisitas ?? 0,
                    totalInscripciones: result.totalInscripciones ?? result.stats?.totalInscripciones ?? 0,
                    planSelections: result.planSelections ?? result.stats?.planSelections ?? [],
                    geoData: result.geoData ?? result.stats?.geoData ?? [],
                    hourlyData: result.hourlyData ?? result.stats?.hourlyData ?? [],
                    cupos: result.cupos ?? [],
                    lastCupoReset: result.lastCupoReset ?? null,
                    reservas: result.reservas ?? {
                        total: 0,
                        porEstado: [],
                        porPagoEstado: [],
                        completadas: 0,
                        tasaConversion: '0',
                    },
                    ingresos: result.ingresos ?? {
                        total: 0,
                        porPlan: [],
                    },
                    proximasReservas: result.proximasReservas ?? [],
                    reservasPorDia: result.reservasPorDia ?? [],
                    metodosPago: result.metodosPago ?? [],
                    ultimasReservas: result.ultimasReservas ?? [],
                    paymentAudit: {
                        alerts24h: result.paymentAudit?.alerts24h ?? 0,
                        byType: result.paymentAudit?.byType ?? [],
                        recent: result.paymentAudit?.recent ?? [],
                    },
                    memberships: {
                        totalMonthly: result.memberships?.totalMonthly ?? 0,
                        dueSoonCount: result.memberships?.dueSoonCount ?? 0,
                        expiredCount: result.memberships?.expiredCount ?? 0,
                        dueSoon: result.memberships?.dueSoon ?? [],
                        expired: result.memberships?.expired ?? [],
                    },
                };
                setData(normalizedData);
            } else {
                toast.error("Error al cargar datos", { description: result.error });
                if (response.status === 401) window.location.reload();
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error("Error de red al conectar con el servidor.");
        } finally {
            setLoading(false);
        }
    }, [password]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleResetCupos = async () => {
        if (!confirm("¿Estás seguro de que quieres restablecer los contadores de cupos?")) return;

        setIsResetting(true);
        try {
            const response = await fetch('/api/cupos/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("¡Cupos restablecidos!", { description: result.message });
                fetchData();
            } else {
                toast.error("Error al restablecer cupos", { description: result.error });
            }
        } catch (error) {
            toast.error("Error de red durante el reseteo.");
        } finally {
            setIsResetting(false);
        }
    };

    const handleSendRenewalReminders = async (dryRun: boolean) => {
        if (!dryRun && !confirm("¿Enviar recordatorios reales de renovación ahora?")) return;

        setIsSendingReminders(true);
        try {
            const response = await fetch('/api/memberships/reminders/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password,
                    dryRun,
                    daysAhead: 7,
                    limit: 100,
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                toast.error("Error enviando recordatorios", { description: result.error || "Error desconocido" });
                return;
            }

            const label = dryRun ? "Simulación completada" : "Recordatorios enviados";
            toast.success(label, {
                description: `Procesados: ${result.processed}, Enviados: ${result.sent}, Omitidos: ${result.skipped}`,
            });
            fetchData();
        } catch (error) {
            toast.error("Error de red enviando recordatorios");
        } finally {
            setIsSendingReminders(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <p className="text-xl text-muted-foreground">Cargando estadísticas...</p>
            </div>
        );
    }

    if (!data) {
        return <div className="text-center p-10 text-red-500">No se pudieron cargar los datos del dashboard.</div>;
    }

    const totalSelected = data.planSelections.reduce((sum, p) => sum + p.count, 0);
    
    const planChartData = data.planSelections.map(p => ({
        name: p._id.charAt(0).toUpperCase() + p._id.slice(1),
        value: p.count,
    }));

    const allHours = Array.from({ length: 24 }, (_, i) => i);
    const hourlyMap = new Map(data.hourlyData.map(h => [h._id, h.count]));
    const hourlyChartData = allHours.map(hour => ({
        hour,
        visits: hourlyMap.get(hour) || 0,
        label: `${hour}:00`,
    }));

    // Datos para gráfico de reservas por día
    const reservasPorDiaData = DIAS_SEMANA.map((dia, index) => {
        const diaData = data.reservasPorDia.find(d => d._id === index + 1);
        return {
            dia,
            reservas: diaData?.count || 0
        };
    });

    // Datos para gráfico de estados de pago
    const pagoEstadoData = data.reservas.porPagoEstado.map(p => ({
        name: p._id.charAt(0).toUpperCase() + p._id.slice(1),
        value: p.count
    }));

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-4xl font-extrabold flex items-center gap-3">
                    <Zap className="w-8 h-8 text-primary" />
                    Dashboard de Administración
                </h1>
                <Button variant="outline" onClick={handleLogout}>
                    Cerrar Sesión / Volver
                </Button>
            </div>
            <p className="text-muted-foreground">Última actualización: {new Date().toLocaleTimeString()}</p>

            {/* KPIs Principales */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Visitas Totales</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{data.totalVisitas.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Entradas a la página</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Leads Generados</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{data.totalInscripciones.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Formularios completados</p>
                    </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reservas Completadas</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-700">{data.reservas.completadas}</div>
                        <p className="text-xs text-green-600">Pagos aprobados</p>
                    </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-700">
                            {formatCurrency(data.ingresos.total)}
                        </div>
                        <p className="text-xs text-blue-600">Conversión: {data.reservas.tasaConversion}%</p>
                    </CardContent>
                </Card>
            </div>

            {/* Estadísticas de Reservas */}
            <div className="grid lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" />
                            Estado de Reservas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {data.reservas.porEstado.map((estado) => (
                                <div key={estado._id} className="flex justify-between items-center">
                                    <span className="capitalize">{estado._id}</span>
                                    <Badge>{estado.count}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Estado de Pagos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pagoEstadoData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={70}
                                        label
                                    >
                                        {pagoEstadoData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Ingresos por Plan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.ingresos.porPlan.map((plan) => (
                                <div key={plan._id} className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium capitalize">{plan._id}</span>
                                        <span className="text-sm font-bold">{formatCurrency(plan.total)}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {plan.count} reservas • Promedio: {formatCurrency(plan.promedio)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Gráficos */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Reservas por Día de la Semana</CardTitle>
                        <CardDescription>Días más populares para agendar</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reservasPorDiaData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="dia" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="reservas" fill="#0088FE" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Planes más Populares ({totalSelected} Total)</CardTitle>
                        <CardDescription>Preferencias de los clientes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={planChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {planChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Próximas Reservas */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Próximas Reservas (7 días)
                    </CardTitle>
                    <CardDescription>Sesiones agendadas próximamente</CardDescription>
                </CardHeader>
                <CardContent>
                    {data.proximasReservas.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No hay reservas próximas</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Fecha y Hora</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.proximasReservas.map((reserva) => (
                                    <TableRow key={reserva.id}>
                                        <TableCell className="font-medium">{reserva.cliente}</TableCell>
                                        <TableCell className="capitalize">{reserva.plan}</TableCell>
                                        <TableCell>
                                            {new Date(reserva.fecha).toLocaleString('es-CO', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={reserva.estado === 'confirmada' ? 'default' : 'secondary'}>
                                                {reserva.estado}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(reserva.monto)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Auditoría de Pagos */}
            <div className="grid lg:grid-cols-3 gap-6">
                <Card className={data.paymentAudit.alerts24h > 0 ? "border-red-300 bg-red-50" : "border-green-200 bg-green-50"}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Alertas de Seguridad (24h)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${data.paymentAudit.alerts24h > 0 ? "text-red-700" : "text-green-700"}`}>
                            {data.paymentAudit.alerts24h}
                        </div>
                        <p className={`text-xs ${data.paymentAudit.alerts24h > 0 ? "text-red-700" : "text-green-700"}`}>
                            Eventos de mismatch o inconsistencias detectadas
                        </p>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Top Eventos de Auditoría</CardTitle>
                        <CardDescription>Tipos de eventos más frecuentes en pagos</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.paymentAudit.byType.length === 0 ? (
                            <p className="text-muted-foreground text-sm">Sin eventos registrados todavía.</p>
                        ) : (
                            <div className="space-y-2">
                                {data.paymentAudit.byType.map((evt) => (
                                    <div key={evt._id} className="flex justify-between items-center">
                                        <span className="text-sm font-medium">{evt._id}</span>
                                        <Badge>{evt.count}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Eventos Recientes de Pago</CardTitle>
                    <CardDescription>Últimos 20 eventos de auditoría</CardDescription>
                </CardHeader>
                <CardContent>
                    {data.paymentAudit.recent.length === 0 ? (
                        <p className="text-muted-foreground text-center py-6">No hay eventos de auditoría recientes.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Evento</TableHead>
                                    <TableHead>Fuente</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tx</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.paymentAudit.recent.map((evt) => (
                                    <TableRow key={evt.id}>
                                        <TableCell>
                                            {evt.createdAt ? new Date(evt.createdAt).toLocaleString('es-CO') : '-'}
                                        </TableCell>
                                        <TableCell className="font-medium">{evt.eventType}</TableCell>
                                        <TableCell>{evt.source}</TableCell>
                                        <TableCell>{evt.statusCode || '-'}</TableCell>
                                        <TableCell className="max-w-[170px] truncate" title={evt.transactionId}>
                                            {evt.transactionId || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {typeof evt.amount === 'number' ? formatCurrency(evt.amount) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Renovaciones de Membresía */}
            <div className="grid lg:grid-cols-3 gap-6">
                <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                        <CardTitle>Membresías Mensuales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-700">{data.memberships.totalMonthly}</div>
                        <p className="text-xs text-blue-700">Clientes con plan mensual aprobado</p>
                    </CardContent>
                </Card>
                <Card className="border-amber-200 bg-amber-50">
                    <CardHeader>
                        <CardTitle>Vencen en 7 días</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-700">{data.memberships.dueSoonCount}</div>
                        <p className="text-xs text-amber-700">Oportunidad de renovación anticipada</p>
                    </CardContent>
                </Card>
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle>Vencidas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-700">{data.memberships.expiredCount}</div>
                        <p className="text-xs text-red-700">Clientes para reactivación</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Gestión de Renovaciones</CardTitle>
                        <CardDescription>Envía recordatorios automáticos para renovar planes mensuales.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => handleSendRenewalReminders(true)}
                            disabled={isSendingReminders}
                        >
                            {isSendingReminders ? "Procesando..." : "Dry Run"}
                        </Button>
                        <Button
                            onClick={() => handleSendRenewalReminders(false)}
                            disabled={isSendingReminders}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isSendingReminders ? "Enviando..." : "Enviar Recordatorios"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid lg:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold mb-2">Próximas a vencer</h4>
                            {data.memberships.dueSoon.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No hay membresías por vencer esta semana.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>Vence</TableHead>
                                            <TableHead className="text-right">Días</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.memberships.dueSoon.slice(0, 10).map((m) => (
                                            <TableRow key={m.id}>
                                                <TableCell>{m.clienteNombre}</TableCell>
                                                <TableCell className="capitalize">{m.planNombre}</TableCell>
                                                <TableCell>{new Date(m.membershipEndDate).toLocaleDateString('es-CO')}</TableCell>
                                                <TableCell className="text-right">{m.diasRestantes}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Vencidas</h4>
                            {data.memberships.expired.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No hay membresías vencidas.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cliente</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>Venció</TableHead>
                                            <TableHead className="text-right">Record.</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.memberships.expired.slice(0, 10).map((m) => (
                                            <TableRow key={m.id}>
                                                <TableCell>{m.clienteNombre}</TableCell>
                                                <TableCell className="capitalize">{m.planNombre}</TableCell>
                                                <TableCell>{new Date(m.membershipEndDate).toLocaleDateString('es-CO')}</TableCell>
                                                <TableCell className="text-right">{m.renewalReminderCount}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Gestión de Cupos (existente) */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            Gestión de Cupos con Descuento <Repeat2 className="w-5 h-5 text-primary" />
                        </CardTitle>
                        <CardDescription>
                            Controla los cupos restantes y restablece los contadores mensuales.
                        </CardDescription>
                    </div>
                    <Button
                        onClick={handleResetCupos}
                        disabled={isResetting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isResetting ? "Restableciendo..." : "Restablecer Cupos"}
                    </Button>
                </CardHeader>
                <CardContent>
                    <p className="text-sm mb-4 text-muted-foreground">
                        Último reseteo: {data.lastCupoReset ? new Date(data.lastCupoReset).toLocaleString() : "Nunca"}
                    </p>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Plan</TableHead>
                                <TableHead>Descuento</TableHead>
                                <TableHead>Máx.</TableHead>
                                <TableHead>Usados</TableHead>
                                <TableHead>Restantes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.cupos.map((cupo) => (
                                <TableRow key={cupo.planId}>
                                    <TableCell className="font-medium uppercase">{cupo.planId}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                                            {cupo.discountPercentage}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{cupo.maxCupos}</TableCell>
                                    <TableCell>{cupo.usedCupos}</TableCell>
                                    <TableCell>
                                        <Badge variant={cupo.remainingCupos > 5 ? "default" : "destructive"}>
                                            {cupo.remainingCupos}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Actividad por Hora y Geo (existentes pero optimizados)*/}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Actividad por Hora del Día</CardTitle>
                        <CardDescription>Horas pico de visita</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hourlyChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="visits" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            Origen de Visitas (Top 5)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>País</TableHead>
                                    <TableHead>Ciudad</TableHead>
                                    <TableHead className="text-right">Visitas</TableHead>
                                    <TableHead className="text-right">%</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.geoData.slice(0, 5).map((geo, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{geo._id.country}</TableCell>
                                        <TableCell>{geo._id.city}</TableCell>
                                        <TableCell className="text-right">{geo.count}</TableCell>
                                        <TableCell className="text-right">
                                            {((geo.count / data.totalVisitas) * 100).toFixed(1)}%
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;

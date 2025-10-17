// src/components/AdminDashboard.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
//import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Hourglass, TrendingUp, Users, MapPin, Repeat2, Zap } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { toast } from 'sonner';

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

interface DashboardData {
    totalVisitas: number;
    totalInscripciones: number;
    planSelections: PlanStat[];
    geoData: GeoStat[];
    hourlyData: HourlyStat[];
    cupos: CupoStatus[];
    lastCupoReset: string | null;
}

interface AdminDashboardProps {
    password: string;
}

const COLORS = ['#FF8042', '#00C49F', '#0088FE', '#FFBB28'];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ password }) => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isResetting, setIsResetting] = useState(false);

    const handleLogout = () => {
        window.location.href = '/';
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/dashboard?password=${password}`);
            const result = await response.json();

            if (response.ok) {
                setData(result.stats ? { ...result.stats, cupos: result.cupos, lastCupoReset: result.lastCupoReset } : null);
            } else {
                toast.error("Error al cargar datos", result.error);
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
        if (!confirm("¿Estás seguro de que quieres restablecer los contadores de cupos? Esto pondrá en 0 los 'cupos usados'.")) return;

        setIsResetting(true);
        try {
            const response = await fetch('/api/cupos/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("¡Cupos restablecidos!", result.message);
                fetchData();
            } else {
                toast.error("Error al restablecer cupos", result.error);
            }
        } catch (error) {
            toast.error("Error de red durante el reseteo.", { description: String(error) });
        } finally {
            setIsResetting(false);
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

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-4xl font-extrabold flex items-center gap-3">
                    <Zap className="w-8 h-8 text-primary" />
                    Dashboard de Administración
                </h1>
                <Button
                    variant="outline"
                    onClick={handleLogout}
                >
                    Cerrar Sesión / Volver
                </Button>
            </div>
            <p className="text-muted-foreground">Última actualización: {new Date().toLocaleTimeString()}</p>

            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Visitas Totales</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{data.totalVisitas.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Entradas a la página principal</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inscripciones/Leads</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{data.totalInscripciones.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Personas que llenaron el formulario</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversión (Inscritos/Visitas)</CardTitle>
                        <Hourglass className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">
                            {data.totalVisitas > 0
                                ? ((data.totalInscripciones / data.totalVisitas) * 100).toFixed(2) + '%'
                                : 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">Tasa de Leads generados</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">

                <Card>
                    <CardHeader>
                        <CardTitle>Planes más Populares ({totalSelected} Total)</CardTitle>
                        <CardDescription>Veces que se inició el proceso de inscripción.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={planChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        fill="#8884d8"
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

                <Card>
                    <CardHeader>
                        <CardTitle>Actividad por Hora del Día</CardTitle>
                        <CardDescription>Horas pico de visita a la página (UTC)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hourlyChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} label={{ value: 'Hora del Día (0-23)', position: 'bottom' }} />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [`${value} Visitas`, 'Visitas']} />
                                    <Bar dataKey="visits" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

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
                    <div>
                        <Button
                            onClick={handleResetCupos}
                            disabled={isResetting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isResetting ? "Restableciendo..." : "Restablecer Cupos (Mes)"}
                        </Button>
                    </div>
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
                                <TableHead>Cupos Máx.</TableHead>
                                <TableHead>Cupos Usados</TableHead>
                                <TableHead>Cupos Restantes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.cupos.map((cupo) => (
                                <TableRow key={cupo.planId}>
                                    <TableCell className="font-medium">{cupo.planId.toUpperCase()}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                                            {cupo.discountPercentage}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{cupo.maxCupos}</TableCell>
                                    <TableCell>{cupo.usedCupos}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={cupo.remainingCupos > 5 ? "default" : "destructive"}
                                            className={cupo.remainingCupos <= 5 ? "animate-pulse" : ""}
                                        >
                                            {cupo.remainingCupos}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Origen de las Visitas <MapPin className="w-5 h-5 text-primary" />
                    </CardTitle>
                    <CardDescription>Top 10 de países y ciudades de donde nos visitan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>País</TableHead>
                                <TableHead>Ciudad</TableHead>
                                <TableHead>Hora</TableHead>
                                <TableHead className="text-right">Visitas</TableHead>
                                <TableHead className="text-right">% del Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.geoData.slice(0, 10).map((geo, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{geo._id.country}</TableCell>
                                    <TableCell>{geo._id.city}</TableCell>
                                    <TableCell>{new Date().toLocaleTimeString()}</TableCell>
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
    );
};

export default AdminDashboard;

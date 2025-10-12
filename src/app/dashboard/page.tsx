// src/app/dashboard/page.tsx
"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminDashboard from '@/components/AdminDashboard';

export default function DashboardPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [isChecking, setIsChecking] = useState(false);

    // Utilizamos la ruta /api/dashboard para verificar la contraseña
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsChecking(true);

        try {
            // Hacemos una llamada a la API con la contraseña como parámetro de búsqueda
            const response = await fetch(`/api/dashboard?password=${encodeURIComponent(password)}`);

            if (response.ok) {
                // Si la respuesta es 200 OK, significa que la contraseña es correcta
                setIsAuthenticated(true);
                toast.success('¡Acceso concedido! Bienvenido al Dashboard.');
            } else {
                const result = await response.json();
                toast.error('Error de acceso', result.error || 'Contraseña incorrecta. Inténtalo de nuevo.');
                setPassword(''); // Limpiar el campo de contraseña
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Error de red: No se pudo conectar con el servidor de autenticación.');
        } finally {
            setIsChecking(false);
        }
    };

    if (isAuthenticated) {
        // Si está autenticado, muestra el dashboard
        return <AdminDashboard password={password} />;
    }

    // Pantalla de Login
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <Shield className="w-10 h-10 text-primary mx-auto mb-2" />
                    <CardTitle className="text-2xl">Acceso Restringido</CardTitle>
                    <CardDescription>
                        Ingresa la contraseña de administrador para acceder a las estadísticas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            id="password"
                            type="password"
                            placeholder="Contraseña Secreta"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isChecking}
                        />
                        <Button type="submit" className="w-full" disabled={isChecking}>
                            {isChecking ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...</>
                            ) : (
                                "Acceder al Dashboard"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

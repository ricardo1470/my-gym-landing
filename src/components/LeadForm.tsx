// src/components/LeadForm.tsx
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Zap, Smartphone, Mail, User } from 'lucide-react';
import { toast } from 'sonner';

// --- Esquema de Validación (Zod) ---
const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }).max(50),
  email: z.string().email({
    message: "Ingresa un correo electrónico válido.",
  }),
  phone: z.string().regex(/^\d{7,15}$/, { // Permite de 7 a 15 dígitos (ajustar según el formato de tu país)
    message: "Ingresa un número de teléfono válido (solo dígitos).",
  }),
});

type LeadFormValues = z.infer<typeof formSchema>;

interface LeadFormProps {
  planId: string;
  planName: string;
  onSuccess: (formData: LeadFormValues) => void; // Callback para el siguiente paso (pago)
}

const LeadForm: React.FC<LeadFormProps> = ({ planId, planName, onSuccess }) => {
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: LeadFormValues) => {
    try {
      const payload = {
        ...values,
        planId,
        planName,
        source: 'web_form', // Para seguimiento interno
      };

      // 1. Registrar el Lead en la base de datos
      const response = await fetch('/api/inscribir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('¡Datos recibidos! Redirigiendo a la pasarela de pago...', {
          description: `Plan: ${planName}. Por favor completa tu pago.`,
        });

        // 2. Ejecutar el callback para pasar al siguiente paso (Pasarela de Pago)
        onSuccess(values);

      } else {
        toast.error('Error al guardar tus datos', result.error || 'Algo salió mal. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Error de red', { description: 'No se pudo conectar con el servidor.' });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-center flex items-center justify-center gap-2 text-primary">
        <Zap className="w-6 h-6" /> Paso 1: Confirma tus Datos
      </h3>
      <p className="text-center text-muted-foreground">
        Estás a punto de inscribirte al **{planName.toUpperCase()}**.
        Solo necesitamos tus datos para reservarte el cupo.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><User className="w-4 h-4 mr-2" /> Nombre Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Juan Pérez" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Mail className="w-4 h-4 mr-2" /> Correo Electrónico</FormLabel>
                <FormControl>
                  <Input placeholder="ejemplo@correo.com" type="email" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Smartphone className="w-4 h-4 mr-2" /> Número de WhatsApp</FormLabel>
                <FormControl>
                  {/* Nota: Usamos type="tel" y pattern para mejor UX en móviles */}
                  <Input
                    placeholder="Ej: 3101234567"
                    type="tel"
                    pattern="[0-9]*"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reservando Cupo...</>
            ) : (
              "Continuar al Pago"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default LeadForm;

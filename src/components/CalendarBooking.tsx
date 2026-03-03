// src/components/CalendarBooking.tsx
"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Loader2, Check, ExternalLink } from "lucide-react";
import { toast } from 'sonner';

interface SlotData {
  fecha: string;
  hora: string;
  timestamp: Date;
  disponible: boolean;
}

interface CalendarBookingProps {
  reservaId: string;
  paymentSessionToken: string;
  onComplete: () => void;
}

export default function CalendarBooking({ reservaId, paymentSessionToken, onComplete }: CalendarBookingProps) {
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [notas, setNotas] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [whatsappLinks, setWhatsappLinks] = useState<{
    cliente: string;
    entrenador: string;
  } | null>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const response = await fetch('/api/calendar/slots?dias=7');
        const data = await response.json();
        
        if (data.ok) {
          setSlots(data.slots);
        } else {
          toast.error("Error cargando horarios disponibles");
        }
      } catch (error) {
        console.error("Error fetching slots:", error);
        toast.error("Error de conexión");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlots();
  }, []);

  const handleBooking = async () => {
    if (!selectedSlot) {
      toast.error("Selecciona un horario");
      return;
    }

    setIsBooking(true);

    try {
      const response = await fetch('/api/calendar/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservaId,
          fechaHora: selectedSlot.timestamp,
          paymentSessionToken,
          notas: notas.trim() || undefined
        })
      });

      const data = await response.json();

      if (data.ok) {
        setWhatsappLinks(data.notificaciones.whatsappLinks);
        setBookingComplete(true);
        
        toast.success("¡Sesión agendada exitosamente!", {
          description: "Revisa tu email para más detalles",
          duration: 5000,
        });
      } else {
        toast.error(data.error || "Error al agendar");
      }
    } catch (error) {
      console.error("Error booking:", error);
      toast.error("Error al agendar la sesión");
    } finally {
      setIsBooking(false);
    }
  };

  // Agrupar slots por fecha
  const slotsPorFecha = slots.reduce((acc, slot) => {
    if (!acc[slot.fecha]) {
      acc[slot.fecha] = [];
    }
    acc[slot.fecha].push(slot);
    return acc;
  }, {} as Record<string, SlotData[]>);

  const fechasDisponibles = Object.keys(slotsPorFecha).sort();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando horarios disponibles...</p>
      </div>
    );
  }

  if (bookingComplete && whatsappLinks) {
    return (
      <div className="space-y-6 py-4">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-green-600">¡Reserva Confirmada!</h3>
          <p className="text-muted-foreground">
            Tu sesión ha sido agendada exitosamente. Hemos enviado la confirmación a tu email.
          </p>
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Detalles de tu sesión:
            </h4>
            <div className="space-y-2 text-sm">
              <p><strong>Fecha:</strong> {selectedSlot?.fecha}</p>
              <p><strong>Hora:</strong> {selectedSlot?.hora}</p>
              <p><strong>Duración:</strong> 60 minutos</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h4 className="font-semibold">Próximos pasos:</h4>
          
          <Button
            className="w-full"
            variant="default"
            onClick={() => window.open(whatsappLinks.cliente, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Confirmar por WhatsApp
          </Button>

          <Button
            className="w-full"
            variant="outline"
            onClick={onComplete}
          >
            Cerrar
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          También hemos enviado la confirmación al entrenador
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Selecciona tu Horario</h3>
        <p className="text-sm text-muted-foreground">
          Elige el día y hora que mejor te convenga
        </p>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {fechasDisponibles.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay horarios disponibles en este momento
          </p>
        ) : (
          fechasDisponibles.map((fecha) => {
            const fechaObj = new Date(fecha);
            const fechaFormateada = fechaObj.toLocaleDateString('es-CO', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            });

            const slotsDelDia = slotsPorFecha[fecha].filter(s => s.disponible);

            if (slotsDelDia.length === 0) return null;

            return (
              <div key={fecha} className="space-y-2">
                <h4 className="font-semibold text-sm capitalize flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {fechaFormateada}
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {slotsDelDia.map((slot) => (
                    <Button
                      key={`${slot.fecha}-${slot.hora}`}
                      variant={
                        selectedSlot?.timestamp === slot.timestamp
                          ? "default"
                          : "outline"
                      }
                      className="text-xs"
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {slot.hora}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedSlot && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Horario seleccionado:</p>
                <p className="text-lg font-bold">
                  {selectedSlot.fecha} - {selectedSlot.hora}
                </p>
              </div>
              <Badge variant="default">1 hora</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Notas adicionales (opcional)</label>
        <Textarea
          placeholder="Ej: Tengo una lesión en la rodilla, necesito ejercicios de bajo impacto..."
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
        />
      </div>

      <Button
        className="w-full"
        disabled={!selectedSlot || isBooking}
        onClick={handleBooking}
      >
        {isBooking ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Agendando...
          </>
        ) : (
          <>
            <Check className="w-4 h-4 mr-2" />
            Confirmar Reserva
          </>
        )}
      </Button>
    </div>
  );
}

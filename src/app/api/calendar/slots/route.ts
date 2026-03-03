// src/app/api/calendar/slots/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Reserva from "@/models/Reserva";

// Configuración de horarios del entrenador
const HORARIOS_CONFIG = {
  // Horarios disponibles por día (24h format)
  diasLaborables: [1, 2, 3, 4, 5, 6], // Lunes a Sábado (0=Domingo, 6=Sábado)
  horaInicio: 6, // 6:00 AM
  horaFin: 20,   // 8:00 PM
  duracionSesion: 60, // minutos
  descansoEntreSesiones: 0, // minutos entre sesiones
};

function generarSlots(fecha: Date): Date[] {
  const slots: Date[] = [];
  const { horaInicio, horaFin, duracionSesion, descansoEntreSesiones } = HORARIOS_CONFIG;
  
  let horaActual = horaInicio;
  
  while (horaActual + (duracionSesion / 60) <= horaFin) {
    const slot = new Date(fecha);
    slot.setHours(horaActual, 0, 0, 0);
    slots.push(slot);
    
    horaActual += (duracionSesion + descansoEntreSesiones) / 60;
  }
  
  return slots;
}

function esDiaLaboral(fecha: Date): boolean {
  const dia = fecha.getDay();
  return HORARIOS_CONFIG.diasLaborables.includes(dia);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fechaParam = searchParams.get('fecha'); // formato: YYYY-MM-DD
    const diasAdelante = parseInt(searchParams.get('dias') || '7'); // días a mostrar

    await connectDB();

    const fechaInicio = fechaParam 
      ? new Date(fechaParam) 
      : new Date();
    
    // Asegurar que no se puedan agendar en el pasado
    const ahora = new Date();
    if (fechaInicio < ahora) {
      fechaInicio.setTime(ahora.getTime());
    }

    const slotsDisponibles: Array<{
      fecha: string;
      hora: string;
      timestamp: Date;
      disponible: boolean;
    }> = [];

    // Generar slots para los próximos N días
    for (let i = 0; i < diasAdelante; i++) {
      const fecha = new Date(fechaInicio);
      fecha.setDate(fecha.getDate() + i);
      fecha.setHours(0, 0, 0, 0);

      // Solo días laborables
      if (!esDiaLaboral(fecha)) continue;

      const slots = generarSlots(fecha);

      // Consultar reservas existentes para este día
      const inicioDelDia = new Date(fecha);
      inicioDelDia.setHours(0, 0, 0, 0);
      
      const finDelDia = new Date(fecha);
      finDelDia.setHours(23, 59, 59, 999);

      const reservasDelDia = await Reserva.find({
        fechaHora: {
          $gte: inicioDelDia,
          $lte: finDelDia
        },
        estado: { $in: ['confirmada', 'pendiente'] }
      });

      const horasReservadas = new Set(
        reservasDelDia.map(r => r.fechaHora.getTime())
      );

      // Agregar slots con disponibilidad
      for (const slot of slots) {
        // No permitir agendar en el pasado (con 2 horas de anticipación)
        const dosHorasAntes = new Date();
        dosHorasAntes.setHours(dosHorasAntes.getHours() + 2);
        
        if (slot < dosHorasAntes) continue;

        const disponible = !horasReservadas.has(slot.getTime());

        slotsDisponibles.push({
          fecha: slot.toISOString().split('T')[0],
          hora: slot.toLocaleTimeString('es-CO', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          timestamp: slot,
          disponible
        });
      }
    }

    return NextResponse.json({
      ok: true,
      slots: slotsDisponibles,
      config: {
        duracionSesion: HORARIOS_CONFIG.duracionSesion,
        diasLaborables: HORARIOS_CONFIG.diasLaborables,
      }
    });

  } catch (error) {
    console.error("Error obteniendo slots:", error);
    return NextResponse.json(
      { error: "Error al obtener horarios" }, 
      { status: 500 }
    );
  }
}

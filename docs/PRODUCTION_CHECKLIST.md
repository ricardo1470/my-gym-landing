# Production Checklist (Vercel + MongoDB + Nequi)

## Estado Actual
- Base de datos principal: MongoDB Atlas (persistencia de negocio).
- Seguridad de pagos: rate-limit y anti-replay con soporte Redis distribuido.
- Entorno actual: desarrollo/simulación.

## Pendientes para pasar a producción
1. Crear base Redis en Upstash.
2. Copiar credenciales REST de Upstash:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Configurar esas variables en Vercel (Project Settings -> Environment Variables).
4. Confirmar que en producción estén desactivadas simulaciones:
   - `PAYMENT_SIMULATION_ENABLED=false`
5. Configurar credenciales reales de Nequi:
   - `NEQUI_CLIENT_ID`
   - `NEQUI_CLIENT_SECRET`
   - `NEQUI_API_KEY`
   - `NEQUI_MERCHANT_CODE`
   - `NEQUI_WEBHOOK_SECRET`
6. Configurar URL pública de webhook en Nequi apuntando a:
   - `/api/payment/status` (POST firmado)
7. Validar entorno de producción en Vercel:
   - redeploy después de guardar variables
   - prueba de pago real controlada
8. Rotar y sanear secretos antiguos antes del go-live.

## Nota técnica importante
- MongoDB y Redis no compiten: cumplen roles distintos.
- MongoDB guarda datos de negocio (inscripciones, reservas, pagos).
- Redis se usa para controles de seguridad en tiempo real:
  - rate-limit distribuido
  - anti-replay distribuido de webhooks
- En Vercel (múltiples instancias serverless), memoria local no es compartida.
  Por eso Redis es recomendado para que los límites y bloqueos sean consistentes.

## Verificación rápida post-despliegue
1. Confirmar que los endpoints devuelven `429` al exceder límites.
2. Confirmar que webhook duplicado devuelve conflicto/replay.
3. Confirmar que pagos con token inválido siguen dando `403`.
4. Confirmar que `callback` continúa deshabilitado (`410`).

## Verificación local automatizada
- Ejecutar app local:
  - `pnpm dev`
- En otra terminal, correr smoke test de seguridad:
  - `pnpm test:security`
- Este test valida automáticamente:
  1. `callback` deshabilitado (`410`)
  2. token inválido en estado de pago (`403`)
  3. replay de webhook (`409`)
  4. rate-limit (`429`)

# METARESPONDER - Business Logic

## 1. Problema

El mostrador de una tienda de repuestos es un caos. WhatsApp explota con mensajes de "tienes la estopera de tal modelo", "pásame precio", "mándame foto". Se pierden ventas por falta de velocidad.

## 2. Usuario Objetivo

Tiendas de repuestos automotrices

## 3. Funcionalidades

### Core Features

1. **Agente IA WhatsApp**
   - Conexión a WhatsApp Business API
   - Lectura de catálogo (Excel/PDF)
   - Respuestas automáticas de precios y disponibilidad
   - Disponibilidad 24/7
   - Multidioma (español/inglés)

2. **Dashboard**
   - Panel de control con métricas
   - Historial de conversaciones
   - Gestión de inventario
   - Reportes de ventas

### Features Secundarias

- Subida de catálogo (Excel/PDF/CSV)
- Búsqueda de repuestos por marca/modelo
- Notificaciones de stock bajo
- Opiniones de clientes

## 4. Tech Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Estilos | Tailwind CSS 3.4 + shadcn/ui |
| Backend | Supabase (Auth + PostgreSQL) |
| AI | Vercel AI SDK + OpenRouter |
| WhatsApp | Meta Business API |
| Storage | Supabase Storage |

## 5. Data Model

### Users (Tiendas)
- id, email, nombre_tienda, telefono, plan, created_at

### Catalogo
- id, user_id, marca, modelo, nombre_repuesto, precio, stock, imagen_url, created_at

### Conversaciones
- id, user_id, cliente_telefono, mensaje, respuesta_ia, timestamp

### Configuracion
- id, user_id, horario_atencion, respuestas_personalizadas

---

*Documento generado por /new-app*
*Fecha: 2026-03-05*

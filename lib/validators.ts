import { z } from 'zod';

export const crearClienteSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1).nullable().optional(),
  ubicacion: z.string().min(1).nullable().optional(),
  telefono: z.string().min(1).nullable().optional(),
  email: z.string().email().nullable().optional(),
});

export const actualizarClienteSchema = crearClienteSchema
  .partial()
  .extend({ nombre: z.string().min(1).optional() });

export const crearPedidoSchema = z.object({
  numero: z.number().int().positive(),
  clienteId: z.number().int().positive().optional(),
  clienteNombre: z.string().min(1).optional(),
  cliente: z.string().min(1).optional(), // compat payloads antiguos
  contacto: z.string().optional(),
  items: z
    .array(
      z.object({
        productoId: z.number().int().positive(),
        cantidad: z.number().int().positive(),
      }),
    )
    .min(1),
  crearLoteRaiz: z.boolean().optional(),
});

export const dashboardPedidosQuerySchema = z.object({
  cliente: z.string().trim().min(1).optional(),
  desde: z
    .string()
    .trim()
    .min(1)
    .transform((s) => new Date(s))
    .refine((d) => !Number.isNaN(d.getTime()), { message: 'desde inválido' })
    .optional(),
  hasta: z
    .string()
    .trim()
    .min(1)
    .transform((s) => new Date(s))
    .refine((d) => !Number.isNaN(d.getTime()), { message: 'hasta inválido' })
    .optional(),
  status: z.enum(['IN_PROCESS', 'DELAYED', 'COMPLETED']).optional(),
});

export const dashboardTalleresQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  tipo: z.string().trim().min(1).optional(),
});

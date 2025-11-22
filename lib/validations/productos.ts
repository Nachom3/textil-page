import { z } from 'zod';

export const plantillaPasoSchema = z.object({
  id: z.number().optional(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  orden: z.number().int().nonnegative(),
  duracionEstimadaDias: z.number().positive().optional().nullable(),
  tallerPorDefectoId: z.number().int().positive().optional().nullable(),
});

export const productoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  codigo: z.string().min(1, 'El código es requerido'),
  tieneTalles: z.boolean().optional(),
  plantilla: z.array(plantillaPasoSchema).optional(),
});

export type ProductoFormValues = z.infer<typeof productoSchema>;

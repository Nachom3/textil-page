import { z } from 'zod';

export const pedidoItemSchema = z.object({
  productoId: z.number().int().positive(),
  cantidad: z.number().int().positive(),
  precio: z.number().nonnegative().optional().nullable(),
});

export const nuevoPedidoSchema = z.object({
  clienteId: z.number().int().positive(),
  fechaEntrega: z.date().optional().nullable(),
  items: z.array(pedidoItemSchema).min(1, 'Debe agregar al menos un producto'),
});

export type NuevoPedidoFormValues = z.infer<typeof nuevoPedidoSchema>;

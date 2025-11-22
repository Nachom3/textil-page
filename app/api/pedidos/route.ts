// app/api/pedidos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { crearPedido } from '@/lib/pedidos';
import { crearPedidoSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = crearPedidoSchema.parse(raw);

    const {
      numero,
      clienteId,
      clienteNombre,
      cliente, // compatibilidad con payloads antiguos
      contacto,
      items,
      crearLoteRaiz,
    } = parsed;

    const nombreNormalizado = clienteNombre ?? cliente;

    if (!clienteId && !nombreNormalizado) {
      return NextResponse.json(
        { error: 'clienteId o clienteNombre son requeridos', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    const result = await crearPedido({
      numero,
      clienteId,
      clienteNombre: nombreNormalizado,
      contacto,
      items,
      crearLoteRaiz,
    });

    return NextResponse.json(result, { status: 201 }); // { pedido, lotesRaiz }
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error && typeof error === 'object' && (error as any).name === 'ZodError'
            ? 'Payload inválido'
            : error instanceof Error
              ? error.message
              : 'Error creando pedido',
        code: (error as any)?.name === 'ZodError' ? 'VALIDATION_ERROR' : 'SERVER_ERROR',
      },
      { status: (error as any)?.name === 'ZodError' ? 400 : 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { listarProductos, crearProducto } from '@/lib/productos';

export async function GET() {
  try {
    const productos = await listarProductos();
    return NextResponse.json(productos);
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error listando productos',
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, codigo, tieneTalles } = body;

    if (!nombre || !codigo) {
      return NextResponse.json(
        { error: 'nombre y codigo son requeridos' },
        { status: 400 },
      );
    }

    const producto = await crearProducto({ nombre, codigo, tieneTalles });
    return NextResponse.json(producto, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error creando producto',
      },
      { status: 500 },
    );
  }
}

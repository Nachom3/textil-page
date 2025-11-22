'use server';

import { redirect } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useForm, FormProvider } from 'react-hook-form';
import { prisma } from '@/lib/prisma';
import { productoSchema, type ProductoFormValues } from '@/lib/validations/productos';
import DynamicStepsForm from '@/components/productos/DynamicStepsForm';
import { toast } from 'sonner';

type Params = { params: Promise<{ id: string }> };

async function saveProducto(data: ProductoFormValues, id?: number) {
  const url = id ? `/api/productos/${id}` : '/api/productos';
  const res = await fetch(url, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error guardando producto');
  }
  return res.json();
}

function ProductoForm({ initial }: { initial: ProductoFormValues & { id?: number } }) {
  const useFormAny: any = useForm;
  const methods = useFormAny({
    defaultValues: initial,
    resolver: zodResolver(productoSchema),
  }) as any;

  const onSubmit = methods.handleSubmit(async (values: ProductoFormValues) => {
    try {
      const resp = await saveProducto(values, initial.id);
      toast.success(initial.id ? 'Producto actualizado' : 'Producto creado');
      window.location.href = `/dashboard/productos`;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error guardando');
    }
  });

  return (
    <FormProvider {...methods}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <Stack spacing={2}>
          <TextField label="Nombre" {...methods.register('nombre')} />
          <TextField label="Código" {...methods.register('codigo')} />
          <DynamicStepsForm />
          <div className="flex gap-2">
            <Button type="submit" variant="contained">
              Guardar
            </Button>
            <Button href="/dashboard/productos" component="a">
              Cancelar
            </Button>
          </div>
        </Stack>
      </form>
    </FormProvider>
  );
}

export default async function ProductoPage({ params }: Params) {
  const { id } = await params;
  const isNew = id === 'nuevo';
  let initial: ProductoFormValues & { id?: number } = {
    nombre: '',
    codigo: '',
    tieneTalles: false,
    plantilla: [],
  };

  if (!isNew) {
    const productoId = Number(id);
    if (Number.isNaN(productoId)) redirect('/dashboard/productos');

    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
      include: {
        plantillaPasos: {
          orderBy: { orden: 'asc' },
          select: {
            id: true,
            nombre: true,
            orden: true,
            duracionEstimadaDias: true,
            tallerPorDefectoId: true,
          },
        },
      },
    });
    if (!producto) redirect('/dashboard/productos');

    initial = {
      id: producto.id,
      nombre: producto.nombre,
      codigo: producto.codigo,
      tieneTalles: producto.tieneTalles,
      plantilla: producto.plantillaPasos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        orden: p.orden,
        duracionEstimadaDias: p.duracionEstimadaDias ?? undefined,
        tallerPorDefectoId: p.tallerPorDefectoId ?? undefined,
      })),
    };
  }

  return (
    <Box p={3} className="space-y-3">
      <Typography variant="h5">{isNew ? 'Nuevo producto' : 'Editar producto'}</Typography>
      {/* eslint-disable-next-line @next/next/no-async-client-component */}
      <ProductoForm initial={initial} />
    </Box>
  );
}

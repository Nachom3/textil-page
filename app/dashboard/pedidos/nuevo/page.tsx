'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Autocomplete,
} from '@mui/material';
import { useForm, FormProvider, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { nuevoPedidoSchema, type NuevoPedidoFormValues } from '@/lib/validations/pedidos';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type Option = { label: string; value: number; steps?: { nombre: string; orden?: number | null }[] };

export default function NuevoPedidoPage() {
  const router = useRouter();
  const useFormAny: any = useForm;
  const methods = useFormAny({
    resolver: zodResolver(nuevoPedidoSchema),
    defaultValues: { items: [{ productoId: 0, cantidad: 1, precio: 0 }] },
  }) as any;
  const [activeStep, setActiveStep] = useState(0);
  const [clientes, setClientes] = useState<Option[]>([]);
  const [productos, setProductos] = useState<Option[]>([]);
  const { fields, append, remove, update } = useFieldArray({
    control: methods.control,
    name: 'items',
  });

  useEffect(() => {
    const fetchClientes = async () => {
      const res = await fetch('/api/clientes');
      if (res.ok) {
        const data = await res.json();
        setClientes(
          data.map((c: any) => ({ label: c.nombre ?? `Cliente ${c.id}`, value: c.id })),
        );
      }
    };
    const fetchProductos = async () => {
      const res = await fetch('/api/productos');
      if (res.ok) {
        const data = await res.json();
        setProductos(
          data.map((p: any) => ({
            label: p.nombre,
            value: p.id,
            steps: p.plantillaPasos?.map((s: any) => ({ nombre: s.nombre, orden: s.orden })),
          })),
        );
      }
    };
    fetchClientes();
    fetchProductos();
  }, []);

  const onSubmit = methods.handleSubmit(async (values: NuevoPedidoFormValues) => {
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: Math.floor(Math.random() * 100000),
          clienteId: values.clienteId,
          items: values.items.map((i) => ({
            productoId: i.productoId,
            cantidad: i.cantidad,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error creando pedido');
      }
      const data = await res.json();
      toast.success('Pedido generado');
      router.push(`/dashboard/pedidos/${data.pedido.numero}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear pedido');
    }
  });

  const Step1 = (
    <Stack spacing={2}>
      <Controller
        control={methods.control}
        name="clienteId"
        render={({ field, fieldState }: any) => (
          <Autocomplete
            options={clientes}
            getOptionLabel={(o) => o.label}
            onChange={(_, val) => field.onChange(val?.value ?? 0)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Cliente"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        )}
      />
      <Controller
        control={methods.control}
        name="fechaEntrega"
        render={({ field }: any) => (
          <TextField
            label="Fecha entrega"
            type="date"
            value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
          />
        )}
      />
    </Stack>
  );

  const Step2 = (
    <Stack spacing={2}>
      {fields.map((f: any, idx: number) => {
        const selectedOption = productos.find(
          (p) => p.value === methods.watch(`items.${idx}.productoId`),
        );
        return (
          <Card key={f.id}>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <Typography variant="subtitle1">Producto #{idx + 1}</Typography>
                {fields.length > 1 && (
                  <Button size="small" color="error" onClick={() => remove(idx)}>
                    Quitar
                  </Button>
                )}
              </div>
              <Controller
                control={methods.control}
                name={`items.${idx}.productoId`}
                render={({ field, fieldState }: any) => (
                  <Autocomplete
                    options={productos}
                    getOptionLabel={(o) => o.label}
                    value={productos.find((o) => o.value === field.value) ?? null}
                    onChange={(_, val) => field.onChange(val?.value ?? 0)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Producto"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                )}
              />
              <TextField
                label="Cantidad"
                type="number"
                {...methods.register(`items.${idx}.cantidad` as const, { valueAsNumber: true })}
              />
              {selectedOption?.steps?.length ? (
                <div className="rounded-md border border-slate-200 p-2">
                  <Typography variant="body2" className="font-medium">
                    Pasos de producción
                  </Typography>
                  <div className="text-sm text-slate-600">
                    {selectedOption.steps
                      ?.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
                      .map((s) => (
                        <div key={`${s.nombre}-${s.orden}`} className="flex gap-2">
                          <span className="w-10 text-right">{s.orden ?? '-'}</span>
                          <span>{s.nombre}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
      <Button variant="outlined" onClick={() => append({ productoId: 0, cantidad: 1, precio: 0 })}>
        Agregar producto
      </Button>
    </Stack>
  );

  return (
    <FormProvider {...methods}>
      <Box p={3} className="space-y-4">
        <Typography variant="h5">Nuevo Pedido</Typography>
        <Stepper activeStep={activeStep}>
          <Step>
            <StepLabel>Datos básicos</StepLabel>
          </Step>
          <Step>
            <StepLabel>Items</StepLabel>
          </Step>
        </Stepper>

        {activeStep === 0 && Step1}
        {activeStep === 1 && Step2}

        <Divider />
        <div className="flex justify-between">
          <Button disabled={activeStep === 0} onClick={() => setActiveStep((s) => s - 1)}>
            Atrás
          </Button>
          {activeStep < 1 ? (
            <Button variant="contained" onClick={() => setActiveStep((s) => s + 1)}>
              Siguiente
            </Button>
          ) : (
            <Button variant="contained" onClick={onSubmit}>
              Crear pedido
            </Button>
          )}
        </div>
      </Box>
    </FormProvider>
  );
}

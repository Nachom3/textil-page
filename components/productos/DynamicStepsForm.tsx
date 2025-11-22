'use client';

import { Button, IconButton, Stack, TextField } from '@mui/material';
import { Add, ArrowDownward, ArrowUpward, Delete } from '@mui/icons-material';
import { useFieldArray, useFormContext } from 'react-hook-form';

type Props = {
  name?: string;
};

export default function DynamicStepsForm({ name = 'plantilla' }: Props) {
  const { control, register } = useFormContext();
  const { fields, append, swap, remove } = useFieldArray({
    control,
    name,
  });

  const onAdd = () =>
    append({
      nombre: '',
      orden: fields.length + 1,
      duracionEstimadaDias: 1,
      tallerPorDefectoId: null,
    });

  return (
    <Stack spacing={2}>
      <div className="flex items-center justify-between">
        <span className="font-medium">Plantilla de Producción</span>
        <Button startIcon={<Add />} size="small" variant="outlined" onClick={onAdd}>
          Agregar paso
        </Button>
      </div>
      {fields.map((field: any, index: number) => {
        const base = `${name}.${index}`;
        return (
          <div
            key={field.id}
            className="rounded-md border border-slate-200 p-3 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <TextField
                label="Nombre"
                size="small"
                {...register(`${base}.nombre` as const)}
              />
              <TextField
                label="Orden"
                type="number"
                size="small"
                sx={{ width: 100 }}
                {...register(`${base}.orden` as const, { valueAsNumber: true })}
              />
              <TextField
                label="Tiempo estimado (días)"
                type="number"
                size="small"
                sx={{ width: 170 }}
                {...register(`${base}.duracionEstimadaDias` as const, { valueAsNumber: true })}
              />
              <TextField
                label="Taller por defecto (ID)"
                type="number"
                size="small"
                sx={{ width: 170 }}
                {...register(`${base}.tallerPorDefectoId` as const, { valueAsNumber: true })}
              />
              <div className="ml-auto flex items-center gap-1">
                <IconButton
                  size="small"
                  disabled={index === 0}
                  onClick={() => swap(index, index - 1)}
                >
                  <ArrowUpward fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  disabled={index === fields.length - 1}
                  onClick={() => swap(index, index + 1)}
                >
                  <ArrowDownward fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => remove(index)}>
                  <Delete fontSize="small" />
                </IconButton>
              </div>
            </div>
          </div>
        );
      })}
    </Stack>
  );
}

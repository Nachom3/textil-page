// app/dashboard/_components/ActionButtons.tsx
'use client';

import Link from 'next/link';
import { Stack, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export const ActionButtons = () => {
  return (
    <Stack direction="row" spacing={2}>
      <Button variant="outlined" startIcon={<AddIcon />} component={Link} href="/dashboard/productos/nuevo">
        Producto
      </Button>
      <Button variant="contained" startIcon={<AddIcon />} disableElevation component={Link} href="/dashboard/pedidos/nuevo">
        Nuevo Pedido
      </Button>
    </Stack>
  );
};

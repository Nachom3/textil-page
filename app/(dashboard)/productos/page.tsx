'use client';

import Link from 'next/link';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';

const sample = [
  { nombre: 'Remera', codigo: 'R001', tieneTalles: true },
  { nombre: 'Pantalon', codigo: 'P050', tieneTalles: false },
];

export default function ProductosPage() {
  return (
    <Box component="main" sx={{ px: 3, py: 6 }}>
      <Stack spacing={2} sx={{ maxWidth: 900, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <div>
            <Typography variant="h5" fontWeight={600}>
              Productos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestiona el catalogo de productos y talles.
            </Typography>
          </div>
          <Button component={Link} href="/api/productos" variant="contained">
            Ver API
          </Button>
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          }}
        >
          {sample.map((prod) => (
            <Box key={prod.codigo}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {prod.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Codigo: {prod.codigo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {prod.tieneTalles ? 'Con talles' : 'Sin talles'}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}

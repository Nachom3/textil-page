'use client';

import Link from 'next/link';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Box,
  Container,
  Stack,
  Typography,
} from '@mui/material';

const shortcuts = [
  {
    title: 'Pedidos',
    description: 'Revisa el detalle de pedidos y su arbol de lotes.',
    href: '/pedidos/123',
    action: 'Ver pedidos',
  },
  {
    title: 'Talleres',
    description: 'Mira que lotes estan en cada taller actualmente.',
    href: '/talleres/1',
    action: 'Ver talleres',
  },
  {
    title: 'Reporte diario',
    description: 'Selecciona una fecha y obten el listado de procesos.',
    href: '/reportes/dia',
    action: 'Ver reporte',
  },
  {
    title: 'Productos',
    description: 'Administra el catalogo de productos y talles.',
    href: '/productos',
    action: 'Ver productos',
  },
];

export default function Home() {
  return (
    <Container maxWidth="lg" sx={{ py: 10 }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="overline" color="text.secondary">
            Paginatexil
          </Typography>
          <Typography variant="h4" fontWeight={600}>
            Panel principal
          </Typography>
          <Typography color="text.secondary">
            Accede rapido a pedidos, talleres y reportes diarios de procesos.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              component={Link}
              href="/talleres/1"
              variant="contained"
              color="primary"
            >
              Ir a talleres
            </Button>
            <Button
              component={Link}
              href="/pedidos/123"
              variant="outlined"
              color="primary"
            >
              Ir a pedidos
            </Button>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          }}
        >
          {shortcuts.map((item) => (
            <Box key={item.title}>
              <Card elevation={1} sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    component={Link}
                    href={item.href}
                    size="small"
                    variant="text"
                  >
                    {item.action}
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      </Stack>
    </Container>
  );
}

import { ReactNode } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Inventory2Outlined as ProductIcon,
  ShoppingBagOutlined as OrderIcon,
  FactoryOutlined as FactoryIcon,
  ArrowForward as ArrowIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { prisma } from '@/lib/prisma';
import { obtenerPedidoConMetricas } from '@/lib/pedidos';
import { ActionButtons } from './_components/ActionButtons';

async function getDashboardData() {
  const [pedidoCount, loteCount, productoCount, pedidos] = await Promise.all([
    prisma.pedido.count(),
    prisma.lote.count({ where: { estado: { in: ['ACTIVO', 'DIVIDIDO'] } } }),
    prisma.producto.count(),
    prisma.pedido.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { cliente: true },
    }),
  ]);

  const pedidosConMetricas = [];
  for (const p of pedidos) {
    const detalle = await obtenerPedidoConMetricas(p.numero);
    if (detalle) pedidosConMetricas.push(detalle);
  }

  return {
    stats: { pedidos: pedidoCount, lotesActivos: loteCount, productos: productoCount },
    recientes: pedidosConMetricas,
  };
}

const getStatusColor = (status: string): 'success' | 'warning' | 'info' | 'default' => {
  switch (status) {
    case 'TERMINADO':
      return 'success';
    case 'DIVIDIDO':
      return 'warning';
    case 'ACTIVO':
      return 'info';
    default:
      return 'default';
  }
};

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
  color: string;
}) {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={3}>
          <Stack spacing={1}>
            <Typography color="text.secondary" variant="overline">
              {title}
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Stack>
          <Avatar
            sx={{
              backgroundColor: `${color}.light`,
              color: `${color}.main`,
              height: 56,
              width: 56,
            }}
          >
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const { stats, recientes } = await getDashboardData();

  const weeklyData = [
    { label: 'Lun', value: 20 },
    { label: 'Mar', value: 35 },
    { label: 'Mié', value: 28 },
    { label: 'Jue', value: 40 },
    { label: 'Vie', value: 45 },
  ];
  const maxValue = Math.max(...weeklyData.map((d) => d.value));

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="space-between" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bienvenido de nuevo. Aquí tienes el resumen de producción de hoy.
          </Typography>
        </Box>
        <ActionButtons /> {/* ✅ Reemplazo seguro */}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          mb: 3,
        }}
      >
        <StatCard
          title="Pedidos Totales"
          value={stats.pedidos}
          subtitle="Registrados en el sistema"
          icon={<OrderIcon fontSize="large" />}
          color="primary"
        />
        <StatCard
          title="Producción Activa"
          value={stats.lotesActivos}
          subtitle="Lotes en curso o divididos"
          icon={<FactoryIcon fontSize="large" />}
          color="warning"
        />
        <StatCard
          title="Catálogo"
          value={stats.productos}
          subtitle="Productos disponibles"
          icon={<ProductIcon fontSize="large" />}
          color="success"
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
        }}
      >
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
          <CardHeader
            title="Pedidos Recientes"
            action={
              <Button size="small" endIcon={<ArrowIcon />} href="/dashboard/pedidos">
                Ver todos
              </Button>
            }
          />
          <Divider />
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell>Pedido</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Estado Global</TableCell>
                  <TableCell>Progreso</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recientes.map((p) => {
                  const estadoLotes = p.lotes.every((l) => l.estado === 'TERMINADO')
                    ? 'TERMINADO'
                    : p.lotes.some((l) => l.estado === 'DIVIDIDO')
                      ? 'DIVIDIDO'
                      : 'ACTIVO';
                  const avancePct = Math.round((p.metricas.avancePedido ?? 0) * 100);

                  return (
                    <TableRow key={p.pedido.id} hover>
                      <TableCell sx={{ fontWeight: 'medium' }}>#{p.pedido.numero}</TableCell>
                      <TableCell>{p.pedido.cliente?.nombre ?? '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={estadoLotes}
                          color={getStatusColor(estadoLotes)}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <Box
                              sx={{
                                height: 6,
                                borderRadius: 5,
                                bgcolor: 'action.selected',
                                overflow: 'hidden',
                              }}
                            >
                              <Box
                                sx={{
                                  height: '100%',
                                  width: `${avancePct}%`,
                                  bgcolor:
                                    avancePct === 100
                                      ? 'success.main'
                                      : avancePct > 50
                                        ? 'primary.main'
                                        : 'warning.main',
                                }}
                              />
                            </Box>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {avancePct}%
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Ver detalles">
                          <IconButton size="small" href={`/dashboard/pedidos/${p.pedido.numero}`}>
                            <ArrowIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {recientes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No hay pedidos recientes.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
          <CardHeader
            title="Tendencia Semanal"
            subheader="Pedidos ingresados"
            action={<IconButton size="small"><MoreVertIcon /></IconButton>}
          />
          <Divider />
          <CardContent sx={{ height: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', pb: 2 }}>
            {weeklyData.map((data) => {
              const heightPct = (data.value / maxValue) * 100;
              return (
                <Stack key={data.label} alignItems="center" spacing={1} sx={{ height: '100%', justifyContent: 'flex-end', width: '100%' }}>
                  <Tooltip title={`${data.value} pedidos`} placement="top">
                    <Box
                      sx={{
                        width: 12,
                        height: `${heightPct}%`,
                        bgcolor: 'primary.main',
                        borderRadius: '4px 4px 0 0',
                        transition: 'all 0.3s',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                          width: 16,
                        },
                      }}
                    />
                  </Tooltip>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    {data.label}
                  </Typography>
                </Stack>
              );
            })}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

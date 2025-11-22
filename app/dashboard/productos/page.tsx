'use server';

import Link from 'next/link';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { prisma } from '@/lib/prisma';

export default async function ProductosPage() {
  const productos = await prisma.producto.findMany({
    orderBy: { nombre: 'asc' },
    select: {
      id: true,
      nombre: true,
      codigo: true,
      tieneTalles: true,
    },
  });

  return (
    <Box p={3} className="space-y-3">
      <div className="flex items-center justify-between">
        <Typography variant="h5">Productos</Typography>
        <Link href="/dashboard/productos/nuevo">
          <Button component="a" variant="contained">
            Nuevo producto
          </Button>
        </Link>
      </div>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Código</TableCell>
            <TableCell>Talles</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {productos.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.nombre}</TableCell>
              <TableCell>{p.codigo}</TableCell>
              <TableCell>{p.tieneTalles ? 'Sí' : 'No'}</TableCell>
              <TableCell align="right">
                <Link href={`/dashboard/productos/${p.id}`}>
                  <Button component="a" size="small">
                    Editar
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

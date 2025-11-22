'use client';

import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
} from '@mui/material';
import {
  Home as HomeIcon,
  AddBox as AddBoxIcon,
  Search as SearchIcon,
  Inventory2 as ProductsIcon,
  LocalShipping as TransportIcon,
  People as ProvidersIcon,
  Build as WorkshopIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

const navItems = [
  { label: 'Inicio', href: '/dashboard', icon: <HomeIcon /> },
  { label: 'Nuevo Pedido', href: '/dashboard/pedidos/nuevo', icon: <AddBoxIcon /> },
  { label: 'Seguimiento', href: '/dashboard/seguimiento', icon: <SearchIcon /> },
  { label: 'Productos', href: '/dashboard/productos', icon: <ProductsIcon /> },
  { label: 'Proveedores', href: '/dashboard/proveedores', icon: <ProvidersIcon /> },
  { label: 'Talleres', href: '/dashboard/talleres', icon: <WorkshopIcon /> },
  { label: 'Transportistas', href: '/dashboard/transportistas', icon: <TransportIcon /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 900px)');

  const drawerContent = (
    <Box sx={{ width: 240 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="overline" color="text.secondary" fontWeight="bold">
          MENÚ PRINCIPAL
        </Typography>
      </Box>
      <List disablePadding>
        {navItems.map((item) => {
          const selected = pathname === item.href;
          return (
            <ListItem key={item.href} disablePadding>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={selected}
                sx={{ borderRadius: 1, mx: 1, my: 0.5 }}
                onClick={() => isMobile && setMobileOpen(false)}
              >
                <ListItemIcon sx={{ color: selected ? 'primary.main' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: selected ? 'bold' : 'normal',
                    color: selected ? 'primary.main' : 'text.primary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <>
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{
              position: 'fixed',
              top: 16,
              left: 16,
              zIndex: 1301,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <MenuIcon />
          </IconButton>
          <Drawer
            anchor="left"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{
              keepMounted: true, // mejora performance en mobile
            }}
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: 240,
              },
            }}
          >
            {drawerContent}
          </Drawer>
        </>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: 240,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: 240,
              boxSizing: 'border-box',
              borderRight: '1px solid #e0e0e0',
              bgcolor: 'background.default',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
}

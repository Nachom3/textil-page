import { Sidebar } from './_components/Sidebar';
import { Box } from '@mui/material';
import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          ml: { sm: 0, md: '240px' }, // offset cuando sidebar es permanente
          width: '100%',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

'use client';

import { useRouter } from 'next/navigation';

const toast =
  (typeof window !== 'undefined' && (window as any).toast) || {
    success: (msg: string) => console.log(msg),
    error: (msg: string) => console.error(msg),
    info: (msg: string) => console.info(msg),
  };

export function usePedidoActions() {
  const router = useRouter();

  const safeFetch = async (url: string, body?: any) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Error en la operación');
    }
    return res.json();
  };

  const marcarCompleto = async (loteId: number, procesoNombre: string) => {
    try {
      await safeFetch(`/api/produccion/lotes/${loteId}/completar`, {
        procesoNombre,
      });
      toast.success('Paso completado');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error completando');
    }
  };

  const subdividirLote = async (loteId: number) => {
    try {
      // Placeholder sublotes; real UI should collect from user
      await safeFetch(`/api/produccion/lotes/${loteId}/subdividir`, {
        subLotes: [],
      });
      toast.success('Subdivisión creada');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error subdividiendo');
    }
  };

  const moverLote = async (_loteId: number) => {
    toast.info('Mover/Transferir no implementado aún');
  };

  return { marcarCompleto, subdividirLote, moverLote };
}

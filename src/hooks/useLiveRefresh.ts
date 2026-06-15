import { useEffect, useRef, useCallback } from 'react';
import { useSignalRContext } from '../contexts/SignalRContext';

/**
 * Hook untuk listen event RefreshData dari backend via SignalR.
 * @param entityName Entity yang ingin didengarkan (misal "RadioRepairJob"). Null = semua entity.
 * @param onRefresh Callback saat event diterima.
 */
export const useLiveRefresh = (entityName: string | null, onRefresh: () => void) => {
  const { connection, isConnected } = useSignalRContext();

  // Simpan callback terbaru di ref agar tidak perlu re-register listener saat callback berubah
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  });

  // Buat handleRefresh yang stabil dengan useCallback + ref
  // Penting: referensi yang SAMA dipakai untuk .on() dan .off() agar listener bisa dihapus dengan benar
  const handleRefreshRef = useRef<(receivedEntityName: string) => void>(() => {});

  const stableHandler = useCallback((receivedEntityName: string) => {
    if (!entityName || receivedEntityName === entityName) {
      console.log(`[LiveRefresh] Triggered for entity: ${receivedEntityName}`);
      onRefreshRef.current();
    }
  }, [entityName]); // hanya re-buat jika entityName berubah

  // Simpan handler stabil di ref agar bisa dipakai untuk cleanup
  useEffect(() => {
    handleRefreshRef.current = stableHandler;
  }, [stableHandler]);

  useEffect(() => {
    if (!connection || !isConnected) return;

    const handler = (receivedEntityName: string) => {
      handleRefreshRef.current(receivedEntityName);
    };

    connection.on('RefreshData', handler);
    console.log(`[LiveRefresh] Registered listener for: ${entityName ?? 'ALL'}`);

    return () => {
      connection.off('RefreshData', handler);
      console.log(`[LiveRefresh] Unregistered listener for: ${entityName ?? 'ALL'}`);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, isConnected, entityName]);
};

import { useEffect } from 'react';
import { useSignalRContext } from '../contexts/SignalRContext';

/**
 * Hook to automatically listen for backend data refresh events via SignalR.
 * @param entityName The name of the entity to listen for (e.g., "RadioRepairJob", "RadioUnit"). If null, listens to all refresh events.
 * @param onRefresh Callback to execute when a refresh event is received.
 */
export const useLiveRefresh = (entityName: string | null, onRefresh: () => void) => {
  const { connection, isConnected } = useSignalRContext();

  useEffect(() => {
    if (!connection || !isConnected) return;

    const handleRefresh = (receivedEntityName: string) => {
      // If no entityName specified, trigger on any refresh.
      // Otherwise, only trigger if it matches exactly.
      if (!entityName || receivedEntityName === entityName) {
        console.log(`[LiveRefresh] Triggered for entity: ${receivedEntityName}`);
        onRefresh();
      }
    };

    // Listen to generic "RefreshData" event
    connection.on('RefreshData', handleRefresh);

    return () => {
      connection.off('RefreshData', handleRefresh);
    };
  }, [connection, isConnected, entityName, onRefresh]);
};

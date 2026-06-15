import { useSignalRContext } from '../contexts/SignalRContext';

/**
 * @deprecated Use useSignalRContext directly. This is kept for backward compatibility with Layout.tsx.
 */
export const useSignalR = () => {
  return useSignalRContext();
};

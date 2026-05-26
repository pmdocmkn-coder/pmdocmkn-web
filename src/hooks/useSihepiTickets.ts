import { useState, useEffect } from "react";
import { integrationApi, type SihepiTicket } from "../services/integrationApi";
import { useToast } from "./use-toast";

export const useSihepiTickets = () => {
  const [data, setData] = useState<SihepiTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    
    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        const result = await integrationApi.getMknTickets();
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err);
          toast({
            variant: "destructive",
            title: "Gagal memuat tiket SIHEPI",
            description: err.message || "Terjadi kesalahan saat memuat data tiket.",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTickets();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  return { data, isLoading, error };
};

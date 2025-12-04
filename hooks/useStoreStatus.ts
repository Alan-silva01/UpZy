import { useState, useEffect } from 'react';
import { verificarStatusLoja, StatusLoja } from '../services/auth';

export function useStoreStatus(lojaId: string | null) {
  const [statusLoja, setStatusLoja] = useState<StatusLoja | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarStatus = async () => {
      if (!lojaId) {
        setLoading(false);
        return;
      }

      const status = await verificarStatusLoja(lojaId);
      setStatusLoja(status);
      setLoading(false);
    };

    carregarStatus();
  }, [lojaId]);

  const isBlocked = statusLoja?.bloqueado ?? false;
  const isActive = statusLoja?.status === 'ACTIVE';

  return {
    statusLoja,
    loading,
    isBlocked,
    isActive
  };
}

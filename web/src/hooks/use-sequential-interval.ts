import { useEffect, useRef } from "react";

/**
 * Executa `task` no mount e a cada `intervalMs`, sem sobrepor chamadas.
 * Evita acumular fetch quando a API ou a rede estão lentas (ex.: `/api/quotes`).
 */
export function useSequentialInterval(
  task: () => Promise<void>,
  intervalMs: number,
) {
  const taskRef = useRef(task);
  useEffect(() => {
    taskRef.current = task;
  }, [task]);

  useEffect(() => {
    let cancelled = false;
    let busy = false;

    async function tick() {
      if (cancelled || busy) return;
      busy = true;
      try {
        await taskRef.current();
      } finally {
        busy = false;
      }
    }

    void tick();
    const id = window.setInterval(() => void tick(), intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [intervalMs]);
}

import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Iteration,
  formatIterationDateRange,
  groupIterationsByTimeFrame,
} from "@/lib/iteration-types";

interface IterationSelectorProps {
  /** ID da iteration selecionada (null = "Todas as Sprints") */
  value: string | null;
  /** Callback quando a seleção muda */
  onChange: (iterationId: string | null) => void;
  /** Lista de iterations */
  iterations: Iteration[];
  /** Se está carregando */
  isLoading: boolean;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Componente seletor de Iteration (Sprint) para a Folha de Horas.
 *
 * Exibe as sprints agrupadas por:
 * - Sprint Atual (destacada)
 * - Sprints Futuras (ordem cronológica crescente)
 * - Sprints Passadas (ordem cronológica decrescente)
 * - Opção "Todas as Sprints"
 */
export function IterationSelector({
  value,
  onChange,
  iterations,
  isLoading,
  className,
}: IterationSelectorProps) {
  // Debug: verificar iterations recebidas
  console.log("[IterationSelector] iterations recebidas:", iterations.length, {
    hasTimeFrame: iterations.filter(it => it.attributes?.time_frame).length,
    sample: iterations.slice(0, 3).map(it => ({ name: it.name, time_frame: it.attributes?.time_frame }))
  });

  // Agrupar iterations por timeFrame
  const { current, future, past } = groupIterationsByTimeFrame(iterations);
  
  console.log("[IterationSelector] Agrupadas:", { 
    current: current?.name, 
    future: future.length, 
    past: past.length 
  });

  // Encontrar a iteration selecionada para exibir no trigger
  const selectedIteration = iterations.find((it) => it.id === value);

  // Handler para mudança de valor
  const handleValueChange = (newValue: string) => {
    // Valor vazio = "Todas as Sprints"
    onChange(newValue === "__ALL__" ? null : newValue);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 h-9 px-3 py-2 border border-input rounded-md bg-transparent text-sm text-muted-foreground w-[280px]">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Carregando sprints...</span>
      </div>
    );
  }

  if (iterations.length === 0) {
    return (
      <div className="flex items-center h-9 px-3 py-2 border border-input rounded-md bg-transparent text-sm text-muted-foreground w-[280px]">
        <span>Nenhuma sprint configurada</span>
      </div>
    );
  }

  return (
    <Select
      value={value ?? "__ALL__"}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className={className ?? "w-[280px]"}>
        <SelectValue placeholder="Selecione uma Sprint">
          {value === null || value === "__ALL__" ? (
            <span className="flex items-center gap-1.5">
              <span>Todas as Sprints</span>
            </span>
          ) : selectedIteration ? (
            <span className="flex items-center gap-1.5">
              {selectedIteration.attributes.time_frame === "current" && (
                <span className="w-2 h-2 rounded-full bg-[#0078D4]" />
              )}
              <span>{selectedIteration.name}</span>
              <span className="text-muted-foreground text-xs">
                {formatIterationDateRange(
                  selectedIteration.attributes.start_date,
                  selectedIteration.attributes.finish_date
                )}
              </span>
            </span>
          ) : (
            <span>Selecione uma Sprint</span>
          )}
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        {/* Sprint Atual - Destaque */}
        {current && (
          <SelectGroup>
            <SelectItem
              value={current.id}
              className="font-medium text-[#0078D4]"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0078D4]" />
                <span>{current.name}</span>
                <span className="text-muted-foreground text-xs ml-1">
                  {formatIterationDateRange(
                    current.attributes.start_date,
                    current.attributes.finish_date
                  )}
                </span>
                <span className="text-xs text-[#0078D4] ml-1">(Atual)</span>
              </span>
            </SelectItem>
          </SelectGroup>
        )}

        {/* Separador após sprint atual */}
        {current && (future.length > 0 || past.length > 0) && <SelectSeparator />}

        {/* Sprints Futuras */}
        {future.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-xs text-muted-foreground px-2 py-1">
              Futuras
            </SelectLabel>
            {future.map((it) => (
              <SelectItem key={it.id} value={it.id}>
                <span className="flex items-center gap-1.5">
                  <span>{it.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatIterationDateRange(
                      it.attributes.start_date,
                      it.attributes.finish_date
                    )}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        )}

        {/* Separador entre futuras e passadas */}
        {future.length > 0 && past.length > 0 && <SelectSeparator />}

        {/* Sprints Passadas */}
        {past.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-xs text-muted-foreground px-2 py-1">
              Passadas
            </SelectLabel>
            {past.map((it) => (
              <SelectItem key={it.id} value={it.id}>
                <span className="flex items-center gap-1.5">
                  <span>{it.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatIterationDateRange(
                      it.attributes.start_date,
                      it.attributes.finish_date
                    )}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        )}

        {/* Separador antes de "Todas" */}
        <SelectSeparator />

        {/* Opção "Todas as Sprints" */}
        <SelectGroup>
          <SelectItem value="__ALL__">
            <span className="flex items-center gap-1.5">
              <span>Todas as Sprints</span>
            </span>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

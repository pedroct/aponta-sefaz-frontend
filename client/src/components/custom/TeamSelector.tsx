import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Team } from "@/lib/team-types";

interface TeamSelectorProps {
  value: string | null;
  onChange: (teamId: string) => void;
  teams: Team[];
  isLoading: boolean;
  className?: string;
  showAdminLabel?: boolean;
}

export function TeamSelector({
  value,
  onChange,
  teams,
  isLoading,
  className,
}: TeamSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 h-8 px-3 py-2 border border-input rounded-md bg-transparent text-xs text-muted-foreground w-[220px]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Carregando equipes...</span>
      </div>
    );
  }

  if (!teams.length) {
    return (
      <div className="flex items-center h-8 px-3 py-2 border border-input rounded-md bg-transparent text-xs text-muted-foreground w-[220px]">
        <span>Nenhuma equipe</span>
      </div>
    );
  }

  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-[220px] h-8 text-xs"}>
        <SelectValue placeholder="Selecione a equipe" />
      </SelectTrigger>
      <SelectContent>
        {teams.map((team) => (
          <SelectItem key={team.id} value={team.id}>
            <span className="flex flex-col text-xs gap-0.5">
              <span className="text-[13px] font-medium text-foreground">{team.name}</span>
              <span className="text-[11px] text-muted-foreground">{team.project_name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default TeamSelector;

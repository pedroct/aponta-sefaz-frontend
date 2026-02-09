import React from "react";
import { useWorkItemNavigation } from "@/hooks/use-workitem-navigation";
import { cn } from "@/lib/utils";

interface WorkItemLinkProps {
  workItemId: number;
  workItemType: string;
  className?: string;
  children?: React.ReactNode;
}

export function WorkItemLink({
  workItemId,
  workItemType,
  className = "",
  children
}: WorkItemLinkProps) {
  const { openWorkItem, isLoading } = useWorkItemNavigation();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openWorkItem(workItemId);
  };

  return (
    <a
      href="#"
      onClick={handleClick}
      className={cn(
        "cursor-pointer transition-colors no-underline",
        "hover:text-[#0078D4] hover:underline",
        "focus:outline-2 focus:outline-[#007ACC] focus:outline-offset-2",
        isLoading && "cursor-wait opacity-70",
        className
      )}
      title={`Abrir ${workItemType} #${workItemId}`}
      aria-label={`Abrir work item ${workItemId}`}
    >
      {children || `#${workItemId}`}
    </a>
  );
}

import React from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ADOButton } from "./ADOButton";

interface ADOModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  isLoading?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  confirmVariant?: "primary" | "secondary" | "danger";
}

export function ADOModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  isLoading = false,
  onConfirm,
  onCancel,
  confirmText = "Salvar",
  cancelText = "Cancelar",
  confirmDisabled = false,
  confirmVariant = "primary",
}: ADOModalProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-[#EAEAEA] p-0 gap-0 max-w-md">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-[#EAEAEA]">
          <DialogTitle className="text-base font-semibold text-[#201F1E]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#605E5C] mt-1">
            {description || "Preencha os campos abaixo"}
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer ? (
          <DialogFooter className="px-6 py-4 border-t border-[#EAEAEA] bg-[#FAF9F8]">
            {footer}
          </DialogFooter>
        ) : (onConfirm || onCancel) ? (
          <DialogFooter className="px-6 py-4 border-t border-[#EAEAEA] bg-[#FAF9F8] flex-row justify-end gap-2">
            <ADOButton
              variant="secondary"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {cancelText}
            </ADOButton>
            {onConfirm && (
              <ADOButton
                variant={confirmVariant}
                onClick={onConfirm}
                disabled={isLoading || confirmDisabled}
                icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
              >
                {isLoading ? "Processando..." : confirmText}
              </ADOButton>
            )}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

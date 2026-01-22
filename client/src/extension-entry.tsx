import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import ExtensionAddTimeModal from "@/components/extension/ExtensionAddTimeModal";
import "@/index.css";

// Renderizar o modal da extensão
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ExtensionAddTimeModal />
      <Toaster />
    </QueryClientProvider>
  </React.StrictMode>
);

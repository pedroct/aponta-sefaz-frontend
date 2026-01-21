import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AzureDevOpsProvider } from "@/contexts/AzureDevOpsContext";
import FolhaDeHoras from "@/pages/FolhaDeHoras";
import Atividades from "@/pages/Atividades";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={FolhaDeHoras} />
      <Route path="/timesheet" component={FolhaDeHoras} />
      <Route path="/atividades" component={Atividades} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AzureDevOpsProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </AzureDevOpsProvider>
  );
}

export default App;

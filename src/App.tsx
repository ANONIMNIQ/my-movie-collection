import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, ScrollRestoration } from "react-router-dom";
import { SessionContextProvider } from "./contexts/SessionContext";
import React from "react";
import AppRoutes from "./components/AppRoutes";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollRestoration /> {/* Add ScrollRestoration here */}
          <SessionContextProvider>
            <AppRoutes />
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
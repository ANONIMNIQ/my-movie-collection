import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MovieDetail from "./pages/MovieDetail";
import AddMovie from "./pages/AddMovie";
import Login from "./pages/Login";
import ImportMovies from "./pages/ImportMovies";
import EditMovie from "./pages/EditMovie";
import ImportRatings from "./pages/ImportRatings";
import { SessionContextProvider } from "./contexts/SessionContext";
import React from "react";
import { AnimatePresence } from "framer-motion";
import ScrollManager from "./components/ScrollManager";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/add-movie" element={<AddMovie />} />
        <Route path="/edit-movie/:id" element={<EditMovie />} />
        <Route path="/import-movies" element={<ImportMovies />} />
        <Route path="/import-ratings" element={<ImportRatings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollManager />
          <SessionContextProvider>
            <AppRoutes />
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
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
import { AnimatePresence, motion } from "framer-motion"; // Import motion and AnimatePresence

const queryClient = new QueryClient();

const App = () => {
  const location = useLocation(); // Get the current location for AnimatePresence key

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SessionContextProvider>
            <AnimatePresence mode="wait"> {/* Use AnimatePresence to manage exit animations */}
              <Routes location={location}> {/* Pass location to Routes */}
                <Route path="/" element={<motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><Index /></motion.div>} />
                <Route path="/login" element={<motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><Login /></motion.div>} />
                <Route path="/movie/:id" element={<motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><MovieDetail /></motion.div>} />
                <Route path="/add-movie" element={<motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><AddMovie /></motion.div>} />
                <Route path="/edit-movie/:id" element={<motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><EditMovie /></motion.div>} />
                <Route path="/import-movies" element={<motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><ImportMovies /></motion.div>} />
                <Route path="/import-ratings" element={<motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><ImportRatings /></motion.div>} />
                <Route path="*" element={<motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><NotFound /></motion.div>} />
              </Routes>
            </AnimatePresence>
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MovieDetail from "./pages/MovieDetail";
import AddMovie from "./pages/AddMovie";
import Login from "./pages/Login";
import ImportMovies from "./pages/ImportMovies";
import EditMovie from "./pages/EditMovie";
import ImportRatings from "./pages/ImportRatings";
import { SessionContextProvider } from "./contexts/SessionContext";
import React from "react"; // Import React

const queryClient = new QueryClient();

// Temporary Test Component
const HelloWorld = () => {
  console.log("HelloWorld component is rendering.");
  return (
    <div style={{ backgroundColor: 'blue', color: 'white', padding: '50px', fontSize: '36px', textAlign: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Hello World!
    </div>
  );
};

const App = () => {
  console.log("App component is rendering.");
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SessionContextProvider>
            <Routes>
              {/* Temporarily render Hello World on all paths */}
              <Route path="*" element={<HelloWorld />} />
            </Routes>
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
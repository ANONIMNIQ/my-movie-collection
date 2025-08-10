import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, ScrollRestoration } from "react-router-dom";
import { SessionContextProvider } from "./contexts/SessionContext";
import React from "react";

// Import all page components
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import MovieDetail from "@/pages/MovieDetail";
import AddMovie from "@/pages/AddMovie";
import Login from "@/pages/Login";
import ImportMovies from "@/pages/ImportMovies";
import EditMovie from "@/pages/EditMovie";
import ImportRatings from "@/pages/ImportRatings";

const queryClient = new QueryClient();

// Define routes using createBrowserRouter
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <React.Fragment>
        <ScrollRestoration />
        <Index />
      </React.Fragment>
    ),
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/movie/:id",
    element: <MovieDetail />,
  },
  {
    path: "/add-movie",
    element: <AddMovie />,
  },
  {
    path: "/edit-movie/:id",
    element: <EditMovie />,
  },
  {
    path: "/import-movies",
    element: <ImportMovies />,
  },
  {
    path: "/import-ratings",
    element: <ImportRatings />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SessionContextProvider>
          <RouterProvider router={router} />
        </SessionContextProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
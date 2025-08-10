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
        {/* RouterProvider must wrap SessionContextProvider */}
        <RouterProvider router={router}>
          <SessionContextProvider>
            {/* Children of SessionContextProvider will now have access to routing context */}
            <React.Fragment /> {/* This fragment is needed because RouterProvider expects a single child */}
          </SessionContextProvider>
        </RouterProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
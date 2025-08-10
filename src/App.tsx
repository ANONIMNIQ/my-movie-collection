import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, ScrollRestoration, Outlet } from "react-router-dom"; // Added Outlet
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
import AuthRedirector from "@/components/AuthRedirector"; // Import AuthRedirector

const queryClient = new QueryClient();

// Define routes using createBrowserRouter
const router = createBrowserRouter([
  {
    element: (
      <SessionContextProvider>
        <AuthRedirector>
          <ScrollRestoration />
          <Outlet /> {/* Outlet renders the matched child route */}
        </AuthRedirector>
      </SessionContextProvider>
    ),
    children: [
      {
        path: "/",
        element: <Index />,
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
    ],
  },
]);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
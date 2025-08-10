import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useLocation,
  ScrollRestoration,
} from "react-router-dom";
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
import { AnimatePresence, motion } from "framer-motion";

const queryClient = new QueryClient();

// This component acts as the root layout, providing context and handling animations.
const RootLayout = () => {
  const location = useLocation();
  return (
    <SessionContextProvider>
      <AnimatePresence mode="wait">
        {/* The key is crucial for AnimatePresence to detect route changes */}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
          <ScrollRestoration />
        </motion.div>
      </AnimatePresence>
    </SessionContextProvider>
  );
};

// Define the routes using the data router format
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <NotFound />, // Handles all errors, including 404s
    children: [
      { index: true, element: <Index /> },
      { path: "login", element: <Login /> },
      { path: "movie/:id", element: <MovieDetail /> },
      { path: "add-movie", element: <AddMovie /> },
      { path: "edit-movie/:id", element: <EditMovie /> },
      { path: "import-movies", element: <ImportMovies /> },
      { path: "import-ratings", element: <ImportRatings /> },
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
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Create from "./pages/Create";
import NotFound from "./pages/NotFound";
import Instruments from "./pages/Instruments";
import StudioMixer from "./pages/StudioMixer";

type RouteConfig = {
  path: string;
  element: JSX.Element;
};

const queryClient = new QueryClient();

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {[
                { path: "/", element: <Index /> },
                { path: "/dashboard", element: <Dashboard /> },
                { path: "/login", element: <Login /> },
                { path: "/signup", element: <Signup /> },
                { path: "/create", element: <Create /> },
                { path: "/instruments", element: <Instruments /> },
                { path: "/studio-mixer", element: <StudioMixer /> },
                { path: "*", element: <NotFound /> },
              ].map((route: RouteConfig) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

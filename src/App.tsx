import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import StorePage from "./pages/Stores";
import StoreDetails from "./pages/StoreDetails";
import ProductCollection from "./pages/ProductCollection";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav"; 
import { localStorageService } from './lib/localStorageService';
import ProductsPage from "./pages/Products";
import ProfilePage from "./pages/Profile";
import { TranscriberProvider } from "./context/TranscriberProvider";
import LlmTester from "./pages/LlmTester";
import { RouterController } from "./components/Controller";

localStorageService.initializeDatabase();

const queryClient = new QueryClient();

function App() {
  return (
    <TranscriberProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RouterController />
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/store_page" element={<StorePage />} />
              <Route path="/store" element={<StoreDetails />} />
              <Route path="/product" element={<ProductCollection />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/llm_tester" element={<LlmTester />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </TranscriberProvider>
  );
}

export default App;

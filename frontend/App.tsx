import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot, Root } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { BotProvider } from "./contexts/BotContext";
import { ChatProvider } from "./contexts/ChatContext";
import AppContent from "./components/AppContent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <BotProvider>
          <ChatProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AppContent />
            </TooltipProvider>
          </ChatProvider>
        </BotProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

declare global {
  interface Window {
    __BOTAI_ROOT__?: Root;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = window.__BOTAI_ROOT__ ?? createRoot(rootElement);
window.__BOTAI_ROOT__ = root;
root.render(<App />);


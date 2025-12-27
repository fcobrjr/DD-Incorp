import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import AuthPage from "./pages/auth-page";
import MainLayout from "./components/MainLayout";

import CommonAreas from "./pages/CommonAreas";
import Activities from "./pages/Activities";
import Tools from "./pages/Tools";
import Materials from "./pages/Materials";
import Team from "./pages/Team";
import Planning from "./pages/Planning";
import Schedule from "./pages/Schedule";
import DailyWorkOrders from "./pages/DailyWorkOrders";
import Blueprint from "./pages/Blueprint";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={() => <MainLayout><CommonAreas /></MainLayout>} />
      <ProtectedRoute path="/activities" component={() => <MainLayout><Activities /></MainLayout>} />
      <ProtectedRoute path="/tools" component={() => <MainLayout><Tools /></MainLayout>} />
      <ProtectedRoute path="/materials" component={() => <MainLayout><Materials /></MainLayout>} />
      <ProtectedRoute path="/team" component={() => <MainLayout><Team /></MainLayout>} />
      <ProtectedRoute path="/planning" component={() => <MainLayout><Planning /></MainLayout>} />
      <ProtectedRoute path="/schedule" component={() => <MainLayout><Schedule /></MainLayout>} />
      <ProtectedRoute path="/daily-work-orders" component={() => <MainLayout><DailyWorkOrders /></MainLayout>} />
      <ProtectedRoute path="/blueprint" component={() => <MainLayout><Blueprint /></MainLayout>} />
      <Route path="/auth" component={AuthPage} />
      <Route component={() => <div className="flex items-center justify-center h-screen">Pagina nao encontrada</div>} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

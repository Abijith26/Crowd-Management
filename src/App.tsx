import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import { getToken } from "@/services/token";
import DashboardLayout from "@/page-components/dashboard/DashboardLayout";
import DashboardPage from "@/pages/DashboardPage";
import EntriesPlaceholder from "@/pages/EntriesPlaceholder";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            getToken() ? <Navigate to="/dashboard" replace /> : <LoginPage />
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/entries" element={<EntriesPlaceholder />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

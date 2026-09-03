import { AuthProvider } from "@/context/AuthContext";
import { ToastContainer } from "@/components/ui/Toast";
import DashboardGuard from "@/components/layout/DashboardGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardGuard>
        {children}
      </DashboardGuard>
      <ToastContainer />
    </AuthProvider>
  );
}

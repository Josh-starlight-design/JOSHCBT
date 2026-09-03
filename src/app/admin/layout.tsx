import { AuthProvider } from "@/context/AuthContext";
import { ToastContainer } from "@/components/ui/Toast";
import AdminGuard from "@/components/layout/AdminGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminGuard>
        {children}
      </AdminGuard>
      <ToastContainer />
    </AuthProvider>
  );
}

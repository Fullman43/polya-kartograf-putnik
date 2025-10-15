import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import MapView from "@/components/dashboard/MapView";
import { MapProvider } from "@/contexts/MapContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [focusOnEmployeeFn, setFocusOnEmployeeFn] = useState<((employeeId: string) => void) | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Загрузка...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <MapProvider value={{ focusOnEmployee: focusOnEmployeeFn || (() => {}) }}>
      <Layout>
        <MapView onMapReady={(fn) => setFocusOnEmployeeFn(() => fn)} />
      </Layout>
    </MapProvider>
  );
};

export default Dashboard;

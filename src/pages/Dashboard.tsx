import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import MapView from "@/components/dashboard/MapView";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

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
    <Layout>
      <MapView />
    </Layout>
  );
};

export default Dashboard;

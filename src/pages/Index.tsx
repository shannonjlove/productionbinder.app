import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ProductionDashboard } from "@/components/ProductionDashboard";
import { ParallaxHeroBackground } from "@/components/ParallaxHeroBackground";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <ParallaxHeroBackground />
      <ProductionDashboard />
    </>
  );
};

export default Index;

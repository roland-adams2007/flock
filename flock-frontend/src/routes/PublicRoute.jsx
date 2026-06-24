import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/store";

const PublicRoute = () => {
  const { isAuthenticated, isInitializing } = useAuthStore();

  // Show loading while checking auth
  if (isInitializing) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh" 
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "3px solid var(--border)",
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // If authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Render child routes (auth pages)
  return <Outlet />;
};

export default PublicRoute;
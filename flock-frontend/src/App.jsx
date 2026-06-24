import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Auth from "./pages/Auth";
import Homepage from "./pages/Homepage";
import Profile from "./pages/Profile";
import Layout from "./components/layouts/Layout";
import { useEffect } from "react";
import { useAuthStore } from "./store/store";
import Follows from "./pages/Follows";
import PostDetails from "./pages/PostDetails";
import Notifications from "./pages/Notifications";
import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";

function App() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <Router>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/auth" element={<Auth />} />
        </Route>

        <Route element={<Layout />}>
          <Route path="/:username" element={<Profile />} />
          <Route path="/:username/post/:id" element={<PostDetails />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Homepage />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/:username/follows" element={<Follows />} />
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <h1 style={{ fontSize: "4rem", margin: 0 }}>404</h1>
              <p style={{ color: "var(--text3)" }}>Page not found</p>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

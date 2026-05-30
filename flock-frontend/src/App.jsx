import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Auth from "./pages/Auth";
import Homepage from "./pages/Homepage";
import Profile from "./pages/Profile";
import Layout from "./components/layouts/Layout";
import { useEffect } from "react";
import { useAuthStore } from "./store/store";
function App() {
  const { initializeAuth } = useAuthStore();
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Homepage />} />
          <Route path="/:username" element={<Profile />} />
        </Route>

        <Route path="/auth" element={<Auth />} />
      </Routes>
    </Router>
  );
}

export default App;

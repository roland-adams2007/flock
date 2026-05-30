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
function App() {
  const { initializeAuth } = useAuthStore();
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Homepage />} />
          <Route path="/:username/follows" element={<Follows />} />
          <Route path="/:username/post/:id" element={<PostDetails />} />
          <Route path="/:username" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

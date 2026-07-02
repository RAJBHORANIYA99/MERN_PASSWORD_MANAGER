import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Manager from "./components/Manager";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import TwoFactorLogin from "./pages/TwoFactorLogin";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

function App() {
  const [darkMode, setDarkMode] = useState(true);

  // Toggle dark/light theme class on document element
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Private Route check
  const PrivateRoute = ({ children }) => {
    const user = localStorage.getItem("user");
    return user ? children : <Navigate to="/login" />;
  };

  // Inactivity auto-logout (15 minutes)
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) return;

    let inactivityTimer;
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes in ms

    const logoutUser = async () => {
      try {
        await axios.post("http://localhost:5000/api/v1/auth/logout", {}, { withCredentials: true });
      } catch (err) {
        console.error("Auto logout backend call failed:", err);
      }
      localStorage.removeItem("user");
      window.location.href = "/login?reason=inactivity";
    };

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(logoutUser, INACTIVITY_LIMIT);
    };

    // User activity events to monitor
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer(); // Initialize timer

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={darkMode ? "dark" : "light"}
      />
      <Router>
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="flex-grow">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/verify-2fa" element={<TwoFactorLogin />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Manager />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </Router>
    </div>
  );
}

export default App;

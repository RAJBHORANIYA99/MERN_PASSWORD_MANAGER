import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { ShieldCheck, Loader2 } from "lucide-react";

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Handle Google Token response from Google popup
  const handleGoogleCallback = async (response) => {
    const token = response.credential;
    if (!token) return;

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/v1/auth/google-login",
        { token },
        { withCredentials: true }
      );

      if (res.data.requires2FA) {
        toast.info("Two-factor authentication required.", { theme: "dark" });
        navigate("/verify-2fa", { state: { tempToken: res.data.tempToken } });
        return;
      }

      toast.success("Login successful with Google!");
      localStorage.setItem("user", JSON.stringify(res.data));
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Google Authentication failed. Try again.");
    } finally {
      setLoading(false);
    }
  };



  // Initialize GIS standard button rendering
  useEffect(() => {
    let interval;
    if (clientId) {
      interval = setInterval(() => {
        /* global google */
        if (typeof google !== "undefined") {
          clearInterval(interval);
          google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCallback,
          });
          google.accounts.id.renderButton(
            document.getElementById("googleSignInDiv"),
            { theme: "filled_blue", size: "large", width: 320, shape: "pill" }
          );
        }
      }, 300);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [clientId]);

  return (
    <div className="flex items-center justify-center min-h-[85vh] bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300 relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-float-delayed" />

      <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl relative z-10 animate-scale-up">
        
        {/* Logo and Header */}
        <div className="flex flex-col items-center space-y-3 mb-6 text-center">
          <div className="p-3 bg-indigo-650 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            PassX Vault Unlock
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Sign in with Google to unlock your secure credentials vault.
          </p>
        </div>

        {/* Authentication Options */}
        <div className="flex flex-col items-center gap-4 py-4">
          
          {loading && (
            <div className="flex items-center gap-2 text-sm text-indigo-650 dark:text-indigo-400 font-semibold animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying login details...
            </div>
          )}

          {/* Official Google Sign-In Container */}
          {clientId ? (
            <div className="flex justify-center w-full min-h-[44px]">
              <div id="googleSignInDiv"></div>
            </div>
          ) : (
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/40 rounded-2xl text-xs text-amber-600 dark:text-amber-400">
              <p className="font-semibold mb-1">Google OAuth Client ID Not Found</p>
              To enable real Google Sign-In, please define <code className="font-mono bg-amber-100/55 px-1 py-0.5 rounded">VITE_GOOGLE_CLIENT_ID</code> inside your environment variables.
            </div>
          )}


          
        </div>

        {/* security footer note */}
        <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-6 tracking-wide uppercase">
          🛡️ Fully Encrypted Vault Connection
        </p>

      </div>
    </div>
  );
}

export default Login;

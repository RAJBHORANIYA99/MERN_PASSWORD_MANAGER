import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Laptop, Smartphone, Trash2, LogOut, Loader2, Globe } from "lucide-react";

function ActiveSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState("");
  const [revokingAll, setRevokingAll] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/v1/auth/sessions", { withCredentials: true });
      setSessions(res.data.sessions || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load active sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSpecific = async (sessionId) => {
    if (!window.confirm("Are you sure you want to revoke this session? The device will be logged out immediately.")) return;
    setRevokingId(sessionId);
    try {
      const res = await axios.delete(`http://localhost:5000/api/v1/auth/sessions/revoke/${sessionId}`, { withCredentials: true });
      toast.success(res.data.message || "Session revoked!");
      setSessions(prev => prev.filter(s => s._id !== sessionId));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to revoke session");
    } finally {
      setRevokingId("");
    }
  };

  const handleRevokeOthers = async () => {
    if (!window.confirm("Are you sure you want to sign out of all other devices?")) return;
    setRevokingAll(true);
    try {
      const res = await axios.post("http://localhost:5000/api/v1/auth/sessions/revoke-others", {}, { withCredentials: true });
      toast.success(res.data.message || "Logged out of other devices!");
      setSessions(prev => prev.filter(s => s.isCurrent));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to revoke other sessions");
    } finally {
      setRevokingAll(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-6">
      
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/60">
        <div>
          <h3 className="font-bold text-slate-850 dark:text-slate-105 text-base sm:text-lg">Active Sessions</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage the browser sessions currently logged into your PassX vault.
          </p>
        </div>

        {sessions.length > 1 && (
          <button
            onClick={handleRevokeOthers}
            disabled={revokingAll}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-900 border border-indigo-500/20 text-indigo-650 dark:text-indigo-400 rounded-xl font-bold transition disabled:opacity-55 shrink-0"
          >
            {revokingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>Sign Out Other Devices</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          <span className="text-xs text-slate-400">Loading active sessions...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const isMobile = s.device.includes("Mobile") || s.device.includes("iPhone") || s.device.includes("Android");
            
            return (
              <div 
                key={s._id}
                className={`flex items-center justify-between p-4 border rounded-2xl transition duration-200 ${
                  s.isCurrent 
                    ? "bg-indigo-50/25 border-indigo-500/20 dark:bg-indigo-950/5 dark:border-indigo-500/20" 
                    : "bg-slate-50/40 border-slate-100 dark:bg-slate-950/10 dark:border-slate-800/40 hover:border-slate-200 dark:hover:border-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Device Icon */}
                  <div className={`p-2.5 rounded-xl border ${
                    s.isCurrent 
                      ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-500/30 text-indigo-550 dark:text-indigo-400" 
                      : "bg-slate-100 dark:bg-slate-900 border-slate-200/50 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                    {isMobile ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                  </div>

                  {/* Device Info */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                        {s.device}
                      </span>
                      {s.isCurrent && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-50 text-indigo-650 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-500/30 rounded-full uppercase">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] sm:text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-400/80" />
                        {s.ip}
                      </span>
                      <span>•</span>
                      <span>
                        Active: {s.isCurrent ? "Now" : new Date(s.lastActive).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Revoke Option */}
                {!s.isCurrent && (
                  <button
                    onClick={() => handleRevokeSpecific(s._id)}
                    disabled={revokingId === s._id}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition disabled:opacity-50"
                    title="Revoke session"
                  >
                    {revokingId === s._id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default ActiveSessions;

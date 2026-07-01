import React, { useState, useEffect } from "react";
import axios from "axios";
import { Shield, ShieldAlert, ShieldCheck, Loader2, KeyRound } from "lucide-react";
import { toast } from "react-toastify";

function TwoFactorSettings({ initialEnabled, onStatusChange }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [step, setStep] = useState("idle"); // idle, generating, setup, disabling
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  const handleStartSetup = async () => {
    setLoading(true);
    setStep("generating");
    try {
      const response = await axios.post(
        "http://localhost:5000/api/v1/auth/generate-2fa",
        {},
        { withCredentials: true }
      );
      if (response.data.success) {
        setQrCode(response.data.qrCode);
        setSecret(response.data.secret);
        setStep("setup");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to generate 2FA secret");
      setStep("idle");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      toast.warning("Please enter a valid 6-digit verification code");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/v1/auth/enable-2fa",
        { secret, code },
        { withCredentials: true }
      );
      if (response.data.success) {
        setEnabled(true);
        setStep("idle");
        setCode("");
        setSecret("");
        setQrCode("");
        if (onStatusChange) onStatusChange(true);
        toast.success("Two-factor authentication enabled successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed. Check the code.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    if (!password) {
      toast.warning("Password is required");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/v1/auth/disable-2fa",
        { password },
        { withCredentials: true }
      );
      if (response.data.success) {
        setEnabled(false);
        setStep("idle");
        setPassword("");
        if (onStatusChange) onStatusChange(false);
        toast.success("Two-factor authentication disabled.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Incorrect password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${enabled ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500" : "bg-amber-50 dark:bg-amber-950/30 text-amber-500"}`}>
          {enabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">
            Two-Factor Authentication (2FA)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Secure your credentials with an extra layer of protection.
          </p>
        </div>
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      {step === "idle" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">Status:</span>
            <span className={`text-xs sm:text-sm font-bold uppercase ${enabled ? "text-emerald-500" : "text-amber-500"}`}>
              {enabled ? "Enabled" : "Disabled"}
            </span>
          </div>

          {enabled ? (
            <button
              onClick={() => setStep("disabling")}
              className="w-full py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl text-xs sm:text-sm font-medium transition"
            >
              Disable 2FA
            </button>
          ) : (
            <button
              onClick={handleStartSetup}
              className="w-full py-2 bg-indigo-605 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-medium transition duration-205 shadow-sm"
            >
              Set up 2FA
            </button>
          )}
        </div>
      )}

      {step === "generating" && (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-xs text-slate-500 dark:text-slate-400">Generating secure credentials...</span>
        </div>
      )}

      {step === "setup" && (
        <form onSubmit={handleVerifySetup} className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Scan this QR code in your authenticator app (e.g. Google Authenticator, Authy):
            </p>
            {qrCode && (
              <div className="inline-block p-2 bg-white rounded-xl border border-slate-200">
                <img src={qrCode} alt="2FA QR Code" className="w-40 h-40" />
              </div>
            )}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Manual Secret Key</p>
              <code className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 select-all tracking-wider break-all">
                {secret}
              </code>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Enter 6-digit Authenticator Code
            </label>
            <input
              type="text"
              maxLength="6"
              placeholder="e.g. 123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full text-center tracking-widest font-mono text-base font-bold py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("idle")}
              className="flex-1 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs sm:text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-medium transition disabled:opacity-55"
            >
              Verify & Enable
            </button>
          </div>
        </form>
      )}

      {step === "disabling" && (
        <form onSubmit={handleDisable2FA} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Confirm your Account Password to disable 2FA
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("idle")}
              className="flex-1 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs sm:text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs sm:text-sm font-medium transition disabled:opacity-55"
            >
              Confirm Disable
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default TwoFactorSettings;

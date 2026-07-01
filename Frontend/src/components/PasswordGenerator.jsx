import React, { useState, useEffect } from "react";
import { Copy, RefreshCw, Check } from "lucide-react";
import { toast } from "react-toastify";

function PasswordGenerator({ onUsePassword }) {
  const [length, setLength] = useState(16);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    let charset = "";
    if (includeUpper) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (includeLower) charset += "abcdefghijklmnopqrstuvwxyz";
    if (includeNumbers) charset += "0123456789";
    if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (!charset) {
      toast.warning("Please select at least one character type!", { theme: "dark" });
      setPassword("");
      return;
    }

    let generated = "";
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      generated += charset[array[i] % charset.length];
    }

    setPassword(generated);
    setCopied(false);
  };

  useEffect(() => {
    generatePassword();
  }, [length, includeUpper, includeLower, includeNumbers, includeSymbols]);

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success("Password copied to clipboard!", { autoClose: 2000, theme: "dark" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
      <h3 className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-200">
        Password Generator
      </h3>

      {/* Generated Password Output Box */}
      <div className="flex items-center justify-between gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <span className="font-mono text-sm sm:text-base text-slate-800 dark:text-slate-100 break-all select-all">
          {password || "Select options..."}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            type="button"
            onClick={generatePassword}
            className="p-2 text-slate-500 hover:text-indigo-505 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Regenerate"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!password}
            className="p-2 text-slate-500 hover:text-indigo-505 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Copy"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Length Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          <span>Length:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{length} characters</span>
        </div>
        <input
          type="range"
          min="8"
          max="32"
          value={length}
          onChange={(e) => setLength(parseInt(e.target.value))}
          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>

      {/* Checkbox Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeUpper}
            onChange={(e) => setIncludeUpper(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600 text-indigo-650 focus:ring-indigo-500 cursor-pointer w-4 h-4"
          />
          <span>Uppercase (A-Z)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeLower}
            onChange={(e) => setIncludeLower(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600 text-indigo-650 focus:ring-indigo-500 cursor-pointer w-4 h-4"
          />
          <span>Lowercase (a-z)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeNumbers}
            onChange={(e) => setIncludeNumbers(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600 text-indigo-650 focus:ring-indigo-500 cursor-pointer w-4 h-4"
          />
          <span>Numbers (0-9)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeSymbols}
            onChange={(e) => setIncludeSymbols(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600 text-indigo-650 focus:ring-indigo-500 cursor-pointer w-4 h-4"
          />
          <span>Symbols (!@#$)</span>
        </label>
      </div>

      {/* Use Password Button */}
      {onUsePassword && (
        <button
          type="button"
          onClick={() => onUsePassword(password)}
          disabled={!password}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-xs sm:text-sm transition duration-200"
        >
          Use Password
        </button>
      )}
    </div>
  );
}

export default PasswordGenerator;

import React from "react";
import { Check, X } from "lucide-react";

function PasswordStrengthMeter({ password }) {
  const getStrength = (pass) => {
    let score = 0;
    if (!pass) return { score, label: "Empty", color: "bg-slate-300", text: "text-slate-500" };

    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 0:
      case 1:
        return { score, label: "Very Weak", color: "bg-red-500", text: "text-red-500" };
      case 2:
        return { score, label: "Weak", color: "bg-orange-500", text: "text-orange-500" };
      case 3:
        return { score, label: "Medium", color: "bg-yellow-500", text: "text-yellow-500" };
      case 4:
        return { score, label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" };
      case 5:
        return { score, label: "Very Strong", color: "bg-green-600", text: "text-green-600 font-bold" };
      default:
        return { score, label: "Empty", color: "bg-slate-300", text: "text-slate-500" };
    }
  };

  const strength = getStrength(password);
  
  const criteria = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { label: "Contains number", met: /[0-9]/.test(password) },
    { label: "Contains special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="mt-2 space-y-2 text-xs sm:text-sm">
      <div className="flex justify-between items-center">
        <span className="text-slate-500 dark:text-slate-400">Password Strength:</span>
        <span className={`${strength.text}`}>{strength.label}</span>
      </div>
      
      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${strength.color} transition-all duration-500`}
          style={{ width: `${password ? (strength.score / 5) * 100 : 0}%` }}
        />
      </div>

      {/* Criteria Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {criteria.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-[11px] sm:text-xs">
            {item.met ? (
              <Check className="w-3.5 h-3.5 text-green-500 stroke-[3]" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
            )}
            <span className={item.met ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PasswordStrengthMeter;

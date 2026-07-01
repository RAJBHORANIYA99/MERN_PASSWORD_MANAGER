import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ShieldCheck, Lock, UploadCloud, DownloadCloud, Eye, EyeOff, Loader2, FileText } from "lucide-react";
import { encryptBackup, decryptBackup } from "../utils/backupCrypto";

function BackupPanel({ passwords, onImportSuccess }) {
  // Export states
  const [exportPassword, setExportPassword] = useState("");
  const [showExportPass, setShowExportPass] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Import states
  const [importPassword, setImportPassword] = useState("");
  const [showImportPass, setShowImportPass] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleExport = async (e) => {
    e.preventDefault();
    if (!exportPassword) {
      toast.warning("Please enter a Master Backup Password");
      return;
    }
    if (passwords.length === 0) {
      toast.warning("Your vault is currently empty. Nothing to back up!");
      return;
    }

    setExporting(true);
    try {
      // Serialize vault data (just keep relevant fields, omitting DB specifics like _id or user ID)
      const sanitizedPasswords = passwords.map(p => {
        const item = {
          website: p.website,
          type: p.type || "login"
        };
        if (p.type === "login" || !p.type) {
          item.username = p.username;
          item.password = p.password;
        } else if (p.type === "card") {
          item.cardholderName = p.cardholderName;
          item.cardNumber = p.cardNumber;
          item.expiryDate = p.expiryDate;
          item.cvv = p.cvv;
        } else if (p.type === "note") {
          item.noteContent = p.noteContent;
        }
        return item;
      });

      const plaintextJson = JSON.stringify(sanitizedPasswords);
      const encryptedPayload = await encryptBackup(exportPassword, plaintextJson);

      // Trigger file download
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(encryptedPayload));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `passx_vault_backup_${new Date().toISOString().split("T")[0]}.enc.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success("Encrypted vault backup downloaded successfully!");
      setExportPassword("");
    } catch (error) {
      toast.error("Failed to generate encrypted backup");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.warning("Please choose a backup file first");
      return;
    }
    if (!importPassword) {
      toast.warning("Please enter the Master Backup Password");
      return;
    }

    setImporting(true);
    try {
      // Read file content
      const fileText = await selectedFile.text();
      let backupPayload;
      try {
        backupPayload = JSON.parse(fileText);
      } catch (err) {
        throw new Error("Invalid file format. Please upload a valid JSON backup file.");
      }

      if (!backupPayload.salt || !backupPayload.iv || !backupPayload.ciphertext) {
        throw new Error("Corrupted or incompatible backup format.");
      }

      // Decrypt client-side
      let decryptedText;
      try {
        decryptedText = await decryptBackup(importPassword, backupPayload);
      } catch (err) {
        throw new Error("Incorrect backup password or corrupted backup file.");
      }

      const importedItems = JSON.parse(decryptedText);
      if (!Array.isArray(importedItems)) {
        throw new Error("Invalid backup database payload.");
      }

      if (importedItems.length === 0) {
        toast.info("No credentials found in backup to import.");
        setImporting(false);
        return;
      }

      setImportTotal(importedItems.length);
      setImportProgress(0);

      // Loop and save to database
      let successCount = 0;
      for (const item of importedItems) {
        try {
          const payload = {
            website: item.website,
            type: item.type || "login"
          };
          if (item.type === "login" || !item.type) {
            payload.username = item.username;
            payload.password = item.password;
          } else if (item.type === "card") {
            payload.cardholderName = item.cardholderName;
            payload.cardNumber = item.cardNumber;
            payload.expiryDate = item.expiryDate;
            payload.cvv = item.cvv;
          } else if (item.type === "note") {
            payload.noteContent = item.noteContent;
          }

          await axios.post("http://localhost:5000/api/v1/pass", payload, { withCredentials: true });
          successCount++;
          setImportProgress(successCount);
        } catch (postErr) {
          console.error("Failed to restore item:", item.website, postErr);
        }
      }

      toast.success(`Vault restored successfully! Imported ${successCount} of ${importedItems.length} items.`);
      
      // Cleanup inputs
      setSelectedFile(null);
      setImportPassword("");
      const fileInput = document.getElementById("backup-file-input");
      if (fileInput) fileInput.value = "";

      // Reload credentials grid
      onImportSuccess();
    } catch (error) {
      toast.error(error.message || "Failed to restore backup");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* EXPORT BACKUP WIDGET */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-500/20 text-indigo-650 dark:text-indigo-400 rounded-xl">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm sm:text-base">Export Encrypted Backup</h3>
              <p className="text-xs text-slate-400">Securely download your entire password vault.</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Your backup file is encrypted client-side using **AES-256-GCM** derived from your master password. 
            The server never sees this password, making your downloaded backup completely unreadable to anyone else.
          </p>

          <form onSubmit={handleExport} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Create Master Backup Password
              </label>
              <div className="relative">
                <input
                  type={showExportPass ? "text" : "password"}
                  placeholder="Enter secure backup password..."
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowExportPass(!showExportPass)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-indigo-500 transition"
                >
                  {showExportPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </form>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting || passwords.length === 0 || !exportPassword}
          className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold transition disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
          <span>Generate & Download Backup</span>
        </button>
      </div>

      {/* IMPORT RESTORE WIDGET */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded-xl">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm sm:text-base">Restore Vault</h3>
              <p className="text-xs text-slate-400">Import credentials from an encrypted backup.</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Select your encrypted `.enc.json` backup file and enter the Master Backup Password used to protect it.
          </p>

          <div className="space-y-3">
            {/* File Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Select Backup File (.json)
              </label>
              <input
                id="backup-file-input"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-indigo-50 dark:file:bg-indigo-950/40 file:text-indigo-650 dark:file:text-indigo-400 hover:file:bg-indigo-100"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Backup Password
              </label>
              <div className="relative">
                <input
                  type={showImportPass ? "text" : "password"}
                  placeholder="Enter backup password..."
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  disabled={importing}
                />
                <button
                  type="button"
                  onClick={() => setShowImportPass(!showImportPass)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-indigo-500 transition"
                >
                  {showImportPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {importing && importTotal > 0 ? (
          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-350">
              <span>Restoring Vault...</span>
              <span>{importProgress} / {importTotal}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-150" 
                style={{ width: `${(importProgress / importTotal) * 100}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleImport}
            disabled={importing || !selectedFile || !importPassword}
            className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold transition disabled:opacity-50"
          >
            {importing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            <span>Decrypt & Restore Backup</span>
          </button>
        )}
      </div>

    </div>
  );
}

export default BackupPanel;

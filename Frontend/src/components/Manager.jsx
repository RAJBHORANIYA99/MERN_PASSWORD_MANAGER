import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  FolderLock, Star, ShieldAlert, Settings, 
  Search, Plus, Eye, EyeOff, Copy, Edit, Trash2, ShieldCheck, 
  Filter, KeyRound, ExternalLink, RefreshCw, Sparkles, Check,
  AlertTriangle, CreditCard, FileText, History
} from "lucide-react";
import PasswordStrengthMeter from "./PasswordStrengthMeter";
import PasswordGenerator from "./PasswordGenerator";
import TwoFactorSettings from "./TwoFactorSettings";
import ActiveSessions from "./ActiveSessions";
import BackupPanel from "./BackupPanel";
import { checkPasswordBreach } from "../utils/pwnedCheck";

function Manager() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("vault"); // vault, favorites, audit, settings
  
  // Have I Been Pwned breach checker states
  const [pwnedCount, setPwnedCount] = useState(0);
  const [checkingPwned, setCheckingPwned] = useState(false);
  const [pwnedTimeoutId, setPwnedTimeoutId] = useState(null);
  
  const [breachedMap, setBreachedMap] = useState({});
  const [scanningBreaches, setScanningBreaches] = useState(false);
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Form Modal/Visibility state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({ 
    website: "", 
    type: "login", 
    category: "Others", 
    username: "", 
    password: "", 
    cardholderName: "", 
    cardNumber: "", 
    expiryDate: "", 
    cvv: "", 
    noteContent: "" 
  });
  
  // Password visibility for saved items (tracked by ID)
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [showHistory, setShowHistory] = useState({});

  // Reset pwned states on form reset or open
  useEffect(() => {
    if (!isFormOpen) {
      setPwnedCount(0);
      setCheckingPwned(false);
      if (pwnedTimeoutId) clearTimeout(pwnedTimeoutId);
    }
  }, [isFormOpen]);

  // Securely check HIBP when password input changes with a 500ms debounce
  const handlePasswordChange = (val) => {
    setForm({ ...form, password: val });
    
    if (pwnedTimeoutId) clearTimeout(pwnedTimeoutId);
    
    const tid = setTimeout(async () => {
      if (!val) {
        setPwnedCount(0);
        return;
      }
      setCheckingPwned(true);
      const count = await checkPasswordBreach(val);
      setPwnedCount(count);
      setCheckingPwned(false);
    }, 500);
    
    setPwnedTimeoutId(tid);
  };

  // Run a background scan of all unique vault passwords when Security Audit tab opens
  useEffect(() => {
    if (activeTab === "audit" && passwords.length > 0) {
      scanPasswordsForBreaches();
    }
  }, [activeTab, passwords]);

  const scanPasswordsForBreaches = async () => {
    if (scanningBreaches) return;
    setScanningBreaches(true);
    
    const uniquePasswords = Array.from(new Set(
      passwords
        .filter(p => (p.type === "login" || !p.type) && p.password)
        .map(p => p.password)
    ));

    const newBreachedMap = { ...breachedMap };
    
    try {
      await Promise.all(uniquePasswords.map(async (pw) => {
        if (newBreachedMap[pw] !== undefined) return; // already scanned
        const count = await checkPasswordBreach(pw);
        newBreachedMap[pw] = count;
      }));
      setBreachedMap(newBreachedMap);
    } catch (err) {
      console.error("HIBP Audit Scan failed:", err);
    } finally {
      setScanningBreaches(false);
    }
  };
  const [copiedId, setCopiedId] = useState({ id: "", field: "" });

  useEffect(() => {
    fetchPasswords();
  }, []);

  const fetchPasswords = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/v1/pass", {
        withCredentials: true,
      });
      setPasswords(response.data.passes || []);
    } catch (error) {
      const errMsg = error.response?.data?.message || "";
      toast.error(errMsg || "Failed to fetch credentials");
      
      const status = error.response?.status;
      if (
        status === 401 || 
        errMsg.includes("expired") || 
        errMsg.includes("revoked") || 
        errMsg.includes("Login first")
      ) {
        localStorage.removeItem("user");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      website: "",
      type: "login",
      category: "Others",
      username: "",
      password: "",
      cardholderName: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      noteContent: ""
    });
    setEditingId(null);
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    
    // Check validation based on type
    if (!form.website) {
      toast.warning("Title/Website is required");
      return;
    }
    if (form.type === "login" && (!form.username || !form.password)) {
      toast.warning("Username and password are required for logins");
      return;
    }
    if (form.type === "card" && (!form.cardNumber || !form.expiryDate || !form.cvv)) {
      toast.warning("Card number, expiry, and CVV are required for cards");
      return;
    }
    if (form.type === "note" && !form.noteContent) {
      toast.warning("Note content is required");
      return;
    }

    try {
      const payload = {
        website: form.website,
        type: form.type,
        category: form.category,
      };

      if (form.type === "login") {
        payload.username = form.username;
        payload.password = form.password;
      } else if (form.type === "card") {
        payload.cardholderName = form.cardholderName;
        payload.cardNumber = form.cardNumber;
        payload.expiryDate = form.expiryDate;
        payload.cvv = form.cvv;
      } else if (form.type === "note") {
        payload.noteContent = form.noteContent;
      }

      if (editingId) {
        const response = await axios.put(
          `http://localhost:5000/api/v1/pass/${editingId}`,
          payload,
          { withCredentials: true }
        );
        toast.success(response.data.message || "Updated successfully!");
      } else {
        const response = await axios.post(
          "http://localhost:5000/api/v1/pass",
          payload,
          { withCredentials: true }
        );
        toast.success(response.data.message || "Saved successfully!");
      }
      resetForm();
      setIsFormOpen(false);
      fetchPasswords();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save credential");
    }
  };

  const handleEdit = (pass) => {
    setForm({
      website: pass.website,
      type: pass.type || "login",
      category: pass.category || "Others",
      username: pass.username || "",
      password: pass.password || "",
      cardholderName: pass.cardholderName || "",
      cardNumber: pass.cardNumber || "",
      expiryDate: pass.expiryDate || "",
      cvv: pass.cvv || "",
      noteContent: pass.noteContent || ""
    });
    setEditingId(pass._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await axios.delete(`http://localhost:5000/api/v1/pass/${id}`, {
        withCredentials: true,
      });
      toast.success(res.data.message || "Deleted successfully!");
      fetchPasswords();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete item");
    }
  };

  const handleToggleFavorite = async (pass) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/v1/pass/${pass._id}`,
        { isFavorite: !pass.isFavorite },
        { withCredentials: true }
      );
      if (response.data.success) {
        setPasswords(passwords.map(p => p._id === pass._id ? { ...p, isFavorite: !p.isFavorite } : p));
        toast.success(pass.isFavorite ? "Removed from Favorites" : "Added to Favorites", { autoClose: 1500 });
      }
    } catch (error) {
      toast.error("Failed to toggle favorite status");
    }
  };

  const handleCopyText = (text, id, field) => {
    navigator.clipboard.writeText(text);
    setCopiedId({ id, field });
    toast.success(`${field} copied!`, { autoClose: 1500 });
    
    if (field === "Password" || field === "Card Number" || field === "CVV") {
      axios.put(`http://localhost:5000/api/v1/pass/${id}`, { markUsed: true }, { withCredentials: true })
        .then(() => {
          setPasswords(passwords.map(p => p._id === id ? { ...p, lastUsed: new Date() } : p));
        })
        .catch(err => console.log(err));
    }

    setTimeout(() => setCopiedId({ id: "", field: "" }), 1500);
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleHistoryVisibility = (id) => {
    setShowHistory(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatMaskedCard = (num) => {
    if (!num) return "";
    const cleanNum = num.replace(/\s?/g, "");
    if (cleanNum.length <= 4) return cleanNum;
    return `•••• •••• •••• ${cleanNum.slice(-4)}`;
  };



  // Auditing checks
  const getAuditData = () => {
    const weak = [];
    const reused = {};
    const reusedList = [];

    passwords.forEach(p => {
      const isWeak = p.password.length < 8 || 
                     !/[A-Z]/.test(p.password) || 
                     !/[a-z]/.test(p.password) || 
                     !/[0-9]/.test(p.password);
      if (isWeak) weak.push(p);

      if (p.password) {
        if (!reused[p.password]) reused[p.password] = [];
        reused[p.password].push(p);
      }
    });

    Object.keys(reused).forEach(key => {
      if (reused[key].length > 1) {
        reusedList.push(...reused[key]);
      }
    });

    return { weak, reused: reusedList };
  };

  const audit = getAuditData();

  // Calculate vault overall security score based on 2FA, weak, reused, and breached passwords
  const getSecurityScore = () => {
    const totalLogins = passwords.filter(p => p.type === "login" || !p.type).length;
    if (totalLogins === 0) return { score: 100, level: "Secure", colorClass: "text-emerald-500", progressColor: "stroke-emerald-500", ringColor: "border-emerald-500/20", weakCount: 0, reusedCount: 0, pwnedCount: 0, has2FA: user?.twoFactorEnabled };

    const weakCount = audit.weak.length;
    const reusedCount = audit.reused.length;
    const pwnedCount = passwords.filter(p => (p.type === "login" || !p.type) && p.password && breachedMap[p.password] > 0).length;
    const has2FA = user?.twoFactorEnabled;

    let score = 100;
    if (!has2FA) score -= 15;
    score -= (weakCount / totalLogins) * 30;
    score -= (reusedCount / totalLogins) * 25;
    score -= (pwnedCount / totalLogins) * 30;

    const roundedScore = Math.max(0, Math.min(100, Math.round(score)));
    
    let level = "Excellent Vault Health";
    let colorClass = "text-emerald-500";
    let progressColor = "stroke-emerald-500";
    let ringColor = "border-emerald-500/20";
    
    if (roundedScore < 50) {
      level = "Critical Security Risk";
      colorClass = "text-rose-500";
      progressColor = "stroke-rose-500";
      ringColor = "border-rose-500/20";
    } else if (roundedScore < 80) {
      level = "Moderate Protection";
      colorClass = "text-amber-500";
      progressColor = "stroke-amber-500";
      ringColor = "border-amber-500/20";
    }

    return { 
      score: roundedScore, 
      level, 
      colorClass, 
      progressColor, 
      ringColor,
      weakCount,
      reusedCount,
      pwnedCount,
      has2FA
    };
  };

  const securityReport = getSecurityScore();

  // Filter passwords list based on tab, category, search
  const getFilteredPasswords = () => {
    let items = passwords;

    if (activeTab === "favorites") {
      items = items.filter(p => p.isFavorite);
    } else if (activeTab === "audit") {
      const breachedIds = passwords
        .filter(p => (p.type === "login" || !p.type) && p.password && breachedMap[p.password] > 0)
        .map(b => b._id);
      const auditIds = new Set([
        ...audit.weak.map(w => w._id),
        ...audit.reused.map(r => r._id),
        ...breachedIds
      ]);
      items = items.filter(p => auditIds.has(p._id));
    }

    if (selectedCategory !== "All") {
      if (selectedCategory === "Logins") {
        items = items.filter(p => p.type === "login" || !p.type);
      } else if (selectedCategory === "Cards") {
        items = items.filter(p => p.type === "card");
      } else if (selectedCategory === "Notes") {
        items = items.filter(p => p.type === "note");
      }
    }

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(p => 
        (p.website && p.website.toLowerCase().includes(q)) || 
        (p.username && p.username.toLowerCase().includes(q)) ||
        (p.cardholderName && p.cardholderName.toLowerCase().includes(q))
      );
    }

    return items;
  };

  const filteredPasswords = getFilteredPasswords();

  // Category tags colors helper
  const getCategoryColor = (type) => {
    switch (type) {
      case "card": return "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-800/40";
      case "note": return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-800/40";
      default: return "bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-350 border border-slate-200/40 dark:border-slate-700/40";
    }
  };

  const getFaviconUrl = (site) => {
    let url = site;
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }
    try {
      const hostname = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`;
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Grid Layout: Sidebar on Desktop, Top Bar on Mobile */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* SIDEBAR NAVIGATION PANEL */}
        <aside className="w-full lg:w-64 shrink-0 space-y-4">
          {/* Quick Action Button */}
          <button
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition duration-200"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            Add Credential
          </button>

          {/* Navigation Menu */}
          <div className="glass-panel rounded-2xl overflow-hidden p-3 space-y-1">
            <button
              onClick={() => { setActiveTab("vault"); setSelectedCategory("All"); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === "vault" ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200"}`}
            >
              <FolderLock className="w-4 h-4" />
              <span>All Passwords</span>
              {passwords.length > 0 && (
                <span className="ml-auto text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full font-bold">{passwords.length}</span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab("favorites"); setSelectedCategory("All"); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === "favorites" ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200"}`}
            >
              <Star className="w-4 h-4" />
              <span>Favorites</span>
              {passwords.filter(p => p.isFavorite).length > 0 && (
                <span className="ml-auto text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 rounded-full font-bold">{passwords.filter(p => p.isFavorite).length}</span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab("audit"); setSelectedCategory("All"); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === "audit" ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200"}`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Security Audit</span>
              {(audit.weak.length + audit.reused.length) > 0 && (
                <span className="ml-auto text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-950/30 text-amber-600 rounded-full font-bold">{(audit.weak.length + audit.reused.length)}</span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab("settings"); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === "settings" ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200"}`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings & 2FA</span>
            </button>

            <button
              onClick={() => { setActiveTab("backup"); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === "backup" ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200"}`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Encrypted Backup</span>
            </button>


          </div>

          {/* Quick Stats Widget */}
          {passwords.length > 0 && (
            <div className="glass-panel rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Vault Health</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>Weak Passwords:</span>
                  <span className="text-amber-500 font-bold">{audit.weak.length}</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span>Reused Passwords:</span>
                  <span className="text-red-500 font-bold">{audit.reused.length}</span>
                </div>
                <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full" 
                    style={{ width: `${Math.max(0, 100 - ((audit.weak.length + audit.reused.length) / passwords.length) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* MAIN DISPLAY REGION */}
        <div className="flex-1 space-y-6">

          {/* VAULT & FAVORITES MAIN TABS */}
          {(activeTab === "vault" || activeTab === "favorites" || activeTab === "audit") && (
            <div className="space-y-4">
              
              {/* TOP SUMMARY STATS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 tracking-wider">Total Items</p>
                    <h3 className="text-xl sm:text-2xl font-black mt-1 text-slate-800 dark:text-white">{passwords.length}</h3>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <FolderLock className="w-5 h-5" />
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 tracking-wider">Starred Items</p>
                    <h3 className="text-xl sm:text-2xl font-black mt-1 text-slate-800 dark:text-white">
                      {passwords.filter(p => p.isFavorite).length}
                    </h3>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
                    <Star className="w-5 h-5 fill-amber-500/10" />
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 tracking-wider">Security Alerts</p>
                    <h3 className={`text-xl sm:text-2xl font-black mt-1 ${(audit.weak.length + audit.reused.length) > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                      {(audit.weak.length + audit.reused.length)}
                    </h3>
                  </div>
                  <div className={`p-3 rounded-xl ${audit.weak.length + audit.reused.length > 0 ? "bg-amber-50 dark:bg-amber-950/20 text-amber-500" : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500"}`}>
                    {audit.weak.length + audit.reused.length > 0 ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* COLLAPSIBLE ADD/EDIT FORM CARD */}
              {isFormOpen && (
                <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4 animate-slide-up mb-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-150 dark:border-slate-800">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      {editingId ? "Update Credential" : "Add New Credential"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => { resetForm(); setIsFormOpen(false); }}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSavePassword} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Credential Type Selector */}
                    <div className="sm:col-span-2 flex gap-3 p-1 bg-slate-150 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-800/60 rounded-xl">
                      {["login", "card", "note"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm({ ...form, type: t })}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${form.type === t ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/10" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    {/* Website or Title */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {form.type === "login" ? "Website or App URL" : form.type === "card" ? "Bank / Card Issuer" : "Note Title"}
                      </label>
                      <input
                        type="text"
                        placeholder={form.type === "login" ? "e.g. google.com" : form.type === "card" ? "e.g. Chase Bank" : "e.g. Wi-Fi Config"}
                        value={form.website}
                        onChange={(e) => setForm({ ...form, website: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                        required
                      />
                    </div>

                    {/* Type specific fields */}
                    {form.type === "login" && (
                      <>
                        {/* Username */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Username / Email</label>
                          <input
                            type="text"
                            placeholder="Enter username"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                            required
                          />
                        </div>

                        {/* Password */}
                        <div className="space-y-1 relative">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Password</label>
                            <button
                              type="button"
                              onClick={() => setIsGeneratorOpen(!isGeneratorOpen)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:text-indigo-400 transition"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Generate</span>
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Enter password"
                            value={form.password}
                            onChange={(e) => handlePasswordChange(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800 dark:text-slate-100"
                            required
                          />
                          {form.type === "login" && form.password && (
                            <div className="mt-1.5 text-[11px] font-medium flex items-center gap-1.5">
                              {checkingPwned ? (
                                <span className="text-slate-400 flex items-center gap-1">
                                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
                                  Checking breach status...
                                </span>
                              ) : pwnedCount > 0 ? (
                                <span className="text-red-500 flex items-center gap-1 font-bold animate-pulse">
                                  ⚠️ WARNING: Password breached {pwnedCount.toLocaleString()} times!
                                </span>
                              ) : (
                                <span className="text-green-500 flex items-center gap-1">
                                  ✅ Safe: No known leaks.
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Password Strength Indicator & Generator Drawer (Col-span-2) */}
                        <div className="sm:col-span-2 space-y-3">
                          <PasswordStrengthMeter password={form.password} />
                          
                          {isGeneratorOpen && (
                            <div className="animate-fade-in">
                              <PasswordGenerator 
                                onUsePassword={(genPass) => {
                                  setForm({ ...form, password: genPass });
                                  setIsGeneratorOpen(false);
                                }} 
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {form.type === "card" && (
                      <>
                        {/* Cardholder Name */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cardholder Name</label>
                          <input
                            type="text"
                            placeholder="e.g. JOHN DOE"
                            value={form.cardholderName}
                            onChange={(e) => setForm({ ...form, cardholderName: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                          />
                        </div>

                        {/* Card Number */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Card Number</label>
                          <input
                            type="text"
                            placeholder="e.g. 1111 2222 3333 4444"
                            value={form.cardNumber}
                            onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                            required
                          />
                        </div>

                        {/* Expiry Date */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Expiration Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={form.expiryDate}
                            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                            required
                          />
                        </div>

                        {/* CVV */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">CVV</label>
                          <input
                            type="password"
                            maxLength="4"
                            placeholder="e.g. 123"
                            value={form.cvv}
                            onChange={(e) => setForm({ ...form, cvv: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                            required
                          />
                        </div>
                      </>
                    )}

                    {form.type === "note" && (
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Secure Note Content</label>
                        <textarea
                          rows="4"
                          placeholder="Type your sensitive note content here..."
                          value={form.noteContent}
                          onChange={(e) => setForm({ ...form, noteContent: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                          required
                        />
                      </div>
                    )}

                    {/* Form Action Buttons (Col-span-2) */}
                    <div className="sm:col-span-2 flex gap-3 pt-3 border-t border-slate-150 dark:border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => { resetForm(); setIsFormOpen(false); }}
                        className="flex-1 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-450 rounded-xl text-xs sm:text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs sm:text-sm transition duration-200 shadow-md shadow-indigo-500/10"
                      >
                        {editingId ? "Update" : "Save"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* SECURITY SCORE CARD PANEL */}
              {activeTab === "audit" && (
                <div className="glass-panel rounded-3xl p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center animate-slide-up mb-4">
                  
                  {/* Score circle (Left column) */}
                  <div className="flex flex-col items-center justify-center text-center p-2 border-r border-slate-100 dark:border-slate-800/40 md:col-span-1">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className="stroke-slate-100 dark:stroke-slate-800"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className={`${securityReport.progressColor} transition-all duration-500`}
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={251.2}
                          strokeDashoffset={251.2 - (251.2 * securityReport.score) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-slate-800 dark:text-white">{securityReport.score}%</span>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Score</span>
                      </div>
                    </div>
                    
                    <h4 className={`mt-3 font-extrabold text-xs sm:text-sm ${securityReport.colorClass}`}>
                      {securityReport.level}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Based on 2FA status and credential health.
                    </p>
                  </div>

                  {/* Recommendations (Right column) */}
                  <div className="md:col-span-2 space-y-3.5">
                    <div>
                      <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm sm:text-base">Security Recommendations</h3>
                      <p className="text-xs text-slate-400">Actionable checklist to strengthen your vault security.</p>
                    </div>

                    <div className="space-y-2">
                      {/* 2FA recommendation */}
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/30">
                        <div className="flex items-center gap-2">
                          <span className={`p-1 rounded-lg ${securityReport.has2FA ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20" : "bg-rose-50 text-rose-550 dark:bg-rose-950/20"}`}>
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">Two-Factor Authentication</span>
                        </div>
                        {securityReport.has2FA ? (
                          <span className="text-[10px] font-bold text-emerald-500">Enabled (+15)</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveTab("settings")}
                            className="px-2.5 py-1 text-[10px] font-extrabold text-indigo-500 hover:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-500/20 uppercase tracking-wide transition"
                          >
                            Enable 2FA
                          </button>
                        )}
                      </div>

                      {/* Weak Passwords recommendation */}
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/30">
                        <div className="flex items-center gap-2">
                          <span className={`p-1 rounded-lg ${securityReport.weakCount === 0 ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20" : "bg-amber-50 text-amber-500 dark:bg-amber-950/20"}`}>
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">Weak Passwords</span>
                        </div>
                        {securityReport.weakCount === 0 ? (
                          <span className="text-[10px] font-bold text-emerald-500">None found</span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-500">{securityReport.weakCount} Weak (Rotate)</span>
                        )}
                      </div>

                      {/* Reused Passwords recommendation */}
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/30">
                        <div className="flex items-center gap-2">
                          <span className={`p-1 rounded-lg ${securityReport.reusedCount === 0 ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20" : "bg-rose-50 text-rose-500 dark:bg-rose-950/20"}`}>
                            <RefreshCw className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">Reused Passwords</span>
                        </div>
                        {securityReport.reusedCount === 0 ? (
                          <span className="text-[10px] font-bold text-emerald-500">None found</span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-500">{securityReport.reusedCount} Reused (Deduplicate)</span>
                        )}
                      </div>

                      {/* Leaked Passwords recommendation */}
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/30">
                        <div className="flex items-center gap-2">
                          <span className={`p-1 rounded-lg ${securityReport.pwnedCount === 0 ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20" : "bg-rose-50 text-rose-500 dark:bg-rose-950/20 bg-opacity-80"}`}>
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">Leaked Passwords</span>
                        </div>
                        {securityReport.pwnedCount === 0 ? (
                          <span className="text-[10px] font-bold text-emerald-500 font-semibold">None found</span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-500 animate-pulse">{securityReport.pwnedCount} Leaked (Danger!)</span>
                        )}
                      </div>

                    </div>
                  </div>

                </div>
              )}

              {/* SEARCH, FILTER, CATEGORY TABS */}
              <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                
                {/* Search Input */}
                <div className="relative w-full md:max-w-xs">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by website or username..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Type Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-start sm:justify-end overflow-x-auto py-1">
                  {["All", "Logins", "Cards", "Notes"].map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedCategory(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition ${selectedCategory === type ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-500/10" : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80"}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading credentials...</span>
                </div>
              ) : filteredPasswords.length === 0 ? (
                // Empty State Design
                <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4 animate-scale-up">
                  <div className="inline-block p-4 bg-slate-50 dark:bg-slate-850/50 text-slate-400 rounded-3xl">
                    <KeyRound className="w-10 h-10" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">No passwords found</h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {search || selectedCategory !== "All"
                      ? "Try tweaking your filters or search query."
                      : "Create your first credential by clicking the 'Add Credential' button above!"}
                  </p>
                  {!(search || selectedCategory !== "All") && (
                    <button
                      onClick={() => { resetForm(); setIsFormOpen(true); }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs sm:text-sm transition duration-200"
                    >
                      Get Started
                    </button>
                  )}
                </div>
              ) : (
                // Saved Credentials Grid with dynamic staggered entry animations
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPasswords.map((item, index) => {
                    const isVisible = visiblePasswords[item._id] || false;
                    const isLogin = item.type === "login" || !item.type;
                    const isCard = item.type === "card";
                    const isNote = item.type === "note";
                    const isWeak = isLogin && (item.password.length < 8 || !/[A-Z]/.test(item.password) || !/[a-z]/.test(item.password) || !/[0-9]/.test(item.password));
                    const isReused = isLogin && passwords.filter(p => p.password === item.password).length > 1;
                    const isBreached = isLogin && breachedMap[item.password] > 0;

                    return (
                      <div 
                        key={item._id} 
                        style={{ animationDelay: `${index * 0.04}s` }}
                        className="glass-panel opacity-0 hover:border-indigo-500/35 dark:hover:border-indigo-500/35 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 transition duration-250 group relative animate-slide-up hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        {/* Audit indicators */}
                        {isLogin && (isWeak || isReused || isBreached) && activeTab === "audit" && (
                          <div className="absolute top-4 right-14 flex gap-1">
                            {isWeak && (
                              <span className="p-1 bg-amber-50 text-amber-500 dark:bg-amber-950/20 rounded-md" title="Weak Password">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                            {isReused && (
                              <span className="p-1 bg-red-50 text-red-500 dark:bg-red-950/20 rounded-md" title="Reused Password">
                                <RefreshCw className="w-3.5 h-3.5" />
                              </span>
                            )}
                            {isBreached && (
                              <span className="p-1 bg-red-100 text-red-500 dark:bg-red-950/30 rounded-md animate-pulse" title={`Leaked: Found in ${breachedMap[item.password].toLocaleString()} public breaches!`}>
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        )}

                        {/* Top Card Info */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {/* Icon Indicator */}
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200/30 dark:border-slate-700/30 shrink-0">
                              {isLogin && <FolderLock className="w-5 h-5 text-slate-400" />}
                              {isCard && <CreditCard className="w-5 h-5 text-indigo-500" />}
                              {isNote && <FileText className="w-5 h-5 text-emerald-500" />}
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base break-all">
                                  {item.website}
                                </h4>
                                {isLogin && (
                                  <a 
                                    href={item.website.startsWith("http") ? item.website : `https://${item.website}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-slate-400 hover:text-indigo-500 transition shrink-0"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                              <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${getCategoryColor(item.type)}`}>
                                {item.type || "login"}
                              </span>
                            </div>
                          </div>

                          {/* Star Toggle & Edit actions */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleFavorite(item)}
                              className={`p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 transition ${item.isFavorite ? "text-amber-500" : "text-slate-400 dark:text-slate-500"}`}
                              title={item.isFavorite ? "Unfavorite" : "Favorite"}
                            >
                              <Star className={`w-4 h-4 ${item.isFavorite ? "fill-amber-500" : ""}`} />
                            </button>
                          </div>
                        </div>

                        {/* Interactive fields based on Credential Type */}
                        <div className="space-y-2 flex-grow">
                          {isLogin && (
                            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/60">
                              {/* Username */}
                              <div className="flex items-center justify-between text-xs sm:text-sm">
                                <div className="truncate pr-2">
                                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 block uppercase tracking-wider">Username</span>
                                  <span className="font-mono text-slate-850 dark:text-slate-200 truncate block mt-0.5">{item.username}</span>
                                </div>
                                <button 
                                  onClick={() => handleCopyText(item.username, item._id, "Username")}
                                  className="p-1 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition"
                                >
                                  {copiedId.id === item._id && copiedId.field === "Username" ? (
                                    <Check className="w-3.5 h-3.5 text-green-500 animate-scale-up" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 hover:scale-105 active:scale-95 transition" />
                                  )}
                                </button>
                              </div>

                              {/* Password */}
                              <div className="flex items-center justify-between text-xs sm:text-sm border-t border-slate-100 dark:border-slate-800/40 pt-2">
                                <div className="truncate pr-2">
                                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-555 block uppercase tracking-wider">Password</span>
                                  <span className="font-mono text-slate-850 dark:text-slate-200 truncate block mt-0.5">
                                    {isVisible ? item.password : "••••••••••••"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={() => togglePasswordVisibility(item._id)}
                                    className="p-1 text-slate-400 hover:text-indigo-500 transition"
                                  >
                                    {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button 
                                    onClick={() => handleCopyText(item.password, item._id, "Password")}
                                    className="p-1 text-slate-400 hover:text-indigo-500 transition"
                                  >
                                    {copiedId.id === item._id && copiedId.field === "Password" ? (
                                      <Check className="w-3.5 h-3.5 text-green-500 animate-scale-up" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 hover:scale-105 active:scale-95 transition" />
                                    )}
                                  </button>
                                  {item.passwordHistory && item.passwordHistory.length > 0 && (
                                    <button 
                                      onClick={() => toggleHistoryVisibility(item._id)}
                                      className="p-1 text-slate-400 hover:text-indigo-500 transition"
                                      title="View password version history"
                                    >
                                      <History className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Password History inline drawer */}
                              {showHistory[item._id] && item.passwordHistory && item.passwordHistory.length > 0 && (
                                <div className="mt-2.5 p-2.5 bg-slate-100/50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/40 space-y-2 animate-slide-up">
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 block uppercase tracking-wider">Previous Passwords</span>
                                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                                    {item.passwordHistory.map((h, hIdx) => (
                                      <div key={h._id || hIdx} className="flex items-center justify-between text-xs font-mono border-b border-slate-150/40 dark:border-slate-800/20 pb-1.5 last:border-b-0 last:pb-0">
                                        <div className="truncate pr-2">
                                          <span className="text-slate-800 dark:text-slate-200 block truncate text-[11px]">{h.password}</span>
                                          <span className="text-[9px] text-slate-400 block mt-0.5">{new Date(h.changedAt).toLocaleString()}</span>
                                        </div>
                                        <button 
                                          onClick={() => handleCopyText(h.password, item._id + h.changedAt, "Previous Password")}
                                          className="p-1 text-slate-400 hover:text-indigo-500 transition shrink-0"
                                        >
                                          {copiedId.id === (item._id + h.changedAt) && copiedId.field === "Previous Password" ? (
                                            <Check className="w-3 h-3 text-green-500 animate-scale-up" />
                                          ) : (
                                            <Copy className="w-3 h-3 hover:scale-105 active:scale-95 transition" />
                                          )}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {isCard && (
                            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/60">
                              {/* Cardholder Name */}
                              <div className="flex items-center justify-between text-xs sm:text-sm">
                                <div className="truncate pr-2">
                                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 block uppercase tracking-wider">Cardholder</span>
                                  <span className="font-mono text-slate-850 dark:text-slate-200 truncate block mt-0.5">{item.cardholderName || "N/A"}</span>
                                </div>
                                <button 
                                  onClick={() => handleCopyText(item.cardholderName, item._id, "Cardholder Name")}
                                  className="p-1 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition"
                                >
                                  {copiedId.id === item._id && copiedId.field === "Cardholder Name" ? (
                                    <Check className="w-3.5 h-3.5 text-green-500 animate-scale-up" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 hover:scale-105 active:scale-95 transition" />
                                  )}
                                </button>
                              </div>

                              {/* Card Number */}
                              <div className="flex items-center justify-between text-xs sm:text-sm border-t border-slate-100 dark:border-slate-800/40 pt-2">
                                <div className="truncate pr-2">
                                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-555 block uppercase tracking-wider">Card Number</span>
                                  <span className="font-mono text-slate-850 dark:text-slate-200 truncate block mt-0.5">
                                    {isVisible ? item.cardNumber : formatMaskedCard(item.cardNumber)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={() => togglePasswordVisibility(item._id)}
                                    className="p-1 text-slate-400 hover:text-indigo-500 transition"
                                  >
                                    {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button 
                                    onClick={() => handleCopyText(item.cardNumber, item._id, "Card Number")}
                                    className="p-1 text-slate-400 hover:text-indigo-500 transition"
                                  >
                                    {copiedId.id === item._id && copiedId.field === "Card Number" ? (
                                      <Check className="w-3.5 h-3.5 text-green-500 animate-scale-up" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 hover:scale-105 active:scale-95 transition" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Expiry & CVV */}
                              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800/40 pt-2">
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-555 block uppercase tracking-wider">Expiry</span>
                                  <span className="font-mono text-xs text-slate-850 dark:text-slate-200 block mt-0.5">{item.expiryDate}</span>
                                </div>
                                <div className="flex justify-between items-center pr-1">
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-555 block uppercase tracking-wider">CVV</span>
                                    <span className="font-mono text-xs text-slate-850 dark:text-slate-200 block mt-0.5">
                                      {isVisible ? item.cvv : "•••"}
                                    </span>
                                  </div>
                                  <button 
                                    onClick={() => handleCopyText(item.cvv, item._id, "CVV")}
                                    className="p-1 text-slate-400 hover:text-indigo-500 transition"
                                  >
                                    {copiedId.id === item._id && copiedId.field === "CVV" ? (
                                      <Check className="w-3.5 h-3.5 text-green-500 animate-scale-up" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 hover:scale-105 active:scale-95 transition" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {isNote && (
                            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/60 relative group/note">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 block uppercase tracking-wider mb-1">Secure Note</span>
                              <p className="font-mono text-xs text-slate-700 dark:text-slate-350 break-all whitespace-pre-wrap max-h-24 overflow-y-auto pr-8">
                                {isVisible ? item.noteContent : "••••••••••••••••••••••••••••••"}
                              </p>
                              <div className="absolute top-2 right-2 flex flex-col gap-1">
                                <button 
                                  onClick={() => togglePasswordVisibility(item._id)}
                                  className="p-1 text-slate-400 hover:text-indigo-500 transition"
                                >
                                  {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button 
                                  onClick={() => handleCopyText(item.noteContent, item._id, "Note Content")}
                                  className="p-1 text-slate-400 hover:text-indigo-500 transition"
                                >
                                  {copiedId.id === item._id && copiedId.field === "Note Content" ? (
                                    <Check className="w-3.5 h-3.5 text-green-500 animate-scale-up" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 hover:scale-105 active:scale-95 transition" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer Card Actions */}
                        <div className="flex justify-between items-center text-[10px] sm:text-xs text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/30">
                          <span>
                            Last access: {item.lastUsed ? new Date(item.lastUsed).toLocaleDateString() : "Never"}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-indigo-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg transition"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-red-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* SETTINGS PANEL (2FA STATUS & SESSIONS) */}
          {activeTab === "settings" && (
            <div className="space-y-6 animate-fade-in">
              <TwoFactorSettings 
                initialEnabled={user?.twoFactorEnabled || false} 
                onStatusChange={(status) => {
                  const updatedUser = { ...user, twoFactorEnabled: status };
                  localStorage.setItem("user", JSON.stringify(updatedUser));
                }}
              />
              <ActiveSessions />
            </div>
          )}
 
          {/* ENCRYPTED BACKUP PANEL */}
          {activeTab === "backup" && (
            <div className="space-y-6 animate-fade-in">
              <BackupPanel 
                passwords={passwords} 
                onImportSuccess={fetchPasswords}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Manager;

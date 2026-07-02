import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { LogOut, ShieldAlert } from "lucide-react";

function Navbar({ darkMode, setDarkMode }) {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    const handleLogout = async () => {
        try {
            await axios.post(
                "http://localhost:5000/api/v1/auth/logout",
                {},
                { withCredentials: true }
            );
        } catch (error) {
            console.warn("Backend logout ignored:", error);
        } finally {
            localStorage.removeItem("user");
            toast.success("Logged out successfully!", { theme: darkMode ? "dark" : "light" });
            navigate("/login");
        }
    };

    return (
        <nav className="glass-panel sticky top-0 z-40 px-4 py-3.5 sm:px-8 md:px-16 flex items-center justify-between border-b transition-colors duration-300">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
                <div className="p-1.5 bg-indigo-650 dark:bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition duration-200">
                    <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-800 dark:text-slate-100 flex items-center">
                    Pass<span className="text-indigo-600 dark:text-indigo-500">X</span>
                </span>
            </Link>

            {/* Right Side Options */}
            <div className="flex items-center gap-3 sm:gap-5">


                {/* User Status / Login Buttons */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {user && (
                        <>
                            <span className="text-[11px] sm:text-sm font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[80px] sm:max-w-none">
                                Hi, <span className="text-indigo-600 dark:text-indigo-400">{user.username}</span>
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl font-bold transition"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span className="hidden xs:inline">Logout</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;

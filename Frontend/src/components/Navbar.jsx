import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Navbar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    const handleLogout = async () => {
        try {
            await axios.post(
                "http://localhost:5000/api/v1/auth/logout",
                {},
                { withCredentials: true }
            );

            localStorage.removeItem("user");
            toast.success("Logged out successfully!");
            navigate("/login");
            } catch (error) {
                toast.error(error.response.data.message);
            }
    };

    return (
        <nav className="bg-slate-950 flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 gap-4 sm:gap-0">
            <div className="font-bold text-2xl text-white text-center sm:text-left sm:px-10 md:px-20 lg:px-32">
            <h1 className="font-bold text-2xl sm:text-3xl">
                <span className="text-pink-500">&lt;</span>
                    PassX
                <span className="text-pink-500">/&gt;</span>
            </h1>
            </div>

            <ul className="flex flex-wrap justify-center sm:justify-end gap-3 sm:gap-5 text-base sm:text-lg">
            {user ? (
                <>
                    <li className="text-white font-bold self-center">Welcome {user.username}!</li>
                    <li>
                        <button onClick={handleLogout} className="text-pink-500 border-2 border-white px-3 py-1 sm:p-1.5 rounded-2xl font-bold hover:bg-white hover:text-slate-900 transition" > Logout </button>
                    </li>
                </>
            ) : (
                <>
                <li>
                    <Link to="/signup" className="text-pink-500 border-2 border-white px-3 py-1 sm:p-1.5 rounded-2xl font-bold hover:bg-white hover:text-slate-900 transition" > Signup </Link>
                </li>
                <li>
                    <Link to="/login" className="text-pink-500 border-2 border-white px-3 py-1 sm:p-1.5 rounded-2xl font-bold hover:bg-white hover:text-slate-900 transition" > Login </Link>
                </li>
                </>
            )}
            </ul>
        </nav>
    );
}

export default Navbar;

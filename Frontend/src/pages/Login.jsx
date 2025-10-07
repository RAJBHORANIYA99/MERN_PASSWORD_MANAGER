import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

function Login() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({ email: "", password: "" });

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
		const response = await axios.post(
			"http://localhost:5000/api/v1/auth/login",
			formData,
			{ withCredentials: true }
		);
		toast.success("Login successful!");
		localStorage.setItem("user", JSON.stringify(response.data));
		navigate("/");
		} catch (error) {
		toast.error(error.response.data.message);
		}
	};
	return (
		<div className="flex items-center justify-center min-h-[84.8vh]">
			<div className="w-full max-w-md p-8 space-y-6 bg-white rounded-4xl shadow-md">
				<h1 className="text-2xl font-bold text-center text-gray-900">
				Login to your account
				</h1>
				<form className="space-y-6" onSubmit={handleSubmit}>
					<div>
						<label className="block text-sm font-medium text-gray-700" >Email address</label>
						<input id="email" name="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value }) } className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500" />
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">Password</label> 
						<input id="password" name="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value }) } className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500" />
					</div>
					<div>
						<button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500" > Sign in </button>
					</div>
				</form>
				<p className="text-sm text-center text-gray-600"> Don't have an account?{" "}
					<Link to="/signup" className="font-medium text-pink-600 hover:text-pink-500">Sign up</Link>
				</p>
			</div>
		</div>
	);
}

export default Login;

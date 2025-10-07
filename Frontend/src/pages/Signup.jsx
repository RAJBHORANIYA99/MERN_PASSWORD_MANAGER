import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

function Signup() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
	});

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
		const response = await axios.post(
			"http://localhost:5000/api/v1/auth/signup",
			formData,
			{ withCredentials: true }
		);

		toast.success("Signup successfully");
		console.log(response.data);
		localStorage.setItem("user", JSON.stringify(response.data));

		navigate("/");
		} catch (error) {
		toast.error(error.response.data.message);
		}
	};

	return (
		<div className="flex items-center justify-center min-h-[84.8vh]">
			<div className="w-full max-w-md p-8 space-y-6 bg-white rounded-4xl shadow-md">
			<h1 className="text-2xl font-bold text-center text-gray-900">Create a new account</h1>
			<form className="space-y-6" onSubmit={handleSubmit}>
				<div>
					<label className="block text-sm font-medium text-gray-700">Username</label>
					<input id="username" name="username" type="text" required value={formData.username} onChange={handleChange} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700">Email address</label>
					<input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500" />
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700">Password</label>
					<input id="password" name="password" type="password" autoComplete="new-password" required value={formData.password} onChange={handleChange} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500" />
				</div>
				<div>
					<button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500" > Sign up </button>
				</div>
			</form>
			<p className="text-sm text-center text-gray-600"> Already have an account?{" "} 
				<Link to="/login" className="font-medium text-pink-600 hover:text-pink-500" > Sign in </Link>
			</p>
			</div>
		</div>
	);
}

export default Signup;

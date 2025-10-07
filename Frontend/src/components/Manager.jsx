import { useRef, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import eye from "../assets/eye.png";
import eyecross from "../assets/eyecross.png";
import "react-toastify/dist/ReactToastify.css";

function Manager() {
	const ref = useRef();
	const passwordRef = useRef();

	const [form, setform] = useState({ website: "", username: "", password: "" });
	const [passwordes, setpasswordes] = useState([]);
	const [editingId, setEditingId] = useState(null);

	useEffect(() => {
		displayPassword();
	}, []);

	const showpassword = () => {
		if (ref.current.src.includes(eyecross)) {
		ref.current.src = eye;
		passwordRef.current.type = "text";
		} else {
		ref.current.src = eyecross;
		passwordRef.current.type = "password";
		}
	};
	const savePassword = async () => {
		try {
		if (editingId) {
			await axios.put(
			`http://localhost:5000/api/v1/pass/${editingId}`,
			{
				website: form.website,
				username: form.username,
				password: form.password,
			},
			{ withCredentials: true }
			);
			setEditingId(null);
			toast.success("Password Update successfully!", {
			position: "top-center",
			autoClose: 3000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: "dark",
			});
		} else {
			await axios.post(
			"http://localhost:5000/api/v1/pass",
			{
				website: form.website,
				username: form.username,
				password: form.password,
			},
			{ withCredentials: true }
			);
			toast.success("Password saved successfully!", {
			position: "top-center",
			autoClose: 3000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: "dark",
			});
		}
		setform({ website: "", username: "", password: "" });
		displayPassword();
		} catch (error) {
		toast.error(error.response.data.message, {
			position: "top-center",
			autoClose: 3000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: "dark",
		});
		}
	};

	const displayPassword = async () => {
		try {
		const response = await axios.get("http://localhost:5000/api/v1/pass", {
			withCredentials: true,
		});
		setpasswordes(response.data.passes);
		} catch (error) {
		toast.error(error.response?.data?.message || "Failed to fetch passwords", {
			position: "top-center",
			autoClose: 3000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: "dark",
		});
		}
	};

	const copyText = (text) => {
		toast("Copied to clipboard!", {
		position: "top-center",
		autoClose: 3000,
		hideProgressBar: false,
		closeOnClick: true,
		pauseOnHover: true,
		draggable: true,
		progress: undefined,
		theme: "dark",
		});
		navigator.clipboard.writeText(text);
	};

	const editPassword = async (id) => {
		const p = passwordes.find((i) => i._id === id);
		setform({ website: p.website, username: p.username, password: p.password });
		setEditingId(id);
	};

	const deletePassword = async (id) => {
		try {
		await axios.delete(`http://localhost:5000/api/v1/pass/${id}`, {
			withCredentials: true,
		});
		displayPassword();
		toast.success("Password deleted successfully!", {
			position: "top-center",
			autoClose: 3000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: "dark",
		});
		} catch (error) {
		toast.error(error.response.data.message, {
			position: "top-center",
			autoClose: 3000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: "dark",
		});
		}
	};
	return (
		<div className="mx-auto w-[90%] sm:w-[85%] md:w-[80%] rounded-2xl min-h-[84.8vh] ">
			<h1 className="font-bold text-2xl sm:text-3xl text-center py-2">
				<span className="text-pink-500">&lt;</span>
					PassX
				<span className="text-pink-500">/&gt;</span>
			</h1>
			<p className="text-center font-bold text-lg sm:text-xl md:text-[125%]">Your Own Password Manager</p>
			<div className="flex flex-col pt-5 pb-2 text-black items-center gap-3 sm:gap-5">
			<input type="text" value={form.website} onChange={(e) => setform({ ...form, website: e.target.value })} placeholder="Enter Website/App Name" className="rounded-full border-2 border-pink-500 py-1 px-4 w-[90%] sm:w-[70%] md:w-[50%] text-xl sm:text-xl focus:outline-none focus:border-slate-950"/>

			<div className="flex flex-col sm:flex-row py-2 gap-4 sm:gap-5 w-[90%] sm:w-auto justify-center">
				<input type="text" value={form.username} onChange={(e) => setform({ ...form, username: e.target.value })} placeholder="Enter Username" className="rounded-full border-2 border-pink-500 py-1 px-4 w-full sm:w-60 text-lg sm:text-xl focus:outline-none focus:border-slate-950" />

				<div className="relative w-full sm:w-60">
				<input type="password" ref={passwordRef} value={form.password} onChange={(e) => setform({ ...form, password: e.target.value })} placeholder="Enter Password" className="rounded-full border-2 border-pink-500 py-1 px-4 w-full text-lg sm:text-xl focus:outline-none focus:border-slate-950" />
				<span className="absolute right-[5px] top-[2.5px] cursor-pointer" onClick={showpassword} >
					<img ref={ref} className="p-1" width={35} src={eyecross} alt="eyecross" />
				</span>
				</div>
			</div>
				<button onClick={savePassword} className="flex justify-center items-center gap-2 bg-pink-600 hover:bg-pink-400 rounded-2xl px-6 sm:px-8 py-2 sm:py-3 border-2 border-pink-900 font-bold text-sm sm:text-[20px]" >
					<lord-icon src="https://cdn.lordicon.com/jgnvfzqg.json" trigger="hover" ></lord-icon>
					{editingId ? "Update Password" : "Save Password"}
				</button>
			</div>
			<div className="password pb-10">
			<div className="flex justify-center">
				<h2 className="font-bold py-4 text-xl sm:text-2xl">Your Saved Password</h2>
			</div>
			{passwordes.length === 0 && (<div className="text-center text-black font-medium">No Password</div>)}
			{passwordes.length !== 0 && (
				<div className="overflow-x-auto">
				<table className="table-auto w-[95%] sm:w-[90%] mx-auto border-2 border-white">
					<thead className="bg-pink-600 text-slate-950 ">
						<tr>
							<th className="py-2 text-sm sm:text-[20px] px-2 border-2 border-white">Site/App</th>
							<th className="py-2 text-sm sm:text-[20px] px-2 border-2 border-white">Username</th>
							<th className="py-2 text-sm sm:text-[20px] px-2 border-2 border-white">Password</th>
							<th className="py-2 text-sm sm:text-[20px] px-2 border-2 border-white">Action</th>
						</tr>
					</thead>
					<tbody className="bg-pink-400 text-sm sm:text-base">
					{passwordes.map((item, index) => (
						<tr key={index}>
						<td className="text-center py-2 px-2 border-2 border-white">
							<div className="flex justify-center items-center gap-1">
							<span className="truncate max-w-[100px] sm:max-w-none text-xl">{item.website}</span>
							<div className="size-6 sm:size-7 cursor-pointer" onClick={() => copyText(item.website)} >
								<lord-icon style={{ width: "25px", height: "25px" }} src="https://cdn.lordicon.com/iykgtsbt.json" trigger="hover"></lord-icon>
							</div>
							</div>
						</td>
						<td className="text-center py-2 px-2 border-2 border-white">
							<div className="flex justify-center items-center gap-1">
								<span className="truncate max-w-[100px] sm:max-w-none text-xl">{item.username}</span>
								<div className="size-6 sm:size-7 cursor-pointer" onClick={() => copyText(item.username)} >
									<lord-icon style={{ width: "25px", height: "25px" }} src="https://cdn.lordicon.com/iykgtsbt.json" trigger="hover" ></lord-icon>
								</div>
							</div>
						</td>
						<td className="text-center py-2 px-2 border-2 border-white">
							<div className="flex justify-center items-center gap-1">
								<span className="truncate max-w-[100px] sm:max-w-none text-xl">{item.password}</span>
								<div className="size-6 sm:size-7 cursor-pointer" onClick={() => copyText(item.password)} >
									<lord-icon style={{ width: "25px", height: "25px" }} src="https://cdn.lordicon.com/iykgtsbt.json" trigger="hover" ></lord-icon>
								</div>
							</div>
						</td>
						<td className="justify-center py-2 text-center border-2 border-white">
							<span className="cursor-pointer mx-1" onClick={() => editPassword(item._id)} >
								<lord-icon src="https://cdn.lordicon.com/gwlusjdu.json" trigger="hover" style={{ width: "25px", height: "25px" }} ></lord-icon>
							</span>
							<span className="cursor-pointer mx-1" onClick={() => deletePassword(item._id)} >
								<lord-icon src="https://cdn.lordicon.com/skkahier.json" trigger="hover" style={{ width: "25px", height: "25px" }}></lord-icon>
							</span>
						</td>
					</tr>
					))}
					</tbody>
				</table>
				</div>
			)}
			</div>
		</div>
	);
}

export default Manager;

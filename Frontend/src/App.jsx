import {BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Manager from "./components/Manager";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const PrivateRoute = ({ children }) => {
    const user = localStorage.getItem("user");
    return user ? children : <Navigate to="/login" />;
  };
  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" 
		  	element={
				<PrivateRoute>
				<Manager />
				</PrivateRoute>
            }
          />
        </Routes>
        <Footer />
      </Router>
    </>
  );
}

export default App;

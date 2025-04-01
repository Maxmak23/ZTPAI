import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyReservations from "./pages/MyReservations";
import Reservations from "./pages/Reservations";
import Manage from "./pages/Manage";
import AdminPanel from "./pages/AdminPanel";
import Navbar from "./components/Navbar";
import { useContext } from "react";
import Main from "./pages/Main";

import MovieManagement from "./pages/MovieManagement";
import MovieListings from "./pages/MovieListings";


const ProtectedRoute = ({ children, roles }) => {
    const { user } = useContext(AuthContext);
    if (!user || !roles.includes(user.role)) return <Navigate to="/login" />;
    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Navbar />
                <Routes>
					<Route path="/" element={<Main />} />
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					<Route path="/my-reservations" element={<ProtectedRoute roles={['client']}><MyReservations /></ProtectedRoute>} />
					<Route path="/reservations" element={<ProtectedRoute roles={['employee', 'manager']}><Reservations /></ProtectedRoute>} />
					<Route path="/manage" element={<ProtectedRoute roles={['manager']}><Manage /></ProtectedRoute>} />
					<Route path="/admin-panel" element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>} />
					<Route path="*" element={<Navigate to="/" />} />
                    
					<Route path="/movie-management" element={<ProtectedRoute roles={['client']}><MovieManagement /></ProtectedRoute>} />
					<Route path="/movie-listings" element={<ProtectedRoute roles={['client']}><MovieListings /></ProtectedRoute>} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;

import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { routeConfig, getComponent } from "./config/routes";
import Navbar from "./components/Navbar";
import { useContext } from "react";

const ProtectedRoute = ({ children, roles }) => {
    const { user } = useContext(AuthContext);
    if (!user) return <Navigate to="/login" />;
    if (roles.length > 0 && !roles.includes(user.role)) return <Navigate to="/" />;
    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Navbar />
                <Routes>
                    {routeConfig.map((route) => {
                        const Component = getComponent(route.element);
                        return (
                            <Route
                                key={route.path}
                                path={route.path}
                                element={
                                    route.isPublic ? (
                                        <Component />
                                    ) : (
                                        <ProtectedRoute roles={route.roles}>
                                            <Component />
                                        </ProtectedRoute>
                                    )
                                }
                            />
                        );
                    })}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
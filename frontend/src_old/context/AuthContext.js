import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        axios.get("http://localhost:5000/auth", { withCredentials: true })
            .then(res => {
                if (res.data.authenticated) {
                    setUser(res.data.user);
                }
            });
    }, []);

    const login = (credentials) => {
        return axios.post("http://localhost:5000/login", credentials, { withCredentials: true })
            .then(res => {
                setUser(res.data.user);
                return res.data;
            });
    };

    const logout = () => {
        axios.post("http://localhost:5000/logout", {}, { withCredentials: true }).then(() => {
            setUser(null);
        });
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
    const [data, setData] = useState({ username: "", password: "", role: "client" });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("http://localhost:5000/register", data);
            alert("Registered successfully! Please login.");
            navigate("/login");
        } catch (error) {
            alert("Registration failed!");
        }
    };

    return (
        <div>
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Username" onChange={e => setData({ ...data, username: e.target.value })} />
                <input type="password" placeholder="Password" onChange={e => setData({ ...data, password: e.target.value })} />
                <select onChange={e => setData({ ...data, role: e.target.value })}>
                    <option value="client">Client</option>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                </select>
                <button type="submit">Register</button>
            </form>
        </div>
    );
};

export default Register;

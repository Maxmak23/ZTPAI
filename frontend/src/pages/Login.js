import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Container } from "react-bootstrap";

const Login = () => {
    const [credentials, setCredentials] = useState({ username: "", password: "" });
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(credentials);
            navigate("/");
        } catch (error) {
            alert("Login failed!");
        }
    };

    return (
        <Container className="text-center mt-5">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Username" onChange={e => setCredentials({ ...credentials, username: e.target.value })} />
                <br/>
                <input type="password" placeholder="Password" onChange={e => setCredentials({ ...credentials, password: e.target.value })} />
                <br/>
                <button type="submit">Login</button>
            </form>
        </Container>
    );
};

export default Login;

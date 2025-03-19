import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const NavigationBar = () => {
    const { user, logout } = useContext(AuthContext);

    return (
        <Navbar bg="dark" variant="dark" expand="lg">
            <Container>
                <Navbar.Brand as={Link} to="/">Cinema App</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/">Home</Nav.Link>
                        {user && user.role === "client" && <Nav.Link as={Link} to="/my-reservations">My Reservations</Nav.Link>}
                        {user && (user.role === "employee" || user.role === "manager") && <Nav.Link as={Link} to="/reservations">Reservations</Nav.Link>}
                        {user && user.role === "manager" && <Nav.Link as={Link} to="/manage">Manage</Nav.Link>}
                        {user && user.role === "admin" && <Nav.Link as={Link} to="/admin-panel">Admin Panel</Nav.Link>}

                        
                        {user && user.role === "client" && <Nav.Link as={Link} to="/movie-management">Movie management</Nav.Link>}

                    </Nav>
                    <Nav>
                        {user ? (
                            <>
                                <Navbar.Text className="me-3">Logged in as: {user.username}</Navbar.Text>
                                <Button variant="outline-light" onClick={logout}>Logout</Button>
                            </>
                        ) : (
                            <>
                                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                                <Nav.Link as={Link} to="/register">Register</Nav.Link>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default NavigationBar;
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const NavigationBar = () => {
    const { user, logout } = useContext(AuthContext);

    const navItems = [
        { path: "/", label: "Home", roles: ["client", "employee", "manager", "admin"] },
        { path: "/my-reservations", label: "My Reservations", roles: ["client"] },
        { path: "/reservations", label: "Reservations", roles: ["employee", "manager"] },
        { path: "/manage", label: "Manage", roles: ["manager"] },
        { path: "/admin-panel", label: "Admin Panel", roles: ["admin"] },
        { path: "/movie-management", label: "Movie management", roles: ["client"] },
        { path: "/movie-listings", label: "Movie listings", roles: ["client"] },
        { path: "/employee-dashboard", label: "Employee Dashboard", roles: ["client"] },
        { path: "/admin-panel", label: "Admin Panel", roles: ["client"] }
    ];

    // Check if user has access to a specific path
    const hasAccess = (requiredRoles) => {
        return user && requiredRoles.includes(user.role);
    };    


    return (
        <Navbar bg="dark" variant="dark" expand="lg">
            <Container>
                <Navbar.Brand as={Link} to="/">Cinema App</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {navItems.map((item) => (
                            hasAccess(item.roles) && (
                                <Nav.Link key={item.path} as={Link} to={item.path}>
                                    {item.label}
                                </Nav.Link>
                            )
                        ))}
                    </Nav>
                    <Nav>
                        {user ? (
                            <>
                                <Navbar.Text className="me-3">
                                    Logged in as: {user.username}
                                </Navbar.Text>
                                <Button variant="outline-light" onClick={logout}>
                                    Logout
                                </Button>
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
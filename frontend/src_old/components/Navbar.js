import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { routeConfig } from "../config/routes";

const NavigationBar = () => {
    const { user, logout } = useContext(AuthContext);

    return (
        <Navbar bg="dark" variant="dark" expand="lg">
            <Container>
                <Navbar.Brand as={Link} to="/">Cinema App</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {routeConfig
                            .filter(route => !route.hideInNav)
                            .filter(route => 
                                // Show public routes or routes user has access to
                                route.isPublic || 
                                (user && route.roles.includes(user.role))
                            )
                            .filter(route => 
                                !route.hideWhenLoggedIn || !user
                            )
                            .map((route) => (
                                <Nav.Link 
                                    key={route.path} 
                                    as={Link} 
                                    to={route.path}
                                >
                                    {route.label}
                                </Nav.Link>
                            ))}
                    </Nav>
                    <Nav>
                        {user ? (
                            <>
                                <Navbar.Text className="me-3">
                                    Logged in as: {user.username} ({user.role})
                                </Navbar.Text>
                                <Button variant="outline-light" onClick={logout}>
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <>
                                {routeConfig
                                    .filter(route => route.hideWhenLoggedIn)
                                    .map((route) => (
                                        <Nav.Link 
                                            key={route.path} 
                                            as={Link} 
                                            to={route.path}
                                        >
                                            {route.label}
                                        </Nav.Link>
                                    ))}
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default NavigationBar;
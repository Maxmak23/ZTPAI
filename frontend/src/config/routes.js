export const routeConfig = [
    // Public routes
    {
        path: "/",
        label: "Home",
        element: "Main",
        roles: ["client", "employee", "manager", "admin"],
        isPublic: true
    },
    {
        path: "/login",
        label: "Login",
        element: "Login",
        roles: [],
        isPublic: true,
        hideWhenLoggedIn: true
    },
    {
        path: "/register",
        label: "Register",
        element: "Register",
        roles: [],
        isPublic: true,
        hideWhenLoggedIn: true
    },
    
    // Client routes
    {
        path: "/my-reservations",
        label: "My Reservations",
        element: "MyReservations",
        roles: ["client"] // All logged in users can see their reservations
    },
    {
        path: "/movie-listings",
        label: "Movie Listings",
        element: "MovieListings",
        roles: ["client"]
    },
    {
        path: "/reserve/:id",
        label: "Reserve Seat",
        element: "ReserveSeat",
        roles: ["client"],
        hideInNav: true
    },
    
    // Employee routes
    {
        path: "/employee-dashboard",
        label: "Employee Dashboard",
        element: "EmployeeDashboard",
        roles: ["employee"]
    },
    
    // Manager routes
    {
        path: "/movie-management",
        label: "Movie Management",
        element: "MovieManagement",
        roles: ["manager"]
    },
    {
        path: "/manage",
        label: "Manage Screenings",
        element: "Manage",
        roles: ["manager"]
    },
    
    // Admin routes
    {
        path: "/admin-panel",
        label: "Admin Panel",
        element: "AdminPanel",
        roles: ["admin"]
    }
];

// Helper function to get component by name
export const getComponent = (name) => {
    const components = {
        Main: require("../pages/Main").default,
        Login: require("../pages/Login").default,
        Register: require("../pages/Register").default,
        MyReservations: require("../pages/MyReservations").default,
        MovieListings: require("../pages/MovieListings").default,
        ReserveSeat: require("../pages/ReserveSeat").default,
        EmployeeDashboard: require("../pages/EmployeeDashboard").default,
        MovieManagement: require("../pages/MovieManagement").default,
        Manage: require("../pages/Manage").default,
        AdminPanel: require("../pages/AdminPanel").default
    };
    return components[name];
};
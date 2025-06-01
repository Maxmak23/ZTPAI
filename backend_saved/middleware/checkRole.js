function checkRole(acceptedRoles) {
    return (req, res, next) => {
        // // Check if user is authenticated via JWT middleware
        // if (!req.user) {
        //     return res.status(401).json({ 
        //         error: 'Unauthorized - no user information found (JWT missing or expired)' 
        //     });
        // }

        // // Check if user's role is accepted
        // if (!acceptedRoles.includes(req.user.role)) {
        //     return res.status(403).json({ 
        //         error: `Access denied. Your role (${req.user.role}) is not authorized.`,
        //         requiredRoles: acceptedRoles,
        //         yourRole: req.user.role
        //     });
        // }

        next();
    };
}

module.exports = checkRole;

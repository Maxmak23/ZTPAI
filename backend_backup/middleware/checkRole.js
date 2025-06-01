function checkRole(acceptedRoles) {
    return (req, res, next) => {
        // Check if user is authenticated
        if (!req.session.user) {
            console.log('No session user found - headers:', req.headers);
            return res.status(401).json({ 
                error: 'Unauthorized - please log in first',
                sessionInfo: process.env.NODE_ENV === 'development' ? {
                    sessionId: req.sessionID,
                    session: req.session
                } : undefined
            });
        }

        // Check if user has one of the required roles
        if (!acceptedRoles.includes(req.session.user.role)) {
            return res.status(403).json({ 
                error: `Access denied. Your role (${req.session.user.role}) is not authorized.`,
                requiredRoles: acceptedRoles,
                yourRole: req.session.user.role
            });
        }

        next();
    };
}

module.exports = checkRole;
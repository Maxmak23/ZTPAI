const { verifyAccessToken } = require('../config/jwt');

function requireAuth(req, res, next) {
    try {
        const token = req.cookies['access_token'];
        if (!token) return res.status(401).json({ error: 'Not authenticated' });

        const user = verifyAccessToken(token);
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Access token expired or invalid' });
    }
}

module.exports = { requireAuth };

const jwt = require('jsonwebtoken');

// Middleware to verify if user is admin
const verifyAdmin = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).send({
            success: false,
            message: 'No token provided'
        });
    }

    jwt.verify(token, 'your_jwt_secret_key', (err, decoded) => {
        if (err) {
            return res.status(500).send({
                success: false,
                message: 'Failed to authenticate token'
            });
        }

        if (decoded.role !== 'admin') {
            return res.status(403).send({
                success: false,
                message: 'Access denied: Admins only'
            });
        }

        req.user = decoded; // Save decoded token to request object
        next(); // Proceed to the next middleware or route handler
    });
};

module.exports = verifyAdmin;

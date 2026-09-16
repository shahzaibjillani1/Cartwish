const checkRole = (role) => {
    return (req, res, next) => {
        if (!req.user || !req.user.roles.includes(role)) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        next();
    };
};

module.exports = checkRole;

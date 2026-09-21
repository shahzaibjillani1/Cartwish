const checkRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (
      !req.user ||
      !req.user.roles ||
      !req.user.roles.some((r) => allowedRoles.includes(r))
    ) {
      return res
        .status(403)
        .json({ message: "Access denied. Insufficient permissions." });
    }
    next();
  };
};

module.exports = checkRole;


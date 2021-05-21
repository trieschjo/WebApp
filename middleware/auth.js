const config = require("config");
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ errors: [{ msg: "Kein Token" }] });
  }

  try {
    const decoded = jwt.verify(JSON.parse(token), config.get("jwtsecret"));

    req.user = decoded.user;

    next();
  } catch (error) {
    res.status(401).json({ errors: [{ msg: "Token ungültig" }] });
  }
};

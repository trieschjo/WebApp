const config = require("config");
const express = require("express");
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const router = express.Router();

/**
 * @route   GET api/auth
 * @desc    Get authenticated user
 * @access  Private
 */
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Sever error");
  }
});

/**
 * @route   POST api/auth
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post(
  "/",
  [
    body("email", "Gültige Email erforderlich").isEmail(),
    body("password", "Passwort erforderlich").exists(),
  ],
  async (req, res) => {
    console.log(req.body);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if user exists
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Ungültige Zugangsdaten" }] });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Ungültige Zugangsdaten" }] });
      }

      // Return JWT
      const payload = { user: { id: user.id } };

      jwt.sign(
        payload,
        config.get("jwtsecret"),
        { expiresIn: 3600000 },
        (err, token) => {
          if (err) {
            throw err;
          } else {
            res.json(token);
          }
        }
      );
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Sever error");
    }
  }
);

module.exports = router;
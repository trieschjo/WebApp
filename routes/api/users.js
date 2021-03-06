const express = require("express");
const { body, validationResult } = require("express-validator");
const config = require("config");
const router = express.Router();
const User = require("../../models/User");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.get("/", (req, res) => {
  res.send("Users route");
});

/**
 * @route POST api/users
 * @description Register user
 * @access Public
 */

router.post(
  "/",
  [
    body("name", "Name is required!").not().isEmpty(),
    body("email", "Email is required!").isEmail(),
    body(
      "password",
      "Das Passwort muss aus mindestens 6 Zeichen bestehen!"
    ).isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const { name, email, password } = req.body;

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if user exist

      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: { msg: "Benutzer exisitiert bereits!" } });
      }

      // Get Users Avatar

      const avatar = gravatar.url(email, { s: "200", r: "pg", d: "mp" });

      user = new User({ name, email, avatar, password });

      // Encrypt Password

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // Return JWT Token

      const payload = { user: { id: user.id } };

      jwt.sign(
        payload,
        config.get("jwtsecret"),
        { expiresIn: 3600000 },
        (err, token) => {
          if (err) {
            throw err;
          } else {
            return res.json(token);
          }
        }
      );
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;

const express = require("express");
const auth = require("../../middleware/auth");
const User = require("../../models/User");

const router = express.Router();

/**
 * @route GET api/auth
 * @desc Get autheticated user
 * @access Private
 */

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500)
  }
});

module.exports = router;

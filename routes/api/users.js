const express = require("express");
const {body, validationResult} = require("express-validator");
const router = express.Router();



router.get("/", (req, res) => {
  res.send("Users route");
});

/**
 * @route POST api/users
 * @description Register user
 * @access Public
 */

router.post("/",[
  body("name", "Name is required!").not().isEmpty(),
  body("email", "Email is required!").isEmail(),
  body("password", "Password with at least 6 characters is required!").isLength({
    min: 6
  }),
] , (req, res) => {

  const errors = validationResult(req);
  const {name, email, password} = req.body;

  if(!errors.isEmpty()) {
    return res.status(400).json({errors : errors.array()});
  }

  console.log("Name: " + name + " Email: " + email);
  res.send("Name: " + name + " Email: " + email);


});

module.exports = router;

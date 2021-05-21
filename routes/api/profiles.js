const config = require("config");
const express = require("express");
const { body, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const normalize = require("normalize-url");
const axios = require("axios");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

const router = express.Router();

/**
 * @route   GET api/profiles/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res
        .status(400)
        .json({ errors: [{ msg: "Kein Profil für diesen Benutzer" }] });
    }

    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Sever error");
  }
});

/**
 * @route   POST api/profiles/
 * @desc    Create or update user profile
 * @access  Private
 */
router.post(
  "/",
  [
    auth,
    [
      body("status", "Status is erforderlich").notEmpty(),
      body("skills", "Fähigkeiten sind erfoderlich").notEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      status,
      company,
      website,
      location,
      skills,
      bio,
      githubusername,
      linkedin,
      xing,
      facebook,
      twitter,
      instagram,
      youtube,
    } = req.body;

    const profileFields = {};

    profileFields.user = req.user.id;

    profileFields.status = status;
    profileFields.company = company;

    if (website) {
      profileFields.website = normalize(website, { forceHttps: true });
    }

    profileFields.location = location;
    profileFields.bio = bio;
    profileFields.githubusername = githubusername;

    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }

    const socialfields = {
      linkedin,
      xing,
      facebook,
      twitter,
      instagram,
      youtube,
    };

    for (const [key, value] of Object.entries(socialfields)) {
      if (value && value.length > 0)
        socialfields[key] = normalize(value, { forceHttps: true });
    }
    profileFields.social = socialfields;

    try {
      // https://docs.mongodb.com/manual/reference/method/db.collection.findOneAndUpdate/
      let profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, upsert: true }
      );

      res.json(profile);
    } catch (err) {
      console.error(error.message);
      res.status(500).send("Sever error");
    }
  }
);

/**
 * @route   GET api/profiles/
 * @desc    Get all user profiles
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);

    res.json(profiles);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Sever error");
  }
});

/**
 * @route   GET api/profiles/user/:id
 * @desc    Get user profile by ID
 * @access  Public
 */
router.get("/user/:id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res
        .status(400)
        .json({ errors: { msg: "Kein Profil für diesen Benutzer" } });
    }

    res.json(profile);
  } catch (error) {
    console.error(error.message);

    if (error.kind == "ObjectId") {
      return res
        .status(400)
        .json({ errors: { msg: "Kein Profil für diesen Benutzer" } });
    }

    res.status(500).send("Sever error");
  }
});

/**
 * @route   DELETE api/profiles/
 * @desc    Delete profile and user
 * @access  Private
 */
router.delete("/", auth, async (req, res) => {
  try {
    await Profile.findOneAndRemove({ user: req.user.id });

    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: "Benutzer gelöscht" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

/**
 * @route   PUT api/profiles/experience
 * @desc    Add profile experience
 * @access  Private
 */
router.put(
  "/experience",
  [
    auth,
    [
      body("title", "Titel ist erforderlich").notEmpty(),
      body("company", "Organisation ist erforderlich").notEmpty(),
      body("from", "Startdatum ist erforderlich")
        .notEmpty()
        .custom((value, { req }) =>
          req.body.to ? new Date(value) < new Date(req.body.to) : true
        ),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      if (!profile) {
        return res
          .status(400)
          .json({ errors: { msg: "Kein Profil für diesen Benutzer" } });
      }

      profile.experience.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error");
    }
  }
);

/**
 * @route   DELETE api/profiles/experience/:id
 * @desc    Delete profile experience
 * @access  Private
 */
router.delete("/experience/:id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res
        .status(400)
        .json({ errors: { msg: "Kein Profil für diesen Benutzer" } });
    }

    profile.experience = profile.experience.filter(
      (exp) => exp._id.toString() !== req.params.id
    );

    await profile.save();

    return res.status(200).json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

/**
 * @route   PUT api/profiles/education
 * @desc    Add profile education
 * @access  Private
 */
router.put(
  "/education",
  [
    auth,
    [
      body("school", "Institution erforderlich").notEmpty(),
      body("degree", "Abschluss ist erforderlich").notEmpty(),
      body("fieldofstudy", "Fachgebiet ist erforderlich").notEmpty(),
      body("from", "Startdatum ist erforderlich")
        .notEmpty()
        .custom((value, { req }) =>
          req.body.to ? new Date(value) < new Date(req.body.to) : true
        ),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      if (!profile) {
        return res
          .status(400)
          .json({ errors: { msg: "Kein Profil für diesen Benutzer" } });
      }

      profile.education.unshift(newEdu);

      await profile.save();

      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error");
    }
  }
);

/**
 * @route   DELETE api/profiles/education/:id
 * @desc    Delete profile education
 * @access  Private
 */
router.delete("/education/:id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res
        .status(400)
        .json({ errors: { msg: "Kein Profil für diesen Benutzer" } });
    }

    profile.education = profile.education.filter(
      (exp) => exp._id.toString() !== req.params.id
    );

    await profile.save();

    return res.status(200).json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

/**
 * @route   GET api/profiles/github/:id
 * @desc    Get user repos from GitHub
 * @access  Public
 */
router.get("/github/:id", async (req, res) => {
  try {
    let conf = {
      method: "get",
      url:
        "https://api.github.com/users/informaticup/repos?per_page=5&sort=created:asc",
      headers: {
        Authorization: `token ${config.get("gitHubToken")}`,
      },
    };

    const gitHubResponse = await axios(conf);

    return res.json(gitHubResponse.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;

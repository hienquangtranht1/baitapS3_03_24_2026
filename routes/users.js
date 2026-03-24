var express = require("express");
var router = express.Router();
let { CreateUserValidator, validationResult } = require('../utils/validatorHandler')
let userModel = require("../schemas/users");
let roleModel = require("../schemas/roles");
let userController = require('../controllers/users')
let { CheckLogin, CheckRole } = require('../utils/authHandler')
let { sendPasswordMail } = require('../utils/mailHandler')
let crypto = require('crypto')

// Helper: random password 16 ký tự
function generatePassword(length = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

// Danh sách users cần import
const usersToImport = Array.from({ length: 99 }, (_, i) => {
  const num = String(i + 1).padStart(2, '0');
  return { username: `user${num}`, email: `user${num}@haha.com` };
});


router.get("/", CheckLogin, CheckRole("ADMIN", "MODERATOR"), async function (req, res, next) {
  let users = await userModel
    .find({ isDeleted: false })
    .populate({
      path: 'role',
      select: 'name'
    })
  res.send(users);
});

router.get("/:id",CheckLogin,CheckRole("ADMIN"), async function (req, res, next) {
  try {
    let result = await userModel
      .find({ _id: req.params.id, isDeleted: false })
    if (result.length > 0) {
      res.send(result);
    }
    else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

router.post("/", CreateUserValidator, validationResult, async function (req, res, next) {
  try {
    let newItem = await userController.CreateAnUser(
      req.body.username, req.body.password, req.body.email, req.body.role
    )
    res.send(newItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.put("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await
      userModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedItem) return res.status(404).send({ message: "id not found" });

    let populated = await userModel
      .findById(updatedItem._id)
    res.send(populated);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// ──────────────────────────────────────────────────────
// POST /api/v1/users/import
// Import hàng loạt users, random password, gửi email
// ──────────────────────────────────────────────────────
router.post("/import", async function (req, res, next) {
  try {
    // Tìm hoặc tạo role "user"
    let userRole = await roleModel.findOne({ name: "user" });
    if (!userRole) {
      userRole = await roleModel.create({ name: "user", description: "Standard user role" });
    }

    let results = [];

    for (const u of usersToImport) {
      try {
        // Bỏ qua nếu đã tồn tại
        const existing = await userModel.findOne({
          $or: [{ username: u.username }, { email: u.email }]
        });
        if (existing) {
          results.push({ username: u.username, email: u.email, status: "skipped" });
          continue;
        }

        const plainPassword = generatePassword(16);

        const newUser = new userModel({
          username: u.username,
          email: u.email,
          password: plainPassword,
          role: userRole._id,
          status: true
        });
        await newUser.save();

        // Gửi email
        let mailStatus = "sent";
        try {
          await sendPasswordMail(u.email, u.username, plainPassword);
        } catch (mailErr) {
          mailStatus = "mail_failed: " + mailErr.message;
        }

        results.push({
          username: u.username,
          email: u.email,
          password: plainPassword,
          status: "created",
          mail: mailStatus
        });
      } catch (err) {
        results.push({ username: u.username, email: u.email, status: "error: " + err.message });
      }
    }

    const created = results.filter(r => r.status === "created").length;
    const skipped = results.filter(r => r.status === "skipped").length;
    const errors  = results.filter(r => r.status.startsWith("error")).length;

    res.send({
      summary: { total: usersToImport.length, created, skipped, errors },
      results
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

module.exports = router;
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");
const { authenticateToken, authorizeRole } = require("./middleware");
const SECRET_KEY = "1234";
// server.js
const path = require("path");
const app = express();
const PORT = 3000;

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cors());

// Define routes for each file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "registration.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/user", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "userprofile.html"));
});

app.get("/editprofile", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "editprofile.html"));
});
// Register a new user (public route)
app.post("/api/register", async (req, res) => {
  const { email, password, role } = req.body;

  // Hash the password before storing
  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (email, password, role) VALUES (?, ?, ?)`,
    [email, hashedPassword, role],
    function (err) {
      if (err) {
        return res.status(400).json({ error: "User already exists" });
      }
      res.status(201).json({ message: "User registered successfully" });
    }
  );
});

// Login a user (public route)
app.post("/api/auth/login", (req, res) => {


  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {

    console.log(user)
    
    console.log(err)
    if (err || !user)
      return res.status(400).json({ error: "Invalid credentials" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ error: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, {
      expiresIn: "1h",
    });
    res.status(200).json({ accessToken: token, user: user, login: true });
  });
});

// Edit user profile (only accessible by the user or admin)
app.put("/api/users/:id/edit-profile/", (req, res) => {
  const { email, password } = req.body;
  const userId = req.params.id;

  const updateFields = [];
  const params = [];

  if (email) {
    updateFields.push("email = ?");
    params.push(email);
  }

  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    updateFields.push("password = ?");
    params.push(hashedPassword);
  }

  if (updateFields.length === 0)
    return res.status(400).json({ error: "No fields to update" });

  params.push(userId);

  db.run(
    `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
    params,
    function (err) {
      if (err) return res.status(500).json({ error: "Database error" });
      res
        .status(200)
        .json({ message: "Profile updated successfully", updated: true });
    }
  );
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

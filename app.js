const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 3000;
const dataFile = path.join(__dirname, "data", "students.json");
const usersFile = path.join(__dirname, "data", "users.json");
const jwtSecret = process.env.JWT_SECRET || "webdim-secret-key";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.static(path.join(__dirname, "public")));

function ensureDataFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]", "utf8");
  }
}

function readJsonFile(filePath) {
  ensureDataFile(filePath);
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function writeJsonFile(filePath, data) {
  ensureDataFile(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function readStudents() {
  return readJsonFile(dataFile);
}

function writeStudents(students) {
  writeJsonFile(dataFile, students);
}

function readUsers() {
  return readJsonFile(usersFile);
}

function writeUsers(users) {
  writeJsonFile(usersFile, users);
}

function generateToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: "2h" });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    return null;
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.user = payload;
  next();
}

const authMiddleware = authenticateToken;

function normalizeStudent(payload) {
  return {
    nama: payload?.nama?.trim() || "",
    nim: payload?.nim?.trim() || "",
    jurusan: payload?.jurusan?.trim() || "",
  };
}

app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username dan password wajib diisi" });
  }

  const users = readUsers();
  const exists = users.some(
    (user) => user.username.toLowerCase() === username.toLowerCase(),
  );
  if (exists) {
    return res.status(400).json({ message: "Username sudah terdaftar" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now().toString(),
    username,
    passwordHash,
  };
  users.push(newUser);
  writeUsers(users);
  // default role for registered users
  newUser.role = newUser.role || "viewer";
  const token = generateToken({
    id: newUser.id,
    username: newUser.username,
    role: newUser.role,
  });
  res.status(201).json({ token, username: newUser.username });
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username dan password wajib diisi" });
  }

  const users = readUsers();
  const user = users.find(
    (item) => item.username.toLowerCase() === username.toLowerCase(),
  );
  if (!user) {
    return res
      .status(401)
      .json({ message: "Nama pengguna atau password salah" });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res
      .status(401)
      .json({ message: "Nama pengguna atau password salah" });
  }

  const token = generateToken({
    id: user.id,
    username: user.username,
    role: user.role || "viewer",
  });
  res.json({ token, username: user.username });
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
});

// Modul15: User management routes (admin-only)
const userRouter = require("./routes/user.routes");
app.use("/api/users", userRouter);

app.get("/", (req, res) => {
  const students = readStudents();
  res.render("index", { students, title: "CRUD Mahasiswa" });
});

app.get("/students/new", (req, res) => {
  res.render("form", { student: null, title: "Tambah Mahasiswa" });
});

app.post("/students", (req, res) => {
  const students = readStudents();
  const newStudent = {
    id: Date.now().toString(),
    ...normalizeStudent(req.body),
  };
  students.push(newStudent);
  writeStudents(students);
  res.redirect("/");
});

app.get("/students/:id/edit", (req, res) => {
  const students = readStudents();
  const student = students.find((item) => item.id === req.params.id);

  if (!student) {
    return res.status(404).send("Mahasiswa tidak ditemukan");
  }

  res.render("form", { student, title: "Edit Mahasiswa" });
});

app.post("/students/:id/update", (req, res) => {
  const students = readStudents();
  const student = students.find((item) => item.id === req.params.id);

  if (!student) {
    return res.status(404).send("Mahasiswa tidak ditemukan");
  }

  Object.assign(student, normalizeStudent(req.body));
  writeStudents(students);
  res.redirect("/");
});

app.post("/students/:id/delete", (req, res) => {
  const students = readStudents().filter((item) => item.id !== req.params.id);
  writeStudents(students);
  res.redirect("/");
});

app.get("/api/students", authMiddleware, (req, res) => {
  const search = req.query.search?.toString().trim().toLowerCase() || "";
  const students = readStudents();

  if (!search) {
    return res.json(students);
  }

  const filteredStudents = students.filter((student) => {
    const haystack = [student.nama, student.nim, student.jurusan]
      .join(" ")
      .toLowerCase();
    return haystack.includes(search);
  });

  res.json(filteredStudents);
});

app.get("/api/students/:id", authMiddleware, (req, res) => {
  const student = readStudents().find((item) => item.id === req.params.id);

  if (!student) {
    return res.status(404).json({ message: "Mahasiswa tidak ditemukan" });
  }

  res.json(student);
});

app.post("/api/students", authMiddleware, (req, res) => {
  const { nama, nim, jurusan } = normalizeStudent(req.body);

  if (!nama || !nim || !jurusan) {
    return res
      .status(400)
      .json({ message: "Nama, NIM, dan jurusan wajib diisi" });
  }

  const students = readStudents();
  const newStudent = {
    id: Date.now().toString(),
    nama,
    nim,
    jurusan,
  };
  students.push(newStudent);
  writeStudents(students);
  res.status(201).json(newStudent);
});

app.put("/api/students/:id", authenticateToken, (req, res) => {
  const students = readStudents();
  const student = students.find((item) => item.id === req.params.id);

  if (!student) {
    return res.status(404).json({ message: "Mahasiswa tidak ditemukan" });
  }

  Object.assign(student, normalizeStudent(req.body));
  writeStudents(students);
  res.json(student);
});

app.delete("/api/students/:id", authenticateToken, (req, res) => {
  const students = readStudents().filter((item) => item.id !== req.params.id);
  writeStudents(students);
  res.status(204).send();
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
  });
}

module.exports = app;

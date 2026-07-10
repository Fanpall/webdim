const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const usersFile = path.join(__dirname, '..', '..', 'data', 'users.json');

function ensureDataFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf8');
  }
}

function readJsonFile(filePath) {
  ensureDataFile(filePath);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw || '[]');
}

function writeJsonFile(filePath, data) {
  ensureDataFile(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function sanitizeUserForList(user) {
  return {
    id: user.id,
    name: user.name || user.username || '',
    email: user.email || '',
    role: user.role || 'viewer',
    created_at: user.created_at || null,
  };
}

exports.getAllUsers = (req, res) => {
  try {
    const users = readJsonFile(usersFile);
    const rows = users.map(sanitizeUserForList);
    res.json({ message: 'Data user berhasil diambil', data: rows });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Nama, email, password, dan role wajib diisi' });
    }

    const allowedRoles = ['admin', 'operator', 'viewer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Role tidak valid' });
    }

    const users = readJsonFile(usersFile);
    const exists = users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (exists) return res.status(400).json({ message: 'Email sudah digunakan' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      passwordHash: hashedPassword,
      role,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    writeJsonFile(usersFile, users);
    res.status(201).json({ message: 'User berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

exports.updateUser = (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    const users = readJsonFile(usersFile);
    const user = users.find(u => u.id === id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    writeJsonFile(usersFile, users);
    res.json({ message: 'User berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

exports.deleteUser = (req, res) => {
  try {
    const { id } = req.params;
    let users = readJsonFile(usersFile);
    const before = users.length;
    users = users.filter(u => u.id !== id);
    if (users.length === before) return res.status(404).json({ message: 'User tidak ditemukan' });
    writeJsonFile(usersFile, users);
    res.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

function generateTemporaryPassword() {
  return Math.random().toString(36).slice(-10);
}

exports.resetPasswordByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const users = readJsonFile(usersFile);
    const user = users.find(u => u.id === id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    user.passwordHash = hashedPassword;
    writeJsonFile(usersFile, users);

    res.json({ message: 'Password berhasil direset', temporaryPassword, note: 'Tampilkan hanya sekali, lalu minta user mengganti password.' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

function createToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
}

async function register(req, res) {
  const client = await pool.connect();

  try {
    const {
      username,
      email,
      password,
      full_name,
      preferred_language = "ar",
    } = req.body;

    await client.query("BEGIN");

    const existingUser = await client.query(
      `
      SELECT id
      FROM users
      WHERE username = $1 OR email = $2;
      `,
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userResult = await client.query(
      `
      INSERT INTO users (
        username,
        email,
        password_hash,
        full_name,
        preferred_language
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        username,
        email,
        full_name,
        preferred_language,
        status,
        created_at;
      `,
      [
        username.trim(),
        email.trim().toLowerCase(),
        passwordHash,
        full_name?.trim() || null,
        preferred_language,
      ]
    );

    const user = userResult.rows[0];

    const roleResult = await client.query(
      `
      SELECT id
      FROM roles
      WHERE code = 'USER';
      `
    );

    if (roleResult.rows.length === 0) {
      throw new Error("Default USER role does not exist");
    }

    await client.query(
      `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2);
      `,
      [user.id, roleResult.rows[0].id]
    );

    await client.query("COMMIT");

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      data: {
        ...user,
        roles: ["USER"],
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Registration error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "One or more values are invalid",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to register user",
    });
  } finally {
    client.release();
  }
}
async function login(req, res) {
  try {
    const { identifier, password } = req.body;

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.username,
        u.email,
        u.password_hash,
        u.full_name,
        u.preferred_language,
        u.status,
        u.created_at,
        COALESCE(
          array_agg(r.code) FILTER (WHERE r.code IS NOT NULL),
          ARRAY[]::varchar[]
        ) AS roles
      FROM users u
      LEFT JOIN user_roles ur
        ON ur.user_id = u.id
      LEFT JOIN roles r
        ON r.id = ur.role_id
      WHERE LOWER(u.username) = LOWER($1)
         OR LOWER(u.email) = LOWER($1)
      GROUP BY u.id;
      `,
      [identifier.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username, email, or password",
      });
    }

    const user = result.rows[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid username, email, or password",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "This account is not active",
      });
    }

    const token = createToken(user);

    delete user.password_hash;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: user,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to log in",
    });
  }
}
async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    data: req.user,
  });
}

module.exports = {
  register,
  login,
  getMe,
};
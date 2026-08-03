const jwt = require("jsonwebtoken");
const pool = require("../config/db");

async function optionalAuthenticate(req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization;

    if (
      !authorizationHeader ||
      !authorizationHeader.startsWith("Bearer ")
    ) {
      req.user = null;
      return next();
    }

    const token = authorizationHeader.split(" ")[1];

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token",
      });
    }

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.preferred_language,
        u.status,
        COALESCE(
          array_agg(r.code) FILTER (WHERE r.code IS NOT NULL),
          ARRAY[]::varchar[]
        ) AS roles
      FROM users u
      LEFT JOIN user_roles ur
        ON ur.user_id = u.id
      LEFT JOIN roles r
        ON r.id = ur.role_id
      WHERE u.id = $1
      GROUP BY u.id;
      `,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user no longer exists",
      });
    }

    const user = result.rows[0];

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "This account is not active",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Optional authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check authentication",
    });
  }
}

module.exports = optionalAuthenticate;
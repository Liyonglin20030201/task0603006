const { Router } = require('express');
const auth = require('../middleware/auth');
const db = require('../db/connection');

const router = Router();
router.use(auth);

router.get('/', (req, res, next) => {
  try {
    const q = req.query.q || '';
    if (q.length < 2) return res.json([]);

    const users = db.prepare(`
      SELECT id, email, username, display_name
      FROM users
      WHERE (email LIKE ? OR username LIKE ? OR display_name LIKE ?)
        AND id != ?
      LIMIT 10
    `).all(`%${q}%`, `%${q}%`, `%${q}%`, req.user.id);

    res.json(users);
  } catch (err) { next(err); }
});

module.exports = router;

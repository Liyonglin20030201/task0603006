const { Router } = require('express');
const auth = require('../middleware/auth');
const searchService = require('../services/searchService');

const router = Router();
router.use(auth);

router.get('/', (req, res, next) => {
  try {
    const results = searchService.search(req.user.id, req.query.q, {
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0
    });
    res.json(results);
  } catch (err) { next(err); }
});

module.exports = router;

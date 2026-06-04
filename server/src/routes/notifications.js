const { Router } = require('express');
const auth = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = Router();
router.use(auth);

router.get('/', (req, res, next) => {
  try {
    const result = notificationService.list(req.user.id, {
      unread: req.query.unread === 'true',
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    });
    res.json(result);
  } catch (err) { next(err); }
});

router.put('/:id/read', (req, res, next) => {
  try {
    notificationService.markRead(req.params.id, req.user.id);
    res.json({ message: 'Marked as read' });
  } catch (err) { next(err); }
});

router.put('/read-all', (req, res, next) => {
  try {
    notificationService.markAllRead(req.user.id);
    res.json({ message: 'All marked as read' });
  } catch (err) { next(err); }
});

router.delete('/:id', (req, res, next) => {
  try {
    notificationService.dismiss(req.params.id, req.user.id);
    res.json({ message: 'Dismissed' });
  } catch (err) { next(err); }
});

module.exports = router;

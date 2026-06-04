const { Router } = require('express');
const auth = require('../middleware/auth');
const versionService = require('../services/versionService');

const router = Router();
router.use(auth);

router.get('/:id/versions', (req, res, next) => {
  try {
    const versions = versionService.list(req.params.id, req.user.id);
    res.json(versions);
  } catch (err) { next(err); }
});

router.post('/:id/versions', (req, res, next) => {
  try {
    const version = versionService.create(req.params.id, req.user.id);
    res.status(201).json(version);
  } catch (err) { next(err); }
});

router.get('/:id/versions/:versionId', (req, res, next) => {
  try {
    const version = versionService.getVersion(req.params.id, req.params.versionId, req.user.id);
    res.json(version);
  } catch (err) { next(err); }
});

router.post('/:id/versions/:versionId/restore', (req, res, next) => {
  try {
    const result = versionService.restoreVersion(req.params.id, req.params.versionId, req.user.id);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;

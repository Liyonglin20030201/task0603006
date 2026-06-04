const { Router } = require('express');
const { z } = require('zod');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const authService = require('../services/authService');

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(100),
  displayName: z.string().min(1).max(50)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.validated);
    res.status(201).json(result);
  } catch (err) { next(err); }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.validated);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/refresh', validate(refreshSchema), (req, res, next) => {
  try {
    const result = authService.refresh(req.validated.refreshToken);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/me', auth, (req, res, next) => {
  try {
    const user = authService.getProfile(req.user.id);
    res.json(user);
  } catch (err) { next(err); }
});

router.put('/me', auth, async (req, res, next) => {
  try {
    const user = authService.updateProfile(req.user.id, req.body);
    res.json(user);
  } catch (err) { next(err); }
});

router.put('/password', auth, async (req, res, next) => {
  try {
    await authService.changePassword(req.user.id, req.body);
    res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
});

module.exports = router;

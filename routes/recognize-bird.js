import express from 'express';
import { recognizeBird } from '../birds/photo-ai-bridge.js';

const router = express.Router();

router.post('/api/recognize-bird', express.json({ limit: '12mb' }), async (req, res) => {
  try {
    const { image } = req.body || {};
    if (!image) return res.status(400).json({ error: '请求体缺少 image 字段' });
    res.json(await recognizeBird(image));
  } catch (error) {
    console.error('[bird-ai-route] request failed', { message: error.message });
    res.status(500).json({ error: error.message || '候鸟识别失败' });
  }
});

export default router;

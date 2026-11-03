import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.json({ status: 'ok', service: 'plain-language-layer-server' });
});

export default router;

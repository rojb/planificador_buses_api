const router = require('express').Router();
const { index, getLineasByMultipleCoordsSimple } = require('../controlllers/dijkstraController');


router.get('/dijkstra', index);
router.post('/lineas-multiple', getLineasByMultipleCoordsSimple);

module.exports = router;
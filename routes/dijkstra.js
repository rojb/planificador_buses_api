const router = require('express').Router();
const { index } = require('../controlllers/dijkstraController');


router.get('/dijkstra', index);

module.exports = router;
const express = require('express');
const router = express.Router();
const { createLink, getLinkMeta, verifyLocation, getUserLinks, deleteLink, updateLink } = require('../controllers/linkController');

router.post('/create', createLink);
router.get('/user-links', getUserLinks);
router.put('/links/:id', updateLink); // Update link
router.delete('/links/:id', deleteLink);
router.get('/links/:slug', getLinkMeta);
router.post('/verify/:slug', verifyLocation);

module.exports = router;

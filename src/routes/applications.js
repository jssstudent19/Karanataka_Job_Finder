const express = require('express');
const router = express.Router();

// Stub route - to be implemented
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Applications route - coming soon' });
});

module.exports = router;

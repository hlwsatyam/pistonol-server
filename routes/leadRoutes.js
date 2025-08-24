const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController.js');

router.post('/', leadController.createLead);
router.get('/', leadController.getUserLeads);
router.get('/analytics/:id', leadController.getLeadAnalytics);





router.get('/:id', leadController.getLeadById);
router.put('/:id', leadController.updateLead);
router.post('/:id/feedbacks', leadController.addFeedback);
router.put('/:leadId/feedbacks/:feedbackId', leadController.updateFeedback);













module.exports = router;
const { JobApplication } = require('../models');

exports.listApplications = async (req, res) => {
  try {
    const apps = await JobApplication.findAll({ where: { userId: req.user.id }, order: [['appliedAt', 'DESC']] });
    return res.json({ success: true, data: apps });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch applications' });
  }
};

exports.createApplication = async (req, res) => {
  try {
    const { jobTitle, company, location, sourceUrl, status = 'applied', notes, appliedAt } = req.body;
    if (!jobTitle || !company) {
      return res.status(400).json({ success: false, error: 'jobTitle and company are required' });
    }
    const app = await JobApplication.create({
      userId: req.user.id,
      jobTitle,
      company,
      location,
      sourceUrl,
      status,
      notes,
      appliedAt: appliedAt ? new Date(appliedAt) : new Date()
    });
    return res.status(201).json({ success: true, data: app });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to create application' });
  }
};

exports.updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await JobApplication.findOne({ where: { id, userId: req.user.id } });
    if (!app) return res.status(404).json({ success: false, error: 'Application not found' });

    const { jobTitle, company, location, sourceUrl, status, notes, appliedAt } = req.body;
    if (jobTitle !== undefined) app.jobTitle = jobTitle;
    if (company !== undefined) app.company = company;
    if (location !== undefined) app.location = location;
    if (sourceUrl !== undefined) app.sourceUrl = sourceUrl;
    if (status !== undefined) app.status = status;
    if (notes !== undefined) app.notes = notes;
    if (appliedAt !== undefined) app.appliedAt = new Date(appliedAt);
    await app.save();
    return res.json({ success: true, data: app });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to update application' });
  }
};

exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const count = await JobApplication.destroy({ where: { id, userId: req.user.id } });
    if (!count) return res.status(404).json({ success: false, error: 'Application not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to delete application' });
  }
};






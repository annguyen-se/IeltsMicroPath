const dashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../utils/apiResponse');

const getDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardData(req.user._id);
    return sendSuccess(res, 200, data, 'Dashboard metrics retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard
};

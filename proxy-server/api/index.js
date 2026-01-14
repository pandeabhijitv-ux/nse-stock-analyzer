// Root endpoint for Vercel serverless function
module.exports = async (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'Stock Analyzer Backend',
    version: '2.0.0',
    endpoints: [
      '/api/health',
      '/api/analysis',
      '/api/commodities',
      '/api/top-options-cached',
      '/api/trigger',
      '/api/cron/analyze-stocks'
    ]
  });
};

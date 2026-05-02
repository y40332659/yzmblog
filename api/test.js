const { connectToDatabase } = require('../db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    await connectToDatabase();
    res.json({ 
      status: 'success', 
      message: 'MongoDB 数据库连接成功！',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'MongoDB 连接失败',
      error: error.message 
    });
  }
};
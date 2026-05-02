module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const dir = __dirname;
    const files = fs.readdirSync(dir);
    
    res.json({ 
      status: 'success', 
      message: 'API 正常工作',
      dir,
      files,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: '错误',
      error: error.message,
      stack: error.stack
    });
  }
};
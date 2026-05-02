const { register, login, getUser, getAllUsers, deleteUser } = require('../controllers/authController');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method === 'POST' && req.body && typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      res.status(400).json({ message: 'JSON 解析错误' });
      return;
    }
  }
  
  const { method } = req;
  
  try {
    switch (method) {
      case 'POST':
        if (req.body.action === 'register') {
          await register(req, res);
        } else if (req.body.action === 'login') {
          await login(req, res);
        } else {
          res.status(400).json({ message: '无效的操作' });
        }
        break;
        
      case 'GET':
        if (req.query.all === 'true') {
          await getAllUsers(req, res);
        } else {
          await getUser(req, res);
        }
        break;
        
      case 'DELETE':
        await deleteUser(req, res);
        break;
        
      default:
        res.status(405).json({ message: '不支持的方法' });
    }
  } catch (error) {
    console.error('Auth API 错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};
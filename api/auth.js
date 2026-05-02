// 简化版用户认证 - 使用内存存储（仅用于测试）

let users = [];
let nextUserId = 1;

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

function generateToken(userId) {
  return `token-${userId}-${Date.now()}`;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 解析 JSON
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
          const { username, email, password } = req.body;
          
          if (users.some(u => u.email === email)) {
            res.status(400).json({ message: '用户已存在' });
            return;
          }
          
          const newUser = {
            id: nextUserId++,
            username,
            email,
            password,
            createdAt: new Date().toISOString()
          };
          
          users.push(newUser);
          const token = generateToken(newUser.id);
          
          res.status(201).json({
            message: '注册成功',
            user: { id: newUser.id, username, email, createdAt: newUser.createdAt },
            token
          });
        } else if (req.body.action === 'login') {
          const { email, password } = req.body;
          const user = users.find(u => u.email === email && u.password === password);
          
          if (!user) {
            res.status(401).json({ message: '邮箱或密码错误' });
            return;
          }
          
          const token = generateToken(user.id);
          res.json({
            message: '登录成功',
            user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt },
            token
          });
        }
        break;
        
      case 'GET':
        res.json({ message: 'GET 请求成功', usersCount: users.length });
        break;
        
      default:
        res.status(405).json({ message: '不支持的方法' });
    }
  } catch (error) {
    console.error('错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};
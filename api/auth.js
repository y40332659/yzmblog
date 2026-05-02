const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

let User;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI 环境变量未设置');
  }

  try {
    const client = await mongoose.connect(MONGODB_URI);
    cachedDb = client.connection;
    User = mongoose.model('User', userSchema);
    console.log('✅ 数据库连接成功');
    return cachedDb;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    throw error;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = '7d';

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
    await connectToDatabase();
    
    switch (method) {
      case 'POST':
        if (req.body.action === 'register') {
          const { username, email, password } = req.body;
          
          const existingUser = await User.findOne({
            $or: [{ email }, { username }]
          });
          
          if (existingUser) {
            return res.status(400).json({ message: '用户已存在' });
          }
          
          const hashedPassword = await bcrypt.hash(password, 12);
          
          const user = new User({
            username,
            email,
            password: hashedPassword
          });
          
          await user.save();
          
          const token = jwt.sign(
            { id: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );
          
          res.status(201).json({
            message: '注册成功',
            user: {
              id: user._id,
              username: user.username,
              email: user.email,
              createdAt: user.createdAt
            },
            token
          });
        } else if (req.body.action === 'login') {
          const { email, password } = req.body;
          
          const user = await User.findOne({ email });
          
          if (!user) {
            return res.status(401).json({ message: '邮箱或密码错误' });
          }
          
          const isPasswordValid = await bcrypt.compare(password, user.password);
          
          if (!isPasswordValid) {
            return res.status(401).json({ message: '邮箱或密码错误' });
          }
          
          const token = jwt.sign(
            { id: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );
          
          res.json({
            message: '登录成功',
            user: {
              id: user._id,
              username: user.username,
              email: user.email,
              createdAt: user.createdAt
            },
            token
          });
        } else {
          res.status(400).json({ message: '无效的操作' });
        }
        break;
        
      case 'GET':
        if (req.query.all === 'true') {
          const users = await User.find().select('-password').sort({ createdAt: -1 });
          res.json(users);
        } else {
          const token = req.headers.authorization?.split(' ')[1];
          
          if (!token) {
            return res.status(401).json({ message: '未授权' });
          }
          
          const decoded = jwt.verify(token, JWT_SECRET);
          const user = await User.findById(decoded.id).select('-password');
          
          if (!user) {
            return res.status(404).json({ message: '用户不存在' });
          }
          
          res.json(user);
        }
        break;
        
      case 'DELETE':
        const { id } = req.query;
        await User.findByIdAndDelete(id);
        res.json({ message: '删除成功' });
        break;
        
      default:
        res.status(405).json({ message: '不支持的方法' });
    }
  } catch (error) {
    console.error('Auth API 错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};
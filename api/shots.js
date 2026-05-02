const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const shotSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  images: { type: [String], default: [] },
  category: { type: String, default: 'web' },
  tags: { type: [String], default: [] },
  author: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  likes: { type: Number, default: 0 },
  likedBy: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  views: { type: Number, default: 0 },
  comments: { type: [{
    userId: mongoose.Schema.Types.ObjectId,
    userName: String,
    content: String,
    rating: Number,
    createdAt: { type: Date, default: Date.now }
  }], default: [] },
  createdAt: { type: Date, default: Date.now }
});

let User, Shot;
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
    Shot = mongoose.model('Shot', shotSchema);
    console.log('✅ 数据库连接成功');
    return cachedDb;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    throw error;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if ((req.method === 'POST' || req.method === 'PUT') && req.body && typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      res.status(400).json({ message: 'JSON 解析错误' });
      return;
    }
  }
  
  const { method } = req;
  const { id } = req.query;
  
  try {
    await connectToDatabase();
    
    switch (method) {
      case 'GET':
        if (id) {
          const shot = await Shot.findById(id);
          
          if (!shot) {
            return res.status(404).json({ message: '作品不存在' });
          }
          
          shot.views += 1;
          await shot.save();
          
          res.json(shot);
        } else if (req.query.userId) {
          const shots = await Shot.find({ authorId: req.query.userId }).sort({ createdAt: -1 });
          res.json(shots);
        } else {
          const shots = await Shot.find().sort({ createdAt: -1 });
          res.json(shots);
        }
        break;
        
      case 'POST':
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return res.status(401).json({ message: '未授权' });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
          return res.status(401).json({ message: '用户不存在' });
        }
        
        const { title, description, image, images, category, tags } = req.body;
        
        const shot = new Shot({
          title,
          description,
          image: images && images.length > 0 ? images[0] : image,
          images: images || [image],
          category: category || 'web',
          tags: tags || [],
          author: user.username,
          authorId: user._id
        });
        
        await shot.save();
        
        res.status(201).json({
          message: '作品创建成功',
          shot
        });
        break;
        
      case 'PUT':
        if (!id) {
          return res.status(400).json({ message: '缺少作品ID' });
        }
        
        if (req.body.action === 'like') {
          const likeToken = req.headers.authorization?.split(' ')[1];
          
          if (!likeToken) {
            return res.status(401).json({ message: '未授权' });
          }
          
          const likeDecoded = jwt.verify(likeToken, JWT_SECRET);
          const likeShot = await Shot.findById(id);
          
          if (!likeShot) {
            return res.status(404).json({ message: '作品不存在' });
          }
          
          const userId = likeDecoded.id;
          
          if (likeShot.likedBy.includes(userId)) {
            likeShot.likedBy = likeShot.likedBy.filter(id => id.toString() !== userId);
            likeShot.likes -= 1;
          } else {
            likeShot.likedBy.push(userId);
            likeShot.likes += 1;
          }
          
          await likeShot.save();
          
          res.json({ message: '操作成功', shot: likeShot });
        } else if (req.body.action === 'comment') {
          const commentToken = req.headers.authorization?.split(' ')[1];
          
          if (!commentToken) {
            return res.status(401).json({ message: '未授权' });
          }
          
          const commentDecoded = jwt.verify(commentToken, JWT_SECRET);
          const commentUser = await User.findById(commentDecoded.id);
          
          if (!commentUser) {
            return res.status(401).json({ message: '用户不存在' });
          }
          
          const commentShot = await Shot.findById(id);
          
          if (!commentShot) {
            return res.status(404).json({ message: '作品不存在' });
          }
          
          const { content, rating } = req.body;
          
          commentShot.comments.push({
            userId: commentUser._id,
            userName: commentUser.username,
            content,
            rating: rating || 4,
            createdAt: new Date()
          });
          
          await commentShot.save();
          
          res.json({ message: '评论成功', shot: commentShot });
        } else {
          const updateToken = req.headers.authorization?.split(' ')[1];
          
          if (!updateToken) {
            return res.status(401).json({ message: '未授权' });
          }
          
          const updateDecoded = jwt.verify(updateToken, JWT_SECRET);
          const updateShot = await Shot.findById(id);
          
          if (!updateShot) {
            return res.status(404).json({ message: '作品不存在' });
          }
          
          if (updateShot.authorId.toString() !== updateDecoded.id) {
            return res.status(403).json({ message: '无权修改此作品' });
          }
          
          const { title: updateTitle, description: updateDesc, category: updateCat, tags: updateTags } = req.body;
          
          updateShot.title = updateTitle || updateShot.title;
          updateShot.description = updateDesc || updateShot.description;
          updateShot.category = updateCat || updateShot.category;
          updateShot.tags = updateTags || updateShot.tags;
          
          await updateShot.save();
          
          res.json({ message: '更新成功', shot: updateShot });
        }
        break;
        
      case 'DELETE':
        if (!id) {
          return res.status(400).json({ message: '缺少作品ID' });
        }
        await Shot.findByIdAndDelete(id);
        res.json({ message: '删除成功' });
        break;
        
      default:
        res.status(405).json({ message: '不支持的方法' });
    }
  } catch (error) {
    console.error('Shot API 错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};
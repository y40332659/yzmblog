// 简化版作品管理 - 使用内存存储（仅用于测试）

let shots = [];
let nextShotId = 1;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 解析 JSON
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
    switch (method) {
      case 'GET':
        if (id) {
          const shot = shots.find(s => s.id == id);
          if (!shot) {
            res.status(404).json({ message: '作品不存在' });
            return;
          }
          shot.views = (shot.views || 0) + 1;
          res.json(shot);
        } else if (req.query.userId) {
          const userShots = shots.filter(s => s.authorId == req.query.userId);
          res.json(userShots);
        } else {
          res.json(shots);
        }
        break;
        
      case 'POST':
        const { title, description, image, category, tags } = req.body;
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
          res.status(401).json({ message: '未授权' });
          return;
        }
        
        // 从 token 提取用户信息
        const userId = parseInt(token.split('-')[1]);
        
        const newShot = {
          id: nextShotId++,
          title,
          description: description || '',
          image,
          category: category || 'web',
          tags: tags || [],
          author: `用户${userId}`,
          authorId: userId,
          likes: 0,
          likedBy: [],
          views: 0,
          comments: [],
          createdAt: new Date().toISOString()
        };
        
        shots.unshift(newShot);
        res.status(201).json({ message: '作品创建成功', shot: newShot });
        break;
        
      case 'PUT':
        if (!id) {
          res.status(400).json({ message: '缺少作品ID' });
          return;
        }
        
        const shotIndex = shots.findIndex(s => s.id == id);
        if (shotIndex === -1) {
          res.status(404).json({ message: '作品不存在' });
          return;
        }
        
        const tokenPut = req.headers.authorization?.split(' ')[1];
        if (!tokenPut) {
          res.status(401).json({ message: '未授权' });
          return;
        }
        
        const currentUserId = parseInt(tokenPut.split('-')[1]);
        
        if (req.body.action === 'like') {
          if (shots[shotIndex].likedBy.includes(currentUserId)) {
            shots[shotIndex].likedBy = shots[shotIndex].likedBy.filter(id => id !== currentUserId);
            shots[shotIndex].likes--;
          } else {
            shots[shotIndex].likedBy.push(currentUserId);
            shots[shotIndex].likes++;
          }
          res.json({ message: '操作成功', shot: shots[shotIndex] });
        } else if (req.body.action === 'comment') {
          shots[shotIndex].comments.push({
            userId: currentUserId,
            userName: `用户${currentUserId}`,
            content: req.body.content,
            rating: req.body.rating || 4,
            createdAt: new Date().toISOString()
          });
          res.json({ message: '评论成功', shot: shots[shotIndex] });
        } else {
          res.json({ message: '更新成功' });
        }
        break;
        
      case 'DELETE':
        if (!id) {
          res.status(400).json({ message: '缺少作品ID' });
          return;
        }
        shots = shots.filter(s => s.id != id);
        res.json({ message: '删除成功' });
        break;
        
      default:
        res.status(405).json({ message: '不支持的方法' });
    }
  } catch (error) {
    console.error('错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};
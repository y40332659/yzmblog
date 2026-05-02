const { getAllShots, getShot, createShot, updateShot, deleteShot, likeShot, addComment, getUserShots } = require('../controllers/shotController');

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
    switch (method) {
      case 'GET':
        if (id) {
          req.params = { id };
          await getShot(req, res);
        } else if (req.query.userId) {
          req.params = { userId: req.query.userId };
          await getUserShots(req, res);
        } else {
          await getAllShots(req, res);
        }
        break;
        
      case 'POST':
        await createShot(req, res);
        break;
        
      case 'PUT':
        if (!id) {
          return res.status(400).json({ message: '缺少作品ID' });
        }
        req.params = { id };
        
        if (req.body.action === 'like') {
          await likeShot(req, res);
        } else if (req.body.action === 'comment') {
          await addComment(req, res);
        } else {
          await updateShot(req, res);
        }
        break;
        
      case 'DELETE':
        if (!id) {
          return res.status(400).json({ message: '缺少作品ID' });
        }
        req.params = { id };
        await deleteShot(req, res);
        break;
        
      default:
        res.status(405).json({ message: '不支持的方法' });
    }
  } catch (error) {
    console.error('Shot API 错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};
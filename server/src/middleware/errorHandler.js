export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.name === 'MongoServerError' && err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate entry' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
};

export const notFound = (req, res) => {
  res.status(404).json({ error: 'Route not found' });
};
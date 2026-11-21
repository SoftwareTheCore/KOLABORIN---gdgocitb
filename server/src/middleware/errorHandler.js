function errorHandler(err, req, res, next) {
  console.error(err);

  // MySQL duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Data already exists or duplicate entry.' });
  }

  const status = err.status || 500;
  if (status >= 500) {
    return res.status(status).json({ error: 'Internal server error' });
  }
  res.status(status).json({
    error: err.message || 'Internal server error'
  });
}

module.exports = errorHandler;

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { generalLimiter } = require('./middleware/rateLimit');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(generalLimiter);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'RMS System API' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

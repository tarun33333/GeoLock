const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const linkRoutes = require('./routes/linkRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// Database Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/geolock');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

connectDB();

// Routes
app.use('/api', linkRoutes);
app.use('/api/subscribe', paymentRoutes);
app.use('/api/auth', authRoutes);

// Error Handling Middleware for 413 Payload Too Large
app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'File size too large. Please upload an image smaller than 1MB.' });
    }
    next(err);
});

app.get('/', (req, res) => {
    res.send('GeoLock API is running...');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const app = express();
const path = require('path');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.get('/', (req, res) => res.render('index'));
app.use((err, req, res, next) => { console.error('Error:', err.message); res.send('Error'); });
app.listen(5001, () => console.log('Test running on 5001'));

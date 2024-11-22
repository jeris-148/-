// app.js

const express = require('express');
const bodyParser = require('body-parser');
const connection = require('./db');

const app = express();

// הגדרת נתיב שמחזיר את הנתונים מהטבלה למסך בדפדפן
app.get('/data', (req, res) => {
  connection.query('jeris.project', (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('Error fetching data');
    } else {
      res.json(results); // שליחת הנתונים כ-JSON ל-Frontend
    }  
  });
});

// הפעלת השרת על פורט 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
// db.js
const mysql = require('mysql2');

// הגדרת החיבור למסד הנתונים
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'jeris'
});

// בדיקת החיבור
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
}
console.log('Connected to the database.');
});

     module.exports = connection;

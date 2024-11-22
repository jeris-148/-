const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const session = require('express-session');
app.use(session({
    secret: 'your-secret-key',  // מפתח סודי לשימוש ב-session
    resave: false,
    saveUninitialized: true
}));
// משרת קבצים סטטיים מהתיקייה הנוכחית
app.use(express.static(__dirname));


// חיבור למסד נתונים 
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'jeris'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1); // סיום התהליך במקרה של שגיאה
    }
    console.log('Connected to the database.');
});

// נתיב שמטפל בשורש ומציג את דף ה-Login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Login.html'));
});

// טיפול בבקשות Login
app.post('/db.js', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;

    const query = 'SELECT * FROM project WHERE username = ? AND password = ? AND email = ?';
    connection.query(query, [username, password, email], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            // אם ההתחברות מוצלחת, נשמור את שם המשתמש ב-session
            req.session.username = username;
            console.log('Login OK');
            res.redirect('/index.html'); // הפניה לדף index1.html
        } else {
            console.log('Login failed');
            res.send('Invalid username, password, or email.');
        }
    });
});



app.post('/auth/register', (req, res) => {
   
        const { firstName, lastName, username, email, password } = req.body;
    
        // בדיקת קיום שם המשתמש
        const checkUserQuery = 'SELECT * FROM project WHERE username = ?';
        connection.query(checkUserQuery, [username], (err, results) => {
            if (err) {
                console.error('Error checking username:', err);
                return res.send('Error checking username');
            }
    
            if (results.length > 0) {
                // שם המשתמש כבר קיים
                return res.send('Username already exists');
            } else {
                // אם שם המשתמש לא קיים, מבצעים את הרישום
                const query = 'INSERT INTO project (firstName, lastName, username, email, password) VALUES (?, ?, ?, ?, ?)';
                connection.query(query, [firstName, lastName, username, email, password], (err, result) => {
                    if (err) {
                        console.error('Error registering user:', err);
                        return res.send('Error registering user');
                    }
    
                    // אם הרישום הצליח, נשמור את שם המשתמש ב-session
                    req.session.username = username;
                    res.redirect('/index.html'); // מפנה את המשתמש ל-index1.html
                });
            }
        });
    });
    
    app.get('/get-username', (req, res) => {
        if (req.session.username) {
            res.json({ username: req.session.username });
        } else {
            res.json({ username: req.session.username });
        }
    });

      
    app.post('/contact', (req, res) => {
        const { name, phone, message } = req.body;
    
        // הכנת שאילתת SQL להוספת המידע למסד הנתונים
        const query = 'INSERT INTO contact_data (name, phone, message) VALUES (?, ?, ?)';
        connection.query(query, [name, phone, message], (err, result) => {
            if (err) {
                console.error('Error inserting data:', err);
                return res.status(500).send('Error saving your information.');
            }
    
            res.send('Thank you for contacting us! We will get back to you soon.');
        });
    });
    app.post('/feedback', (req, res) => {
        const { name, rating, message } = req.body;
    
        if (!name || !rating || !message) {
            return res.status(400).send('All fields are required.');
        }
    
        const sqlInsert = 'INSERT INTO feedback (name, rating, message) VALUES (?, ?, ?)';
        connection.query(sqlInsert, [name, rating, message], (err) => {
            if (err) {
                console.error('Error saving feedback:', err);
                return res.status(500).send('Error saving feedback.');
            }
    
            // לאחר הכנסת הפידבק, שליפת כל הפידבקים
            const sqlSelect = 'SELECT * FROM feedback ORDER BY created_at DESC';
            connection.query(sqlSelect, (err, results) => {
                if (err) {
                    console.error('Error fetching feedbacks:', err);
                    return res.status(500).send('Error fetching feedbacks.');
                }
    
                // החזרת כל הפידבקים כתגובה
                res.json(results);
            });
        });
    });
    
    
    app.get('/feedbacks', (req, res) => {
        const sql = 'SELECT * FROM feedback ORDER BY created_at DESC'; // שליפה לפי תאריך יצירה
        connection.query(sql, (err, results) => {
            if (err) {
                console.error('Error fetching feedbacks:', err);
                return res.status(500).send('Error fetching feedbacks.');
            }
            res.json(results); // החזרת הפידבקים בפורמט JSON
        });
    });
    
    app.listen(3000, () => {
        console.log('Server is running on port 3000');
        });     
    

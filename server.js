const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const methodOverride = require('method-override');

app.use(methodOverride('_method'));
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
            res.redirect('/index.html'); // הפניה לדף index.html
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
        const { rating, message } = req.body; // קבלת הדירוג וההודעה מהטופס
        const username = req.session.username; // קבלת שם המשתמש מתוך ה-Session
    
        // בדיקה אם כל השדות נמסרו
        if (!username || !rating || !message) {
            return res.status(400).send('All fields are required.');
        }
    
        // הוספת הפידבק למסד הנתונים
        const sqlInsert = 'INSERT INTO feedback (username, rating, message) VALUES (?, ?, ?)';
        connection.query(sqlInsert, [username, rating, message], (err) => {
            if (err) {
                console.error('Error saving feedback:', err);
                return res.status(500).send('Error saving feedback.');
            }
    
            // שליפת כל הפידבקים לאחר הכנסת הפידבק החדש
            const sqlSelect = 'SELECT * FROM feedback ORDER BY created_at DESC';
            connection.query(sqlSelect, (err, results) => {
                if (err) {
                    console.error('Error fetching feedbacks:', err);
                    return res.status(500).send('Error fetching feedbacks.');
                }
    
                // שליחה של הפידבקים לעמוד EJS
                res.render('feedback.ejs', { feedbacks: results, username }); // הוספת username ל-EJS
            });
        });
    });
    

    app.post('/feedback/:id/reply', (req, res) => {
        const feedbackId = req.params.id; // מזהה הפידבק
        const { username, message } = req.body;
    
        if (!username || !message) {
            return res.status(400).send('Name and message are required.');
        }
    
        const sql = 'INSERT INTO replies (feedback_id, username, message) VALUES (?, ?, ?)';
        connection.query(sql, [feedbackId, username, message], (err) => {
            if (err) {
                console.error('Error saving reply:', err);
                return res.status(500).send('Error saving reply.');
            }
    
            res.redirect('/feedbacks'); // חזרה לעמוד הפידבקים
        });
    });

    app.get('/feedbacks', (req, res) => {
    const feedbackSql = 'SELECT * FROM feedback ORDER BY created_at DESC';
    const replySql = 'SELECT * FROM replies ORDER BY created_at ASC';

    connection.query(feedbackSql, (err, feedbacks) => {
        if (err) {
            console.error('Error fetching feedbacks:', err);
            return res.status(500).send('Error fetching feedbacks.');
        }

        connection.query(replySql, (err, replies) => {
            if (err) {
                console.error('Error fetching replies:', err);
                return res.status(500).send('Error fetching replies.');
            }

            // סידור התגובות לפי פידבקים
            const feedbackWithReplies = feedbacks.map((feedback) => {
                feedback.replies = replies.filter(reply => reply.feedback_id === feedback.id);
                return feedback;
            });

            res.render('feedback', { feedbacks: feedbackWithReplies, username: req.session.username });
        });
    });
});

app.get('/feedbacks', (req, res) => {
    const sqlSelect = 'SELECT * FROM feedback ORDER BY created_at DESC';
    connection.query(sqlSelect, (err, feedbacks) => {
        if (err) {
            console.error('Error fetching feedbacks:', err);
            return res.status(500).send('Error fetching feedbacks.');
        }

        // העברת נתונים לתבנית
        res.render('feedback', { feedbacks });
    });
});


app.post('/feedback/:id/delete', (req, res) => {
    const feedbackId = req.params.id;
    const currentUsername = req.session.username; // שם המשתמש המחובר כרגע

    // שליפת הפידבק כדי לוודא שהוא שייך למשתמש הנוכחי
    const fetchFeedbackQuery = 'SELECT * FROM feedback WHERE id = ?';
    connection.query(fetchFeedbackQuery, [feedbackId], (err, results) => {
        if (err) {
            console.error('Error fetching feedback:', err);
            return res.status(500).send('Error fetching feedback.');
        }

        if (results.length === 0) {
            return res.status(404).render('error', {
                title: 'Error',
                message: 'Feedback not found.',
                redirectUrl: '/feedbacks'
            });
        }

        const feedback = results[0];

        // בדיקת בעלות
        if (feedback.username !== currentUsername) {
            return res.status(403).render('error', {
                title: 'Permission Denied',
                message: 'You are not allowed to delete this feedback.',
                redirectUrl: '/feedbacks'
            });
        }

        // מחיקת הפידבק
        const deleteQuery = 'DELETE FROM feedback WHERE id = ?';
        connection.query(deleteQuery, [feedbackId], (err) => {
            if (err) {
                console.error('Error deleting feedback:', err);
                return res.status(500).render('error', {
                    title: 'Error Deleting',
                    message: 'Error deleting feedback.',
                    redirectUrl: '/feedbacks'
                });
            }

            res.redirect('/feedbacks'); // חזרה לרשימת הפידבקים
        });
    });
});



app.post('/feedback/:feedbackId/reply/:replyId/delete', (req, res) => {
    const { feedbackId, replyId } = req.params;
    const currentUsername = req.session.username; // המשתמש המחובר כרגע

    // שליפת התגובה כדי לוודא שהיא שייכת למשתמש הנוכחי
    const fetchReplyQuery = 'SELECT * FROM replies WHERE id = ? AND feedback_id = ?';
    connection.query(fetchReplyQuery, [replyId, feedbackId], (err, results) => {
        if (err) {
            console.error('Error fetching reply:', err);
            return res.status(500).send('Error fetching reply.');
        }

        if (results.length === 0) {
            // אם התגובה לא קיימת
            return res.render('error', { 
                title: 'Reply Not Found', 
                message: 'The reply you are trying to delete does not exist.', 
                redirectUrl: `/feedbacks` 
            });
        }

        const reply = results[0];

        // **בדיקת בעלות על התגובה**
        if (reply.username !== currentUsername) {
            return res.render('error', { 
                title: 'Access Denied', 
                message: 'You are not allowed to delete this reply.', 
                redirectUrl: `/feedbacks` 
            });
        }

        // אם המשתמש הוא הבעלים, מוחקים את התגובה
        const deleteReplyQuery = 'DELETE FROM replies WHERE id = ? AND feedback_id = ?';
        connection.query(deleteReplyQuery, [replyId, feedbackId], (deleteErr) => {
            if (deleteErr) {
                console.error('Error deleting reply:', deleteErr);
                return res.status(500).send('Error deleting reply.');
            }

            // מחיקה הצליחה, חזרה לעמוד הפידבקים
            res.redirect(`/feedbacks`);
        });
    });
});





app.get('/feedback/:id/edit', (req, res) => {
    const feedbackId = req.params.id;
    const currentUsername = req.session.username;
    const query = 'SELECT * FROM feedback WHERE id = ?';
    connection.query(query, [feedbackId], (err, results) => {

        if (err) {
            console.error('Error fetching feedback for edit:', err);
            return res.status(500).send('Error fetching feedback.');
        }

        if (results.length === 0) {
            return res.status(404).send('Feedback not found.');
        }

        const feedback = results[0];

        if (feedback.username !== currentUsername) {
            return res.render('error', { 
                title: 'Edit Feedback Error',
                message: 'You are not allowed to edit this feedback.', 
                redirectUrl: '/feedbacks' 
            });
        }

        res.render('edit-feedback', { feedback, username: currentUsername });
    });
});



app.post('/feedback/:id', (req, res) => {
    const feedbackId = req.params.id;
    const { message } = req.body; // קבלת ערכים מהטופס
    const currentUsername = req.session.username;
    console.log('Name:', currentUsername); // בדיקה האם שם מתקבל
    console.log('Message:', message); // בדיקה האם הודעה מתקבלת

    if (!message) {
        return res.status(400).send(' message is required');
    }

    const checkQuery = 'SELECT * FROM feedback WHERE id = ? AND username = ?';
    connection.query(checkQuery, [feedbackId, currentUsername], (err, results) => {
        if (err) {
            console.error('Error verifying feedback ownership:', err);
            return res.status(500).send('Error verifying feedback ownership.');
        }

        if (results.length === 0) {
            return res.status(403).send('You are not allowed to edit this feedback.');
        }

        // עדכון הפידבק
        const updateQuery = 'UPDATE feedback SET message = ? WHERE id = ?';
        connection.query(updateQuery, [message, feedbackId], (err) => {
            if (err) {
                console.error('Error updating feedback:', err);
                return res.status(500).send('Error updating feedback.');
            }
            res.redirect('/feedbacks'); // חזרה לעמוד הפידבקים
        });
    });
});



app.get('/feedback/:feedbackId/reply/:replyId/edit', (req, res) => {
    const feedbackId = req.params.feedbackId; // מזהה הפידבק
    const replyId = req.params.replyId; // מזהה התגובה
    const currentUsername = req.session.username; // שם המשתמש המחובר כרגע

    const query = 'SELECT * FROM replies WHERE id = ? AND feedback_id = ?';
    connection.query(query, [replyId, feedbackId], (err, results) => {
        if (err) {
            console.error('Error fetching reply for edit:', err);
            return res.status(500).send('Error fetching reply.');
        }

        if (results.length === 0) {
            return res.status(404).send('Reply not found.');
        }

        const reply = results[0];

        if (reply.username !== currentUsername) {
            return res.render('error', { 
                title: 'Edit Reply Error',
                message: 'You are not allowed to edit this reply.', 
                redirectUrl: '/feedbacks' 
            });
        }

        res.render('edit-reply', { feedbackId, reply, username: currentUsername });
    });
});





app.post('/feedback/:feedbackId/reply/:replyId', (req, res) => {
    const feedbackId = req.params.feedbackId; // מזהה הפידבק
    const replyId = req.params.replyId; // מזהה התגובה
    const currentUsername = req.session.username; // שם המשתמש המחובר כרגע
    const { message } = req.body; // התוכן החדש של התגובה

    const selectQuery = 'SELECT * FROM replies WHERE id = ? AND feedback_id = ?';
    connection.query(selectQuery, [replyId, feedbackId], (err, results) => {
        if (err) {
            console.error('Error fetching reply for update:', err);
            return res.status(500).send('Error fetching reply.');
        }

        if (results.length === 0) {
            return res.status(404).send('Reply not found.');
        }

        const reply = results[0];

        // בדיקת בעלות
        if (reply.username !== currentUsername) {
            return res.status(403).send('You are not allowed to edit this reply.');
        }

        const updateQuery = 'UPDATE replies SET message = ? WHERE id = ? AND feedback_id = ?';
        connection.query(updateQuery, [message, replyId, feedbackId], (err) => {
            if (err) {
                console.error('Error updating reply:', err);
                return res.status(500).send('Error updating reply.');
            }

            res.redirect(`/feedbacks`);
        });
    });
});




app.get('/blogs', (req, res) => {
    const query = 'SELECT * FROM blogs ORDER BY created_at DESC';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error inserting blog:', err);
            return res.status(500).send('Error inserting blog.');
        }

        res.render('blogs', { blogs: results });
    });
});

app.post('/add-blog', (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).send('נדרשים כותרת ותוכן.');
    }

    const query = 'INSERT INTO blogs (title, content) VALUES (?, ?)';
    connection.query(query, [title, content], (err) => {
        if (err) {
            console.error('שגיאה בהוספת הבלוג:', err);
            return res.status(500).send('שגיאה בהוספת הבלוג.');
        }

        res.redirect('/blogs'); // הפניה לרשימת הבלוגים לאחר ההוספה
    });
});
    
app.set('views', path.join(__dirname, 'views')); // הגדרת תיקיית views
app.set('view engine', 'ejs'); // הגדרת מנוע התבניות EJS
    
    
    app.listen(3000, () => {
        console.log('Server is running on port 3000');
        });     
    

// Main Express Application - Web Server Setup
const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const business = require('./business');

const app = express();
const PORT = 8000;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/photos/');
    },
    filename: function (req, file, cb) {
        // Create unique filename with timestamp
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accept only image files
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.indexOf(file.mimetype) !== -1) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Configure Handlebars with helpers
app.engine('handlebars', exphbs.engine({ 
    defaultLayout: false,
    helpers: {
        eq: function(a, b) {
            return a === b;
        }
    }
}));
app.set('view engine', 'handlebars');
app.set('views', './views');

// Middleware
app.use(express.urlencoded({ extended: true })); // For parsing form data
app.use(express.static('public')); // Serve static files from public folder

// Session middleware
app.use(session({
    secret: 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

// ==================== AUTHENTICATION ROUTES ====================

/**
 * Signup Page
 * GET /signup
 */
app.get('/signup', (req, res) => {
    res.render('signup', { layout: undefined });
});

/**
 * Signup Form Submission
 * POST /signup
 */
app.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        const result = await business.registerUser(name, email, password);
        
        if (result.success) {
            // Log the user in automatically
            req.session.user = result.user;
            res.redirect('/');
        } else {
            res.render('signup', { 
                layout: undefined, 
                error: result.message,
                name: name,
                email: email
            });
        }
    } catch (error) {
        res.status(500).send('Error during signup: ' + error.message);
    }
});

/**
 * Login Page
 * GET /login
 */
app.get('/login', (req, res) => {
    res.render('login', { layout: undefined });
});

/**
 * Login Form Submission
 * POST /login
 */
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const result = await business.loginUser(email, password);
        
        if (result.success) {
            req.session.user = result.user;
            res.redirect('/');
        } else {
            res.render('login', { 
                layout: undefined, 
                error: result.message,
                email: email
            });
        }
    } catch (error) {
        res.status(500).send('Error during login: ' + error.message);
    }
});

/**
 * Logout
 * GET /logout
 */
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// ==================== ALBUM AND PHOTO ROUTES ====================

/**
 * Landing Page - List all albums (requires authentication)
 * GET /
 */
app.get('/', requireAuth, async (req, res) => {
    try {
        const albums = await business.getAllAlbums();
        res.render('landing', { 
            layout: undefined, 
            albums: albums,
            user: req.session.user
        });
    } catch (error) {
        res.status(500).send('Error loading albums: ' + error.message);
    }
});

/**
 * Album Details Page - Show photos in an album as gallery (requires authentication)
 * GET /album/:albumId
 */
app.get('/album/:albumId', requireAuth, async (req, res) => {
    try {
        const albumId = parseInt(req.params.albumId);
        
        if (isNaN(albumId)) {
            return res.status(400).send('Invalid album ID');
        }
        
        const albumDetails = await business.getAlbumDetails(albumId);
        
        if (!albumDetails) {
            return res.status(404).send('Album not found');
        }
        
        // Filter photos based on visibility
        const userId = req.session.user.id;
        const visiblePhotos = [];
        
        for (let i = 0; i < albumDetails.photos.length; i++) {
            const photo = albumDetails.photos[i];
            if (business.canViewPhoto(photo, userId)) {
                visiblePhotos.push(photo);
            }
        }
        
        const photoWord = visiblePhotos.length === 1 ? 'photo' : 'photos';
        
        res.render('album', { 
            layout: undefined, 
            album: {
                id: albumDetails.id,
                name: albumDetails.name,
                description: albumDetails.description,
                photos: visiblePhotos,
                photoCount: visiblePhotos.length
            },
            photoWord: photoWord,
            user: req.session.user
        });
    } catch (error) {
        res.status(500).send('Error loading album: ' + error.message);
    }
});

/**
 * Photo Details Page - Show photo details (requires authentication)
 * GET /photo/:photoId
 */
app.get('/photo/:photoId', requireAuth, async (req, res) => {
    try {
        const photoId = parseInt(req.params.photoId);
        
        if (isNaN(photoId)) {
            return res.status(400).send('Invalid photo ID');
        }
        
        const photo = await business.getPhotoDetails(photoId);
        
        if (!photo) {
            return res.status(404).send('Photo not found');
        }
        
        // Check if user can view this photo
        const userId = req.session.user.id;
        if (!business.canViewPhoto(photo, userId)) {
            return res.status(403).send('You do not have permission to view this photo');
        }
        
        // Get comments
        const comments = await business.getPhotoComments(photoId);
        
        // Check if user can edit
        const canEdit = business.canEditPhoto(photo, userId);
        
        res.render('photo', { 
            layout: undefined, 
            photo: photo,
            comments: comments,
            canEdit: canEdit,
            user: req.session.user
        });
    } catch (error) {
        res.status(500).send('Error loading photo: ' + error.message);
    }
});

/**
 * Edit Photo Page - Show edit form (requires authentication)
 * GET /photo/:photoId/edit
 */
app.get('/photo/:photoId/edit', requireAuth, async (req, res) => {
    try {
        const photoId = parseInt(req.params.photoId);
        
        if (isNaN(photoId)) {
            return res.status(400).send('Invalid photo ID');
        }
        
        const photo = await business.getPhotoDetails(photoId);
        
        if (!photo) {
            return res.status(404).send('Photo not found');
        }
        
        // Check if user can edit this photo
        const userId = req.session.user.id;
        if (!business.canEditPhoto(photo, userId)) {
            return res.status(403).send('You do not have permission to edit this photo');
        }
        
        res.render('edit', { 
            layout: undefined, 
            photo: photo,
            user: req.session.user
        });
    } catch (error) {
        res.status(500).send('Error loading photo: ' + error.message);
    }
});


/**
 * Update Photo - Process edit form submission (requires authentication)
 * POST /photo/:photoId/update
 */
app.post('/photo/:photoId/update', requireAuth, async (req, res) => {
    try {
        const photoId = parseInt(req.params.photoId);
        
        if (isNaN(photoId)) {
            return res.status(400).send('Invalid photo ID');
        }
        
        const userId = req.session.user.id;
        const title = req.body.title || '';
        const description = req.body.description || '';
        const visibility = req.body.visibility || 'private';
        
        const result = await business.updatePhotoWithVisibility(photoId, userId, {
            title: title,
            description: description,
            visibility: visibility
        });
        
        if (result.success) {
            res.redirect('/photo/' + photoId);
        } else {
            res.status(500).send(result.message + '<br><br><a href="javascript:history.back()">Go Back</a>');
        }
    } catch (error) {
        res.status(500).send('Error updating photo: ' + error.message + '<br><br><a href="javascript:history.back()">Go Back</a>');
    }
});

/**
 * Add Comment - Post a comment on a photo (requires authentication)
 * POST /photo/:photoId/comment
 */
app.post('/photo/:photoId/comment', requireAuth, async (req, res) => {
    try {
        const photoId = parseInt(req.params.photoId);
        
        if (isNaN(photoId)) {
            return res.status(400).send('Invalid photo ID');
        }
        
        const userId = req.session.user.id;
        const username = req.session.user.name;
        const commentText = req.body.comment || '';
        
        const result = await business.addComment(photoId, userId, username, commentText);
        
        if (result.success) {
            res.redirect('/photo/' + photoId);
        } else {
            res.status(500).send(result.message + '<br><br><a href="javascript:history.back()">Go Back</a>');
        }
    } catch (error) {
        res.status(500).send('Error adding comment: ' + error.message + '<br><br><a href="javascript:history.back()">Go Back</a>');
    }
});

// ==================== PHOTO UPLOAD ROUTES ====================

/**
 * Upload Photo Page - Show upload form (requires authentication)
 * GET /album/:albumId/upload
 */
app.get('/album/:albumId/upload', requireAuth, async (req, res) => {
    try {
        const albumId = parseInt(req.params.albumId);
        
        if (isNaN(albumId)) {
            return res.status(400).send('Invalid album ID');
        }
        
        const album = await business.getAlbumById(albumId);
        
        if (!album) {
            return res.status(404).send('Album not found');
        }
        
        res.render('upload', { 
            layout: undefined, 
            album: album,
            user: req.session.user
        });
    } catch (error) {
        res.status(500).send('Error loading upload page: ' + error.message);
    }
});

/**
 * Upload Photo - Process file upload (requires authentication)
 * POST /album/:albumId/upload
 */
app.post('/album/:albumId/upload', requireAuth, upload.single('photo'), async (req, res) => {
    try {
        const albumId = parseInt(req.params.albumId);
        
        if (isNaN(albumId)) {
            return res.status(400).send('Invalid album ID');
        }
        
        if (!req.file) {
            return res.status(400).send('No file uploaded. <a href="javascript:history.back()">Go Back</a>');
        }
        
        const userId = req.session.user.id;
        const filename = req.file.filename;
        
        const result = await business.uploadPhoto(albumId, userId, filename);
        
        if (result.success) {
            res.redirect('/album/' + albumId);
        } else {
            res.status(500).send(result.message + '<br><br><a href="javascript:history.back()">Go Back</a>');
        }
    } catch (error) {
        res.status(500).send('Error uploading photo: ' + error.message + '<br><br><a href="javascript:history.back()">Go Back</a>');
    }
});

// ==================== SEARCH ROUTES ====================

/**
 * Search Page - Show search form and results (requires authentication)
 * GET /search
 */
app.get('/search', requireAuth, async (req, res) => {
    try {
        const query = req.query.q || '';
        const userId = req.session.user.id;
        
        let results = [];
        
        if (query.trim() !== '') {
            results = await business.searchPhotos(query, userId);
        }
        
        res.render('search', { 
            layout: undefined, 
            query: query,
            results: results,
            hasResults: results.length > 0,
            searched: query.trim() !== '',
            user: req.session.user
        });
    } catch (error) {
        res.status(500).send('Error searching photos: ' + error.message);
    }
});

// Start the server
app.listen(PORT, () => {
    console.log('Digital Media Catalog running on http://localhost:' + PORT);
});
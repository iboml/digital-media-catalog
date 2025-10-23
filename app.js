// Main Express Application - Web Server Setup
const express = require('express');
const exphbs = require('express-handlebars');
const business = require('./business');

const app = express();
const PORT = 3000;

// Configure Handlebars
app.engine('handlebars', exphbs.engine({ defaultLayout: false }));
app.set('view engine', 'handlebars');
app.set('views', './views');

// Middleware
app.use(express.urlencoded({ extended: true })); // For parsing form data
app.use(express.static('public')); // Serve static files from public folder

/**
 * Landing Page - List all albums
 * GET /
 */
app.get('/', async (req, res) => {
    try {
        const albums = await business.getAllAlbums();
        res.render('landing', { layout: undefined, albums: albums });
    } catch (error) {
        res.status(500).send('Error loading albums: ' + error.message);
    }
});

/**
 * Album Details Page - Show photos in an album
 * GET /album/:albumId
 */
app.get('/album/:albumId', async (req, res) => {
    try {
        const albumId = parseInt(req.params.albumId);
        
        if (isNaN(albumId)) {
            return res.status(400).send('Invalid album ID');
        }
        
        const albumDetails = await business.getAlbumDetails(albumId);
        
        if (!albumDetails) {
            return res.status(404).send('Album not found');
        }
        
        // Determine if we should say "photo" or "photos"
        const photoWord = albumDetails.photoCount === 1 ? 'photo' : 'photos';
        
        res.render('album', { 
            layout: undefined, 
            album: albumDetails,
            photoWord: photoWord
        });
    } catch (error) {
        res.status(500).send('Error loading album: ' + error.message);
    }
});

/**
 * Photo Details Page - Show photo details
 * GET /photo/:photoId
 */
app.get('/photo/:photoId', async (req, res) => {
    try {
        const photoId = parseInt(req.params.photoId);
        
        if (isNaN(photoId)) {
            return res.status(400).send('Invalid photo ID');
        }
        
        const photo = await business.getPhotoDetails(photoId);
        
        if (!photo) {
            return res.status(404).send('Photo not found');
        }
        
        res.render('photo', { 
            layout: undefined, 
            photo: photo
        });
    } catch (error) {
        res.status(500).send('Error loading photo: ' + error.message);
    }
});

/**
 * Edit Photo Page - Show edit form
 * GET /photo/:photoId/edit
 */
app.get('/photo/:photoId/edit', async (req, res) => {
    try {
        const photoId = parseInt(req.params.photoId);
        
        if (isNaN(photoId)) {
            return res.status(400).send('Invalid photo ID');
        }
        
        const photo = await business.getPhotoDetails(photoId);
        
        if (!photo) {
            return res.status(404).send('Photo not found');
        }
        
        res.render('edit', { 
            layout: undefined, 
            photo: photo
        });
    } catch (error) {
        res.status(500).send('Error loading photo: ' + error.message);
    }
});

/**
 * Update Photo - Process edit form submission
 * POST /photo/:photoId/update
 */
app.post('/photo/:photoId/update', async (req, res) => {
    try {
        const photoId = parseInt(req.params.photoId);
        
        if (isNaN(photoId)) {
            return res.status(400).send('Invalid photo ID');
        }
        
        const title = req.body.title || '';
        const description = req.body.description || '';
        
        const result = await business.updatePhotoDetails(photoId, title, description);
        
        if (result.success) {
            // PRG Pattern - Redirect to photo details page
            res.redirect('/photo/' + photoId);
        } else {
            res.status(500).send(result.message + '<br><br><a href="javascript:history.back()">Go Back</a>');
        }
    } catch (error) {
        res.status(500).send('Error updating photo: ' + error.message + '<br><br><a href="javascript:history.back()">Go Back</a>');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log('Digital Media Catalog running on http://localhost:' + PORT);
});
// Business Logic Layer - Handles business rules

const persistence = require('./persistence');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * Gets photo details with album names instead of IDs
 * @param {number} photoId - ID of the photo
 * @returns {Promise<Object|null>} Photo object with album names or null if not found
 */
async function getPhotoDetails(photoId) {
    const photo = await persistence.findPhotoById(photoId);
    
    if (!photo) {
        return null;
    }
    
    const albumNames = [];
    for (let i = 0; i < photo.albums.length; i++) {
        const album = await persistence.findAlbumById(photo.albums[i]);
        if (album) {
            albumNames.push(album.name);
        }
    }
    
    return {
        id: photo.id,
        filename: photo.filename,
        title: photo.title,
        date: photo.date,
        description: photo.description,
        albums: albumNames,
        tags: photo.tags,
        visibility: photo.visibility,
        owner: photo.owner
    };
}

/**
 * Updates photo details (title and description)
 * @param {number} photoId - ID of the photo to update
 * @param {string} title - New title
 * @param {string} description - New description
 * @returns {Promise<Object>} Result object with success status and message
 */
async function updatePhotoDetails(photoId, title, description) {
    const photo = await persistence.findPhotoById(photoId);
    
    if (!photo) {
        return { success: false, message: 'Photo not found.' };
    }
    
    const updates = {};
    
    updates.title = title;
    
    updates.description = description;
    
    const updated = await persistence.updatePhoto(photoId, updates);
    
    if (updated) {
        return { success: true, message: 'Photo updated successfully' };
    } else {
        return { success: false, message: 'Failed to update photo' };
    }
}

/**
 * Gets all albums
 * @returns {Promise<Array>} Array of album objects
 */
async function getAllAlbums() {
    return await persistence.loadAlbums();
}

/**
 * Gets album details with photo count
 * @param {number} albumId - ID of the album
 * @returns {Promise<Object|null>} Album object with photos array or null if not found
 */
async function getAlbumDetails(albumId) {
    const album = await persistence.findAlbumById(albumId);
    
    if (!album) {
        return null;
    }
    
    const photos = await persistence.getPhotosByAlbum(albumId);
    
    return {
        id: album.id,
        name: album.name,
        description: album.description,
        photos: photos,
        photoCount: photos.length
    };
}

/**
 * Formats a date to a readable date string
 * @param {string|number} dateInput - ISO date string or Unix timestamp
 * @returns {string} Formatted date string
 */
function formatDate(dateInput) {
    const date = new Date(dateInput);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
}

// ==================== USER AUTHENTICATION ====================

/**
 * Registers a new user
 * @param {string} name - User's name
 * @param {string} email - User's email
 * @param {string} password - User's password (plain text)
 * @returns {Promise<Object>} Result with success status and message/user
 */
async function registerUser(name, email, password) {
    // Validate inputs
    if (!name || !email || !password) {
        return { success: false, message: 'All fields are required' };
    }
    
    // Check if email already exists
    const existingUser = await persistence.findUserByEmail(email);
    if (existingUser) {
        return { success: false, message: 'Email already registered' };
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Create user
    const user = await persistence.createUser({
        name: name,
        email: email,
        password: hashedPassword
    });
    
    return { 
        success: true, 
        message: 'Registration successful',
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    };
}

/**
 * Authenticates a user
 * @param {string} email - User's email
 * @param {string} password - User's password (plain text)
 * @returns {Promise<Object>} Result with success status and message/user
 */
async function loginUser(email, password) {
    // Validate inputs
    if (!email || !password) {
        return { success: false, message: 'Email and password are required' };
    }
    
    // Find user by email
    const user = await persistence.findUserByEmail(email);
    if (!user) {
        return { success: false, message: 'Invalid email or password' };
    }
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return { success: false, message: 'Invalid email or password' };
    }
    
    return {
        success: true,
        message: 'Login successful',
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    };
}

// ==================== PHOTO VISIBILITY ====================

/**
 * Checks if a user can view a photo based on visibility and ownership
 * @param {Object} photo - Photo object
 * @param {number|null} userId - Current user ID (null if not logged in)
 * @returns {boolean} True if user can view the photo
 */
function canViewPhoto(photo, userId) {
    if (!photo) {
        return false;
    }
    
    // Public photos can be viewed by logged-in users
    if (photo.visibility === 'public') {
        return true;
    }
    
    // Private photos can only be viewed by owner
    if (photo.visibility === 'private' && photo.owner === userId) {
        return true;
    }
    
    return false;
}

/**
 * Checks if a user can edit a photo (must be owner)
 * @param {Object} photo - Photo object
 * @param {number|null} userId - Current user ID (null if not logged in)
 * @returns {boolean} True if user can edit the photo
 */
function canEditPhoto(photo, userId) {
    if (!photo || !userId) {
        return false;
    }
    
    return photo.owner === userId;
}

/**
 * Updates photo details including visibility
 * @param {number} photoId - ID of the photo to update
 * @param {number} userId - ID of the user making the update
 * @param {Object} updates - Object with title, description, visibility
 * @returns {Promise<Object>} Result object with success status and message
 */
async function updatePhotoWithVisibility(photoId, userId, updates) {
    const photo = await persistence.findPhotoById(photoId);
    
    if (!photo) {
        return { success: false, message: 'Photo not found' };
    }
    
    // Check if user can edit this photo
    if (!canEditPhoto(photo, userId)) {
        return { success: false, message: 'You do not have permission to edit this photo' };
    }
    
    const updateData = {};
    
    if (updates.title !== undefined) {
        updateData.title = updates.title;
    }
    if (updates.description !== undefined) {
        updateData.description = updates.description;
    }
    if (updates.visibility !== undefined) {
        updateData.visibility = updates.visibility;
    }
    
    const updated = await persistence.updatePhoto(photoId, updateData);
    
    if (updated) {
        return { success: true, message: 'Photo updated successfully' };
    } else {
        return { success: false, message: 'Failed to update photo' };
    }
}

// ==================== COMMENTS ====================

/**
 * Adds a comment to a photo
 * @param {number} photoId - ID of the photo
 * @param {number} userId - ID of the user posting comment
 * @param {string} username - Username of the commenter
 * @param {string} commentText - Comment text
 * @returns {Promise<Object>} Result with success status and message/comment
 */
async function addComment(photoId, userId, username, commentText) {
    // Validate inputs
    if (!commentText || commentText.trim() === '') {
        return { success: false, message: 'Comment cannot be empty' };
    }
    
    // Check if photo exists
    const photo = await persistence.findPhotoById(photoId);
    if (!photo) {
        return { success: false, message: 'Photo not found' };
    }
    
    // Check if user can comment (must be able to view the photo)
    if (!canViewPhoto(photo, userId)) {
        return { success: false, message: 'You cannot comment on this photo' };
    }
    
    // Create comment
    const comment = await persistence.createComment({
        photoId: photoId,
        userId: userId,
        username: username,
        text: commentText.trim()
    });
    
    return {
        success: true,
        message: 'Comment added successfully',
        comment: comment
    };
}

/**
 * Gets all comments for a photo
 * @param {number} photoId - ID of the photo
 * @returns {Promise<Array>} Array of comments
 */
async function getPhotoComments(photoId) {
    return await persistence.getCommentsByPhotoId(photoId);
}

module.exports = {
    getPhotoDetails,
    updatePhotoDetails,
    getAllAlbums,
    getAlbumDetails,
    formatDate,
    registerUser,
    loginUser,
    canViewPhoto,
    canEditPhoto,
    updatePhotoWithVisibility,
    addComment,
    getPhotoComments
};


// Business Logic Layer - Handles business rules (NO AUTHENTICATION)

const persistence = require('./persistence');

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
        tags: photo.tags
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
    
    // Always update title (can be empty to clear it)
    updates.title = title;
    
    // Always update description (can be empty to clear it)
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

module.exports = {
    getPhotoDetails,
    updatePhotoDetails,
    getAllAlbums,
    getAlbumDetails,
    formatDate
};

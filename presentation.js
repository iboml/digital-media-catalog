const promptSync = require('prompt-sync')()
const business = require('./business')

/**
 * Displays the login prompt and authenticates the user
 * @returns {Promise<Object|null>} Authenticated user object or null
 */
async function loginUser() {
    console.log('Welcome to Digital Media Catalog')
    console.log('Please log in to continue.\n')
    
    const username = promptSync('Username: ')
    const password = promptSync('Password: ')
    
    const user = await business.authenticateUser(username, password)
    
    if (user) {
        console.log('\nLogin successful! Welcome, ' + user.username + '!\n')
        return user
    } else {
        console.log('\nInvalid username or password.')
        return null
    }
}

/**
 * Displays the main menu and gets user selection
 * @returns {string} User's menu selection
 */
function displayMenu() {
    console.log('\n1. Find Photo')
    console.log('2. Update Photo Details')
    console.log('3. Album Photo List')
    console.log('4. Tag Photo')
    console.log('5. Exit')
    return promptSync('Your selection> ')
}

/**
 * Handles the Find Photo feature
 * @param {Object} user - The logged in user object
 * @returns {Promise<void>}
 */
async function handleFindPhoto(user) {
    const photoIdInput = promptSync('Photo ID? ')
    const photoId = parseInt(photoIdInput)
    
    if (isNaN(photoId)) {
        console.log('Please enter a valid photo ID.')
        return
    }
    
    try {
        const photo = await business.getPhotoDetails(photoId, user.id)
        
        if (!photo) {
            console.log('Photo not found.')
            return
        }
        
        if (photo.error === 'access_denied') {
            console.log('Access denied. You do not own this photo.')
            return
        }
        
        console.log('Filename: ' + photo.filename)
        console.log('Title: ' + photo.title)
        console.log('Date: ' + business.formatDate(photo.date))
        console.log('Albums: ' + photo.albums.join(', '))
        console.log('Tags: ' + photo.tags.join(', '))
    } catch (error) {
        console.log('Error: ' + error.message)
    }
}

/**
 * Handles the Update Photo Details feature
 * @param {Object} user - The logged in user object
 * @returns {Promise<void>}
 */
async function handleUpdatePhoto(user) {
    const photoIdInput = promptSync('Photo ID? ')
    const photoId = parseInt(photoIdInput)
    
    if (isNaN(photoId)) {
        console.log('Please enter a valid photo ID.')
        return
    }
    
    try {
        const photo = await business.getPhotoDetails(photoId, user.id)
        
        if (!photo) {
            console.log('Photo not found.')
            return
        }
        
        if (photo.error === 'access_denied') {
            console.log('Access denied. You do not own this photo.')
            return
        }
        
        console.log('Press enter to reuse existing value.')
        
        const newTitle = promptSync('Enter value for title [' + photo.title + ']: ')
        const newDescription = promptSync('Enter value for description [' + photo.description + ']: ')
        
        const result = await business.updatePhotoDetails(photoId, user.id, newTitle, newDescription)
        console.log(result.message)
    } catch (error) {
        console.log('Error: ' + error.message)
    }
}

/**
 * Handles the Album Photo List feature
 * @param {Object} user - The logged in user object
 * @returns {Promise<void>}
 */
async function handleAlbumPhotoList(user) {
    const albumName = promptSync('What is the name of the album? ')
    
    try {
        const photos = await business.getAlbumPhotoList(albumName, user.id)
        
        if (photos === null) {
            console.log('Album not found.')
            return
        }
        
        if (photos.length === 0) {
            console.log('No photos found in this album that you own.')
            return
        }
        
        console.log('filename,resolution,tags')
        for (let i = 0; i < photos.length; i++) {
            const tagsString = photos[i].tags.join(':')
            console.log(photos[i].filename + ',' + photos[i].resolution + ',' + tagsString)
        }
    } catch (error) {
        console.log('Error: ' + error.message)
    }
}

/**
 * Handles the Tag Photo feature
 * @param {Object} user - The logged in user object
 * @returns {Promise<void>}
 */
async function handleTagPhoto(user) {
    const photoIdInput = promptSync('What photo ID to tag? ')
    const photoId = parseInt(photoIdInput)
    
    if (isNaN(photoId)) {
        console.log('Please enter a valid photo ID.')
        return
    }
    
    const newTag = promptSync('What tag to add? ')
    
    if (newTag.trim() === '') {
        console.log('Please enter a valid tag.')
        return
    }
    
    try {
        const result = await business.addTagToPhoto(photoId, user.id, newTag)
        console.log(result.message)
    } catch (error) {
        console.log('Error: ' + error.message)
    }
}

/**
 * Main program function that runs the application
 * @returns {Promise<void>}
 */
async function main() {
    const user = await loginUser()
    
    if (!user) {
        console.log('Exiting program.')
        return
    }
    
    while (true) {
        const selection = displayMenu()
        
        if (selection === '1') {
            await handleFindPhoto(user)
        } else if (selection === '2') {
            await handleUpdatePhoto(user)
        } else if (selection === '3') {
            await handleAlbumPhotoList(user)
        } else if (selection === '4') {
            await handleTagPhoto(user)
        } else if (selection === '5') {
            console.log('Goodbye!')
            break
        } else {
            console.log('Invalid selection. Please choose a number from 1-5.')
        }
    }
}

module.exports = {
    main
}
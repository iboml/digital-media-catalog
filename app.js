const presentation = require('./presentation')

/**
 * Entry point for the Digital Media Catalog application
 */
presentation.main().catch(error => {
    console.error('Fatal error:', error.message)
    process.exit(1)
})
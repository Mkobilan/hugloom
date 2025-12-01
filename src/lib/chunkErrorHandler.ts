// Add this to your root layout or _app file to handle chunk loading errors
// This will automatically reload the page when Next.js chunks fail to load

if (typeof window !== 'undefined') {
    // Handle chunk loading errors by reloading the page
    window.addEventListener('error', (event) => {
        if (
            event.message?.includes('Failed to load chunk') ||
            event.message?.includes('Loading chunk') ||
            event.message?.includes('ChunkLoadError')
        ) {
            console.log('Chunk load error detected, reloading page...');
            window.location.reload();
        }
    });

    // Also handle unhandled promise rejections from dynamic imports
    window.addEventListener('unhandledrejection', (event) => {
        if (
            event.reason?.message?.includes('Failed to load chunk') ||
            event.reason?.message?.includes('Loading chunk') ||
            event.reason?.name === 'ChunkLoadError'
        ) {
            console.log('Chunk load error detected in promise, reloading page...');
            event.preventDefault();
            window.location.reload();
        }
    });
}

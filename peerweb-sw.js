console.log('[PeerWeb SW] Service worker loading...');

let currentSiteHash = null;
let currentSiteFiles = new Set();
const pendingRequests = new Map();
const mediaCache = new Map(); // Cache for media files

// Listen for messages from main thread
self.addEventListener('message', (event) => {
    const { type, ...data } = event.data;
    
    console.log('[PeerWeb SW] Received message:', type, data);
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'SITE_LOADING':
            currentSiteHash = data.hash;
            currentSiteFiles.clear();
            mediaCache.clear(); // Clear media cache when loading new site
            console.log('[PeerWeb SW] Site loading:', currentSiteHash);
            break;
            
        case 'SITE_READY':
            currentSiteHash = data.hash;
            if (data.fileList) {
                currentSiteFiles = new Set(data.fileList);
                console.log('[PeerWeb SW] Site ready with files:', data.fileList);
            }
            console.log('[PeerWeb SW] Site ready:', currentSiteHash, 'Files:', data.fileCount);
            break;
            
        case 'SITE_UNLOADED':
            currentSiteHash = null;
            currentSiteFiles.clear();
            mediaCache.clear();
            pendingRequests.clear();
            console.log('[PeerWeb SW] Site unloaded');
            break;
            
        case 'RESOURCE_RESPONSE':
            handleResourceResponse(data);
            break;
            
        case 'MEDIA_CHUNK_RESPONSE':
            handleMediaChunkResponse(data);
            break;
    }
});

function handleResourceResponse(data) {
    const { requestId, url, data: fileData, contentType } = data;
    
    console.log('[PeerWeb SW] Resource response:', requestId, url, contentType, fileData ? `${fileData.length} bytes` : 'NO DATA');
    
    const pendingRequest = pendingRequests.get(requestId);
    if (pendingRequest) {
        pendingRequests.delete(requestId);
        
        if (fileData && fileData.length > 0) {
            // Convert array back to Uint8Array
            const uint8Array = new Uint8Array(fileData);
            
            // Check if this is a media file
            if (isMediaFile(contentType) && uint8Array.length > 1024 * 100) { // > 100KB
                // Cache media file for range requests
                mediaCache.set(url, {
                    data: uint8Array,
                    contentType: contentType,
                    length: uint8Array.length
                });
                console.log('[PeerWeb SW] Cached media file:', url, uint8Array.length, 'bytes');
            }
            
            const response = createMediaResponse(uint8Array, contentType, pendingRequest.range);
            console.log('[PeerWeb SW] Serving file:', uint8Array.length, 'bytes');
            pendingRequest.resolve(response);
        } else {
            // File not found
            console.log('[PeerWeb SW] File not found, returning 404');
            const response = new Response('File not found in torrent', {
                status: 404,
                statusText: 'Not Found',
                headers: {
                    'Content-Type': 'text/plain'
                }
            });
            pendingRequest.resolve(response);
        }
    } else {
        console.log('[PeerWeb SW] No pending request found for:', requestId);
    }
}

function handleMediaChunkResponse(data) {
    const { requestId, url, chunk, start, end, total } = data;
    
    const pendingRequest = pendingRequests.get(requestId);
    if (pendingRequest) {
        pendingRequests.delete(requestId);
        
        if (chunk && chunk.length > 0) {
            const uint8Array = new Uint8Array(chunk);
            const response = new Response(uint8Array, {
                status: 206,
                statusText: 'Partial Content',
                headers: {
                    'Content-Type': pendingRequest.contentType || 'application/octet-stream',
                    'Content-Length': uint8Array.length.toString(),
                    'Content-Range': `bytes ${start}-${end}/${total}`,
                    'Accept-Ranges': 'bytes',
                    'Cache-Control': 'public, max-age=31536000'
                }
            });
            
            console.log('[PeerWeb SW] Serving media chunk:', start, '-', end, '/', total);
            pendingRequest.resolve(response);
        } else {
            pendingRequest.resolve(new Response('Chunk not available', { status: 416 }));
        }
    }
}

function isMediaFile(contentType) {
    if (!contentType) return false;
    return contentType.startsWith('video/') || 
           contentType.startsWith('audio/') || 
           contentType === 'image/gif';
}

function createMediaResponse(uint8Array, contentType, range) {
    if (!range || !isMediaFile(contentType)) {
        // Regular response for non-media files or no range request
        return new Response(uint8Array, {
            status: 200,
            statusText: 'OK',
            headers: {
                'Content-Type': contentType || 'application/octet-stream',
                'Content-Length': uint8Array.length.toString(),
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=31536000',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
    
    // Handle range request for media files
    const { start, end } = range;
    const chunkSize = end - start + 1;
    const chunk = uint8Array.slice(start, end + 1);
    
    return new Response(chunk, {
        status: 206,
        statusText: 'Partial Content',
        headers: {
            'Content-Type': contentType,
            'Content-Length': chunkSize.toString(),
            'Content-Range': `bytes ${start}-${end}/${uint8Array.length}`,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=31536000',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

function parseRangeHeader(rangeHeader, fileSize) {
    if (!rangeHeader || !rangeHeader.startsWith('bytes=')) {
        return null;
    }
    
    const range = rangeHeader.substring(6);
    const parts = range.split('-');
    
    let start = parseInt(parts[0]) || 0;
    let end = parseInt(parts[1]) || fileSize - 1;
    
    // Ensure valid range
    start = Math.max(0, Math.min(start, fileSize - 1));
    end = Math.max(start, Math.min(end, fileSize - 1));
    
    return { start, end };
}

// Helper function to check if URL is external
function isExternalUrl(url) {
    try {
        const urlObj = new URL(url);
        
        // Check for external protocols
        if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
            // If it has a different origin than the current request, it's external
            return urlObj.origin !== self.location.origin;
        }
        
        // Other protocols (mailto:, tel:, etc.) are external
        if (urlObj.protocol !== 'blob:' && urlObj.protocol !== 'data:') {
            return true;
        }
        
        return false;
    } catch (e) {
        // If URL parsing fails, assume it's a relative URL (internal)
        return false;
    }
}

// Helper function to check if this is a PeerWeb internal resource
function isPeerWebInternalResource(url) {
    try {
        const urlObj = new URL(url);
        
        // Only handle PeerWeb site paths
        if (!urlObj.pathname.startsWith('/peerweb-site/')) {
            return false;
        }
        
        // Check if this is for the current site
        const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
        if (pathParts.length >= 2 && pathParts[0] === 'peerweb-site') {
            const hash = pathParts[1];
            return hash === currentSiteHash;
        }
        
        return false;
    } catch (e) {
        return false;
    }
}

// Intercept fetch requests
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    console.log('[PeerWeb SW] Fetch request:', url.href);
    
    // Let external URLs pass through without interception
    if (isExternalUrl(event.request.url)) {
        console.log('[PeerWeb SW] External URL, passing through:', event.request.url);
        return; // Don't call event.respondWith(), let it pass through normally
    }
    
    // Only handle PeerWeb internal resources
    if (isPeerWebInternalResource(event.request.url)) {
        console.log('[PeerWeb SW] Intercepting PeerWeb internal resource:', url.pathname);
        event.respondWith(handlePeerWebRequest(event.request));
        return;
    }
    
    // Let all other requests pass through normally
    console.log('[PeerWeb SW] Non-PeerWeb request, passing through:', event.request.url);
});

async function handlePeerWebRequest(request) {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(part => part.length > 0);
    
    console.log('[PeerWeb SW] Path parts:', pathParts);
    
    // URL format: /peerweb-site/{hash}/{file-path}
    if (pathParts.length < 2 || pathParts[0] !== 'peerweb-site') {
        console.log('[PeerWeb SW] Invalid PeerWeb URL format');
        return new Response('Invalid PeerWeb URL', { status: 400 });
    }
    
    const hash = pathParts[1];
    let filePath = pathParts.slice(2).join('/');
    
    console.log('[PeerWeb SW] Requesting file:', filePath, 'for hash:', hash);
    console.log('[PeerWeb SW] Current site hash:', currentSiteHash);
    
    // Check if this is the current site
    if (hash !== currentSiteHash) {
        console.log('[PeerWeb SW] Hash mismatch - site not loaded');
        return new Response(`Site not loaded. Expected: ${currentSiteHash}, Got: ${hash}`, { 
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
    
    // Handle different navigation scenarios
    filePath = normalizeFilePath(filePath, url);
    
    console.log('[PeerWeb SW] Normalized file path:', filePath);
    
    // Check if this is a cached media file and handle range requests
    const cachedMedia = mediaCache.get(request.url);
    if (cachedMedia) {
        console.log('[PeerWeb SW] Found cached media file');
        const rangeHeader = request.headers.get('Range');
        
        if (rangeHeader) {
            console.log('[PeerWeb SW] Range request for media:', rangeHeader);
            const range = parseRangeHeader(rangeHeader, cachedMedia.length);
            if (range) {
                return createMediaResponse(cachedMedia.data, cachedMedia.contentType, range);
            }
        }
        
        // Return full media file if no range requested
        return createMediaResponse(cachedMedia.data, cachedMedia.contentType, null);
    }
    
    // Parse range header for new requests
    const rangeHeader = request.headers.get('Range');
    let range = null;
    if (rangeHeader) {
        console.log('[PeerWeb SW] Range request detected:', rangeHeader);
        // We'll need the file size first, so we'll handle this in the response
    }
    
    // Request the resource from main thread
    return requestResourceFromMainThread(request.url, filePath, range);
}

function normalizeFilePath(filePath, url) {
    // If no file path or it's empty, default to index.html
    if (!filePath || filePath === '') {
        console.log('[PeerWeb SW] Empty path, defaulting to index.html');
        return 'index.html';
    }
    
    // If path ends with /, append index.html
    if (filePath.endsWith('/')) {
        console.log('[PeerWeb SW] Directory path, appending index.html');
        return filePath + 'index.html';
    }
    
    // If path has no extension and doesn't exist as-is, try common variations
    if (!filePath.includes('.')) {
        console.log('[PeerWeb SW] Path without extension, trying variations');
        
        // Try as directory first
        const dirPath = filePath + '/index.html';
        if (currentSiteFiles.has(dirPath)) {
            console.log('[PeerWeb SW] Found as directory:', dirPath);
            return dirPath;
        }
        
        // Try with .html extension
        const htmlPath = filePath + '.html';
        if (currentSiteFiles.has(htmlPath)) {
            console.log('[PeerWeb SW] Found with .html extension:', htmlPath);
            return htmlPath;
        }
        
        // Try as index in subdirectory
        const indexPath = filePath + '/index.html';
        console.log('[PeerWeb SW] Trying as subdirectory index:', indexPath);
        return indexPath;
    }
    
    // Handle query parameters and fragments - remove them for file lookup
    if (url.search || url.hash) {
        console.log('[PeerWeb SW] Removing query/fragment from path');
        const cleanPath = filePath.split('?')[0].split('#')[0];
        return cleanPath;
    }
    
    return filePath;
}

async function requestResourceFromMainThread(requestUrl, filePath, range) {
    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    console.log('[PeerWeb SW] Creating request:', requestId, 'for file:', filePath);
    
    return new Promise((resolve) => {
        // Store the resolve function with range info
        pendingRequests.set(requestId, { 
            resolve, 
            timestamp: Date.now(),
            range: range 
        });
        
        console.log('[PeerWeb SW] Stored pending request:', requestId);
        
        // Request the resource
        self.clients.matchAll().then(clients => {
            console.log('[PeerWeb SW] Found clients:', clients.length);
            
            if (clients.length > 0) {
                clients[0].postMessage({
                    type: 'RESOURCE_REQUEST',
                    url: requestUrl,
                    filePath: filePath,
                    requestId: requestId,
                    range: range
                });
                console.log('[PeerWeb SW] Sent request to client for:', filePath);
            } else {
                console.log('[PeerWeb SW] No clients found');
                pendingRequests.delete(requestId);
                resolve(createNavigationFallback(filePath));
            }
        }).catch(error => {
            console.error('[PeerWeb SW] Error getting clients:', error);
            pendingRequests.delete(requestId);
            resolve(createNavigationFallback(filePath));
        });
        
        // Timeout after 10 seconds for media files, 5 for others
        const timeout = isMediaFile(filePath) ? 10000 : 5000;
        setTimeout(() => {
            if (pendingRequests.has(requestId)) {
                pendingRequests.delete(requestId);
                console.log('[PeerWeb SW] Request timeout:', requestId);
                resolve(createNavigationFallback(filePath));
            }
        }, timeout);
    });
}

function createNavigationFallback(filePath) {
    console.log('[PeerWeb SW] Creating navigation fallback for:', filePath);
    
    // For media files, return a more specific error
    if (isMediaFile(filePath)) {
        return new Response('Media file not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
                'Content-Type': 'text/plain',
                'Retry-After': '5'
            }
        });
    }
    
    // Create a simple fallback page that tries to redirect to index.html
    const fallbackHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PeerWeb Navigation</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            .container {
                text-align: center;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                backdrop-filter: blur(10px);
            }
            .spinner {
                width: 50px;
                height: 50px;
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-top: 4px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .retry-btn {
                background: white;
                color: #667eea;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                margin-top: 1rem;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="spinner"></div>
            <h2>🪐 PeerWeb Navigation</h2>
            <p>Redirecting to home page...</p>
            <p><small>Requested: ${filePath}</small></p>
            <button class="retry-btn" onclick="goHome()">Go to Home</button>
        </div>
        <script>
            function goHome() {
                const currentPath = window.location.pathname;
                const pathParts = currentPath.split('/');
                if (pathParts.length >= 3) {
                    const baseUrl = '/' + pathParts.slice(1, 3).join('/') + '/';
                    window.location.href = baseUrl;
                } else {
                    window.location.reload();
                }
            }
            
            setTimeout(() => {
                goHome();
            }, 3000);
        </script>
    </body>
    </html>
    `;
    
    return new Response(fallbackHtml, {
        status: 200,
        statusText: 'OK',
        headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache'
        }
    });
}

// Service worker installation
self.addEventListener('install', (event) => {
    console.log('[PeerWeb SW] Installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[PeerWeb SW] Activating...');
    event.waitUntil(
        self.clients.claim().then(() => {
            console.log('[PeerWeb SW] Claimed all clients');
        })
    );
});

console.log('[PeerWeb SW] Service worker loaded and ready');
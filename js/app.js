let watermarkImage = null;
let watermarkSize = 0.2;
let watermarkPositionX = 0.8; // Relative position (0-1) from left
let watermarkPositionY = 0.8; // Relative position (0-1) from top
let watermarkOpacity = 0.8;
let watermarkNegative = false;
let originalImages = [];
let originalImageNames = [];
let originalImageFiles = []; // Store original file objects
let originalImageDPI = []; // Store DPI information
let currentPreviewIndex = 0;
let currentLanguage = 'en';
let previewUpdateTimer = null; // Debouncer for preview updates
let mainUpdateTimer = null; // Debouncer for main preview updates

// Translation data
const translations = {
    en: {
        'app-title': 'Photo Watermark Tool',
        'images-section-title': 'Images to Watermark',
        'choose-images-btn': 'Choose Images to Watermark',
        'watermark-options-title': 'Watermark Options',
        'watermark-image-title': 'Watermark Image', 
        'choose-watermark-btn': 'Choose Watermark Image',
        'watermark-instruction': 'Select an image to use as watermark',
        'settings-title': 'Settings',
        'size-label': 'Size:',
        'opacity-label': 'Opacity:',
        'invert-color-label': 'Invert Color',
        'position-label': 'Position:',
        'position-instruction': 'Drag the watermark to position it',
        'update-preview-btn': 'Update Previews',
        'watermarked-images-title': 'Watermarked Images',
        'download-all-btn': 'Download All',
        'change-watermark-btn': 'Change Watermark',
        'clear-watermark-btn': 'Clear Watermark',
        'watermark-warning': 'Please select a watermark image to see watermarked previews.',
        'no-images-warning': 'No watermarked images available to download.',
        'original-images-title': 'Original Images',
        'full-size-preview-title': 'Full Size Preview',
        'download-btn': 'Download',
        'close-btn': 'Close'
    },
    es: {
        'app-title': 'Herramienta de Marca de Agua',
        'images-section-title': 'Imágenes para Marcar',
        'choose-images-btn': 'Elegir Imágenes para Marcar',
        'watermark-options-title': 'Opciones de Marca de Agua',
        'watermark-image-title': 'Imagen de Marca de Agua',
        'choose-watermark-btn': 'Elegir Imagen de Marca de Agua',
        'watermark-instruction': 'Selecciona una imagen para usar como marca de agua',
        'settings-title': 'Configuración',
        'size-label': 'Tamaño:',
        'opacity-label': 'Opacidad:',
        'invert-color-label': 'Invertir Color',
        'position-label': 'Posición:',
        'position-instruction': 'Arrastra la marca de agua para posicionarla',
        'update-preview-btn': 'Actualizar Vista Previa',
        'watermarked-images-title': 'Imágenes con Marca de Agua',
        'download-all-btn': 'Descargar Todo',
        'change-watermark-btn': 'Cambiar Marca de Agua',
        'clear-watermark-btn': 'Limpiar Marca de Agua',
        'watermark-warning': 'Por favor selecciona una imagen de marca de agua para ver las vistas previas.',
        'no-images-warning': 'No hay imágenes con marca de agua disponibles para descargar.',
        'original-images-title': 'Imágenes Originales',
        'full-size-preview-title': 'Vista Previa Tamaño Completo',
        'download-btn': 'Descargar',
        'close-btn': 'Cerrar'
    }
};

function changeLanguage(lang) {
    currentLanguage = lang;
    
    // Update all elements with data-translate attribute
    const elementsToTranslate = document.querySelectorAll('[data-translate]');
    elementsToTranslate.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // Save language preference
    try {
        localStorage.setItem('language', lang);
    } catch (e) {
        console.warn('Could not save language preference:', e);
    }
    
    // Update dynamic content that might already be loaded
    updateDynamicTranslations();
    
    // Refresh watermark preview to update button labels
    if (watermarkImage) {
        showWatermarkPreview();
    }
}

function loadLanguageFromStorage() {
    try {
        const savedLang = localStorage.getItem('language');
        if (savedLang && translations[savedLang]) {
            currentLanguage = savedLang;
            updateLanguageDisplay(savedLang);
            changeLanguage(savedLang);
            return true;
        }
    } catch (e) {
        console.warn('Could not load language preference:', e);
    }
    return false;
}

function updateLanguageDisplay(lang) {
    const currentLangSpan = document.querySelector('.current-language');
    const languageOptions = document.querySelectorAll('.language-option');
    
    // Update current language display
    if (currentLangSpan) {
        currentLangSpan.textContent = lang.toUpperCase();
    }
    
    // Update active state in menu
    languageOptions.forEach(option => {
        option.classList.remove('active');
        if (option.dataset.lang === lang) {
            option.classList.add('active');
        }
    });
}

function initializeBurgerMenu() {
    const burgerBtn = document.getElementById('language-burger');
    const languageMenu = document.getElementById('language-menu');
    const languageOptions = document.querySelectorAll('.language-option');
    
    if (!burgerBtn || !languageMenu) return;
    
    // Toggle menu on burger button click
    burgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        languageMenu.classList.toggle('hidden');
    });
    
    // Handle language selection
    languageOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const selectedLang = option.dataset.lang;
            if (selectedLang && translations[selectedLang]) {
                changeLanguage(selectedLang);
                updateLanguageDisplay(selectedLang);
                languageMenu.classList.add('hidden');
            }
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!burgerBtn.contains(e.target) && !languageMenu.contains(e.target)) {
            languageMenu.classList.add('hidden');
        }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            languageMenu.classList.add('hidden');
        }
    });
    
    // Initialize the display
    updateLanguageDisplay(currentLanguage);
}

function updateDynamicTranslations() {
    // Update container titles that are dynamically created
    const imageContainer = document.getElementById('image-container');
    if (imageContainer && originalImages.length > 0 && imageContainer.querySelector('h3')) {
        const h3 = imageContainer.querySelector('h3');
        h3.textContent = translations[currentLanguage]['original-images-title'];
    }
    
    // Update watermarked images section if it has dynamic content
    const watermarkedContainer = document.getElementById('watermarked-image-container');
    if (watermarkedContainer) {
        const h2 = watermarkedContainer.querySelector('h2');
        if (h2) {
            h2.textContent = translations[currentLanguage]['watermarked-images-title'];
        }
        
        const downloadAllBtn = watermarkedContainer.querySelector('.download-all-btn');
        if (downloadAllBtn) {
            downloadAllBtn.textContent = translations[currentLanguage]['download-all-btn'];
        }
        
        const warningMsg = watermarkedContainer.querySelector('#watermark-warning');
        if (warningMsg) {
            warningMsg.textContent = translations[currentLanguage]['watermark-warning'];
        }
    }
}

function getWatermarkPosition(canvasWidth, canvasHeight, watermarkWidth, watermarkHeight) {
    // Calculate absolute position from relative coordinates
    const x = (canvasWidth - watermarkWidth) * watermarkPositionX;
    const y = (canvasHeight - watermarkHeight) * watermarkPositionY;
    
    // Ensure watermark stays within canvas bounds
    const constrainedX = Math.max(0, Math.min(x, canvasWidth - watermarkWidth));
    const constrainedY = Math.max(0, Math.min(y, canvasHeight - watermarkHeight));
    
    return { x: constrainedX, y: constrainedY };
}

function saveWatermarkToStorage(imageData) {
    try {
        localStorage.setItem('watermarkImage', imageData);
    } catch (e) {
        console.warn('Could not save watermark to localStorage:', e);
    }
}

function loadWatermarkFromStorage() {
    try {
        const savedWatermark = localStorage.getItem('watermarkImage');
        if (savedWatermark) {
            watermarkImage = new Image();
            watermarkImage.onload = function() {
                showWatermarkPreview();
                // Update watermarked images if original images exist
                if (originalImages.length > 0) {
                    updateWatermarkedImages();
                }
            };
            watermarkImage.src = savedWatermark;
            return true;
        }
    } catch (e) {
        console.warn('Could not load watermark from localStorage:', e);
    }
    return false;
}

function saveSettingsToStorage() {
    try {
        const settings = {
            size: watermarkSize,
            positionX: watermarkPositionX,
            positionY: watermarkPositionY,
            opacity: watermarkOpacity,
            negative: watermarkNegative
        };
        localStorage.setItem('watermarkSettings', JSON.stringify(settings));
    } catch (e) {
        console.warn('Could not save settings to localStorage:', e);
    }
}

function loadSettingsFromStorage() {
    try {
        const savedSettings = localStorage.getItem('watermarkSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            watermarkSize = settings.size || 0.2;
            watermarkPositionX = settings.positionX || 0.8;
            watermarkPositionY = settings.positionY || 0.8;
            watermarkOpacity = settings.opacity || 0.8;
            watermarkNegative = settings.negative || false;
            
            // Update UI elements
            document.getElementById('watermark-size').value = watermarkSize;
            document.getElementById('watermark-opacity').value = watermarkOpacity;
            document.getElementById('watermark-negative').checked = watermarkNegative;
            updatePositionInterface();
            
            return true;
        }
    } catch (e) {
        console.warn('Could not load settings from localStorage:', e);
    }
    return false;
}

function clearWatermarkFromStorage() {
    try {
        localStorage.removeItem('watermarkImage');
    } catch (e) {
        console.warn('Could not clear watermark from localStorage:', e);
    }
}

function createNegativeWatermark(watermarkImg, width, height) {
    // Create a temporary canvas to process the watermark
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = width;
    tempCanvas.height = height;
    
    // Draw the original watermark
    tempCtx.drawImage(watermarkImg, 0, 0, width, height);
    
    // Get image data to process pixels
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Invert RGB values while preserving alpha
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];       // Red
        data[i + 1] = 255 - data[i + 1]; // Green  
        data[i + 2] = 255 - data[i + 2]; // Blue
        // data[i + 3] remains unchanged (Alpha)
    }
    
    // Put the processed image data back
    tempCtx.putImageData(imageData, 0, 0);
    
    return tempCanvas;
}

function applyWatermark(image, imageIndex = 0) {
    if (!watermarkImage) {
        return null;
    }
    
    // Get DPI information for this image
    const dpi = originalImageDPI[imageIndex] || { dpiX: 72, dpiY: 72 };
    
    // Create high DPI canvas with exact dimensions
    const canvas = createHighDPICanvas(image, dpi);
    const ctx = canvas.getContext('2d');
    
    // Verify canvas dimensions match original image
    const originalWidth = image.naturalWidth || image.width;
    const originalHeight = image.naturalHeight || image.height;
    
    console.log(`Image ${imageIndex + 1}: Original ${originalWidth}×${originalHeight}, Canvas ${canvas.width}×${canvas.height}`);
    
    // Ensure canvas matches exact original dimensions
    if (canvas.width !== originalWidth || canvas.height !== originalHeight) {
        canvas.width = originalWidth;
        canvas.height = originalHeight;
        console.warn(`Corrected canvas dimensions to match original: ${canvas.width}×${canvas.height}`);
    }

    // Draw the original image at full size with no scaling
    ctx.drawImage(image, 0, 0, originalWidth, originalHeight);
    
    // Calculate watermark dimensions
    const maxWatermarkWidth = canvas.width * watermarkSize;
    const aspectRatio = watermarkImage.naturalHeight / watermarkImage.naturalWidth;
    const watermarkWidth = maxWatermarkWidth;
    const watermarkHeight = watermarkWidth * aspectRatio;
    
    // Get watermark position
    const position = getWatermarkPosition(canvas.width, canvas.height, watermarkWidth, watermarkHeight);
    
    // Apply opacity
    ctx.globalAlpha = watermarkOpacity;
    
    if (watermarkNegative) {
        // Create negative version of watermark preserving transparency
        const negativeWatermark = createNegativeWatermark(watermarkImage, watermarkWidth, watermarkHeight);
        ctx.drawImage(negativeWatermark, position.x, position.y);
    } else {
        ctx.drawImage(watermarkImage, position.x, position.y, watermarkWidth, watermarkHeight);
    }
    
    ctx.globalAlpha = 1.0; // Reset opacity

    // Store dimension and DPI info on canvas for verification
    canvas.dpi = dpi;
    canvas.originalDimensions = { width: originalWidth, height: originalHeight };
    
    return canvas;
}

function getWatermarkedFilename(originalFilename) {
    // Remove the file extension
    const lastDotIndex = originalFilename.lastIndexOf('.');
    const nameWithoutExt = lastDotIndex !== -1 ? originalFilename.substring(0, lastDotIndex) : originalFilename;
    const extension = lastDotIndex !== -1 ? originalFilename.substring(lastDotIndex) : '.png';
    
    return `${nameWithoutExt}_watermark${extension}`;
}

function getImageMimeType(filename) {
    const extension = filename.toLowerCase().split('.').pop();
    switch (extension) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'webp':
            return 'image/webp';
        default:
            return 'image/png'; // Default to PNG for unknown formats
    }
}

function getOptimalDataURL(canvas, filename) {
    const mimeType = getImageMimeType(filename);
    
    // For JPEG and WebP, use high quality (0.95 to maintain excellent quality while still compressing)
    if (mimeType === 'image/jpeg' || mimeType === 'image/webp') {
        return canvas.toDataURL(mimeType, 0.95);
    }
    
    // For PNG, no quality parameter needed (lossless compression)
    return canvas.toDataURL(mimeType);
}

// Instead of writing custom EXIF, let's try to preserve the original image's complete metadata
function preserveOriginalEXIFWithWatermark(originalFile, canvas, imageIndex) {
    return new Promise((resolve, reject) => {
        if (!originalFile || !originalFile.type.startsWith('image/')) {
            // Fallback to canvas export
            resolve(canvas.toDataURL('image/jpeg', 0.95));
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const originalBytes = new Uint8Array(e.target.result);
                
                // Verify it's a JPEG
                if (originalBytes[0] !== 0xFF || originalBytes[1] !== 0xD8) {
                    console.log('Not a JPEG file, using canvas export');
                    resolve(canvas.toDataURL('image/jpeg', 0.95));
                    return;
                }

                console.log(`Preserving EXIF from original file: ${originalFile.name}`);
                
                // Extract EXIF data from original
                const exifData = extractCompleteEXIFData(originalBytes);
                
                if (!exifData) {
                    console.log('No EXIF found in original, using canvas export');
                    resolve(canvas.toDataURL('image/jpeg', 0.95));
                    return;
                }

                // Get watermarked image data
                const canvasDataURL = canvas.toDataURL('image/jpeg', 0.95);
                const canvasBase64 = canvasDataURL.split(',')[1];
                const canvasBinaryString = atob(canvasBase64);
                const canvasBytes = new Uint8Array(canvasBinaryString.length);
                
                for (let i = 0; i < canvasBinaryString.length; i++) {
                    canvasBytes[i] = canvasBinaryString.charCodeAt(i);
                }

                // Insert original EXIF into watermarked image
                const finalImage = insertEXIFIntoJPEG(canvasBytes, exifData);
                resolve(finalImage);
                
            } catch (error) {
                console.error('Error preserving EXIF:', error);
                resolve(canvas.toDataURL('image/jpeg', 0.95));
            }
        };
        
        reader.onerror = () => {
            console.error('Error reading original file');
            resolve(canvas.toDataURL('image/jpeg', 0.95));
        };
        
        reader.readAsArrayBuffer(originalFile);
    });
}

function extractCompleteEXIFData(jpegBytes) {
    // Find EXIF segment in original image
    let offset = 2; // Skip SOI marker
    
    while (offset < jpegBytes.length - 4) {
        if (jpegBytes[offset] === 0xFF && jpegBytes[offset + 1] === 0xE1) {
            // Found EXIF segment
            const segmentLength = (jpegBytes[offset + 2] << 8) | jpegBytes[offset + 3];
            const segmentData = jpegBytes.slice(offset, offset + 2 + segmentLength);
            
            // Check if it's actually EXIF (contains "Exif\0\0")
            if (segmentLength > 8) {
                const exifStart = offset + 4;
                if (jpegBytes[exifStart] === 0x45 && // 'E'
                    jpegBytes[exifStart + 1] === 0x78 && // 'x'
                    jpegBytes[exifStart + 2] === 0x69 && // 'i'
                    jpegBytes[exifStart + 3] === 0x66) { // 'f'
                    
                    console.log(`Found complete EXIF segment: ${segmentLength} bytes`);
                    return segmentData;
                }
            }
        }
        
        if (jpegBytes[offset] === 0xFF && jpegBytes[offset + 1] === 0xDA) {
            break; // Start of scan data
        }
        
        const segmentLength = (jpegBytes[offset + 2] << 8) | jpegBytes[offset + 3];
        offset += 2 + segmentLength;
    }
    
    return null;
}

function insertEXIFIntoJPEG(jpegBytes, exifSegment) {
    // Create new JPEG with original EXIF preserved
    const newSize = jpegBytes.length + exifSegment.length;
    const newBytes = new Uint8Array(newSize);
    
    let writeOffset = 0;
    let readOffset = 0;
    
    // Copy SOI marker
    newBytes[writeOffset++] = jpegBytes[readOffset++]; // 0xFF
    newBytes[writeOffset++] = jpegBytes[readOffset++]; // 0xD8
    
    // Insert original EXIF segment
    for (let i = 0; i < exifSegment.length; i++) {
        newBytes[writeOffset++] = exifSegment[i];
    }
    
    // Skip any existing EXIF segments in canvas output
    while (readOffset < jpegBytes.length - 1) {
        if (jpegBytes[readOffset] === 0xFF && jpegBytes[readOffset + 1] === 0xE1) {
            // Skip existing EXIF
            const segmentLength = (jpegBytes[readOffset + 2] << 8) | jpegBytes[readOffset + 3];
            readOffset += 2 + segmentLength;
        } else {
            break;
        }
    }
    
    // Copy remaining JPEG data
    while (readOffset < jpegBytes.length) {
        newBytes[writeOffset++] = jpegBytes[readOffset++];
    }
    
    // Convert to data URL
    let binaryStr = '';
    for (let i = 0; i < writeOffset; i++) {
        binaryStr += String.fromCharCode(newBytes[i]);
    }
    
    console.log(`Successfully preserved original EXIF data`);
    return 'data:image/jpeg;base64,' + btoa(binaryStr);
}

function addEXIFToJPEG(jpegData, dpiX, dpiY) {
    try {
        console.log(`Attempting to add EXIF with DPI: ${dpiX} x ${dpiY}`);
        
        // Convert data URL to bytes
        const base64Data = jpegData.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Check if it's a valid JPEG
        if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) {
            console.warn('Not a valid JPEG file, returning original');
            return jpegData; // Not a JPEG, return original
        }
        
        // Create EXIF data
        const exifData = createEXIFWithDPI(dpiX, dpiY);
        console.log(`Created EXIF data with ${exifData.length} bytes`);
        
        // Calculate how much data to skip (existing EXIF segments if any)
        let readOffset = 2; // Skip SOI marker
        let foundExisting = false;
        
        while (readOffset < bytes.length - 1) {
            if (bytes[readOffset] === 0xFF && bytes[readOffset + 1] === 0xE1) {
                // Found existing EXIF segment, skip it
                const segmentLength = (bytes[readOffset + 2] << 8) | bytes[readOffset + 3];
                console.log(`Found existing EXIF segment, skipping ${segmentLength} bytes`);
                readOffset += 2 + segmentLength;
                foundExisting = true;
            } else {
                break;
            }
        }
        
        // Calculate new size: SOI (2) + EXIF marker (2) + length (2) + "Exif\0\0" (6) + EXIF data + remaining JPEG
        const remainingJpegSize = bytes.length - readOffset;
        const newSize = 2 + 2 + 2 + 6 + exifData.length + remainingJpegSize;
        const newBytes = new Uint8Array(newSize);
        
        console.log(`Creating new JPEG: original ${bytes.length} bytes, new ${newSize} bytes, EXIF data ${exifData.length} bytes`);
        
        let writeOffset = 0;
        
        // Copy SOI marker
        newBytes[writeOffset++] = bytes[0]; // 0xFF
        newBytes[writeOffset++] = bytes[1]; // 0xD8
        
        // Add EXIF marker
        newBytes[writeOffset++] = 0xFF;
        newBytes[writeOffset++] = 0xE1; // EXIF marker
        
        // EXIF segment length (including "Exif\0\0" identifier)
        const exifSegmentLength = 6 + exifData.length;
        newBytes[writeOffset++] = (exifSegmentLength >> 8) & 0xFF;
        newBytes[writeOffset++] = exifSegmentLength & 0xFF;
        
        // Add "Exif\0\0" identifier
        newBytes[writeOffset++] = 0x45; // 'E'
        newBytes[writeOffset++] = 0x78; // 'x'
        newBytes[writeOffset++] = 0x69; // 'i'
        newBytes[writeOffset++] = 0x66; // 'f'
        newBytes[writeOffset++] = 0x00; // \0
        newBytes[writeOffset++] = 0x00; // \0
        
        // Add EXIF data
        for (let i = 0; i < exifData.length; i++) {
            newBytes[writeOffset++] = exifData[i];
        }
        
        // Copy remaining JPEG data
        for (let i = readOffset; i < bytes.length; i++) {
            if (writeOffset >= newBytes.length) {
                console.error(`Write offset ${writeOffset} exceeds array size ${newBytes.length}`);
                return jpegData; // Return original on error
            }
            newBytes[writeOffset++] = bytes[i];
        }
        
        console.log(`Successfully created JPEG with EXIF. Final size: ${writeOffset} bytes`);
        
        // Convert back to data URL
        let binaryStr = '';
        for (let i = 0; i < writeOffset; i++) {
            binaryStr += String.fromCharCode(newBytes[i]);
        }
        
        const result = 'data:image/jpeg;base64,' + btoa(binaryStr);
        console.log(`EXIF injection complete. Original DPI should now be preserved.`);
        return result;
        
    } catch (error) {
        console.error('Error adding EXIF to JPEG:', error);
        console.warn('Returning original image without EXIF modification');
        return jpegData; // Return original on any error
    }
}

// Pixel-perfect watermark compositing that preserves original image completely
function createWatermarkWithOriginalIntegrity(originalFile, imageIndex) {
    return new Promise((resolve) => {
        if (!originalFile || !originalFile.type.includes('jpeg')) {
            // Fallback for non-JPEG
            const canvas = applyWatermark(originalImages[imageIndex], imageIndex);
            resolve(canvas.toDataURL('image/jpeg', 1.0)); // Use quality 1.0 to minimize compression
            return;
        }

        console.log(`Creating pixel-perfect watermark for: ${originalFile.name}`);
        
        // Read original file as ArrayBuffer to preserve all data
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const originalArrayBuffer = e.target.result;
                const originalBytes = new Uint8Array(originalArrayBuffer);
                
                console.log(`Original file size: ${originalBytes.length} bytes`);
                
                // Create two canvases: one for compositing preview, one for precise pixel work
                const originalImage = originalImages[imageIndex];
                const previewCanvas = applyWatermark(originalImage, imageIndex);
                
                // Now create a high-precision canvas with exact original dimensions
                const precisionCanvas = document.createElement('canvas');
                const ctx = precisionCanvas.getContext('2d');
                
                // Set exact original pixel dimensions
                precisionCanvas.width = originalImage.naturalWidth;
                precisionCanvas.height = originalImage.naturalHeight;
                
                console.log(`Precision canvas: ${precisionCanvas.width} x ${precisionCanvas.height}`);
                
                // Disable any smoothing that might affect precision
                ctx.imageSmoothingEnabled = false;
                
                // Draw original image at exact 1:1 pixel mapping
                ctx.drawImage(originalImage, 0, 0, originalImage.naturalWidth, originalImage.naturalHeight);
                
                // Apply watermark with exact positioning
                if (watermarkImage) {
                    const maxWatermarkWidth = precisionCanvas.width * watermarkSize;
                    const aspectRatio = watermarkImage.naturalHeight / watermarkImage.naturalWidth;
                    const watermarkWidth = maxWatermarkWidth;
                    const watermarkHeight = watermarkWidth * aspectRatio;
                    
                    const position = getWatermarkPosition(precisionCanvas.width, precisionCanvas.height, watermarkWidth, watermarkHeight);
                    
                    ctx.globalAlpha = watermarkOpacity;
                    
                    if (watermarkNegative) {
                        const negativeWatermark = createNegativeWatermark(watermarkImage, watermarkWidth, watermarkHeight);
                        ctx.drawImage(negativeWatermark, position.x, position.y);
                    } else {
                        ctx.drawImage(watermarkImage, position.x, position.y, watermarkWidth, watermarkHeight);
                    }
                    
                    ctx.globalAlpha = 1.0;
                }
                
                // Get the watermarked image data with maximum quality
                const watermarkedDataURL = precisionCanvas.toDataURL('image/jpeg', 1.0);
                
                // Now preserve the original EXIF by transplanting it
                const finalResult = transplantEXIFToNewImage(originalBytes, watermarkedDataURL);
                
                console.log('Pixel-perfect watermark with EXIF preservation complete');
                resolve(finalResult);
                
            } catch (error) {
                console.error('Error in pixel-perfect watermarking:', error);
                // Fallback to standard method
                const canvas = applyWatermark(originalImages[imageIndex], imageIndex);
                resolve(canvas.toDataURL('image/jpeg', 0.98));
            }
        };
        
        reader.onerror = () => {
            console.error('Error reading original file');
            const canvas = applyWatermark(originalImages[imageIndex], imageIndex);
            resolve(canvas.toDataURL('image/jpeg', 0.98));
        };
        
        reader.readAsArrayBuffer(originalFile);
    });
}

function transplantEXIFToNewImage(originalJpegBytes, newImageDataURL) {
    try {
        // Extract ALL metadata from original image
        const metadata = extractAllJPEGMetadata(originalJpegBytes);
        
        if (metadata.length === 0) {
            console.log('No metadata to preserve, returning new image as-is');
            return newImageDataURL;
        }
        
        // Convert new image to bytes 
        const newImageBytes = dataURLToBytes(newImageDataURL);
        
        // Create final image with original metadata transplanted
        const finalBytes = insertMetadataIntoJPEG(newImageBytes, metadata);
        
        // Convert back to data URL
        let binary = '';
        for (let i = 0; i < finalBytes.length; i++) {
            binary += String.fromCharCode(finalBytes[i]);
        }
        
        console.log(`Successfully transplanted ${metadata.length} metadata segments`);
        return 'data:image/jpeg;base64,' + btoa(binary);
        
    } catch (error) {
        console.error('Error transplanting EXIF:', error);
        return newImageDataURL;
    }
}

function extractAllJPEGMetadata(jpegBytes) {
    const segments = [];
    let offset = 2; // Skip SOI marker
    
    while (offset < jpegBytes.length - 4) {
        const marker = (jpegBytes[offset] << 8) | jpegBytes[offset + 1];
        
        // Collect all metadata segments (EXIF, XMP, ICC, etc.)
        if (marker >= 0xFFE0 && marker <= 0xFFEF) {
            const length = (jpegBytes[offset + 2] << 8) | jpegBytes[offset + 3];
            const segment = jpegBytes.slice(offset, offset + 2 + length);
            segments.push(segment);
            console.log(`Extracted metadata segment: marker 0x${marker.toString(16)}, ${length} bytes`);
            offset += 2 + length;
        } else if (marker === 0xFFDA) {
            // Start of scan - stop here
            break;
        } else {
            // Skip other segments
            const length = (jpegBytes[offset + 2] << 8) | jpegBytes[offset + 3];
            offset += 2 + length;
        }
    }
    
    return segments;
}

function insertMetadataIntoJPEG(jpegBytes, metadataSegments) {
    if (metadataSegments.length === 0) return jpegBytes;
    
    // Calculate total size needed
    const metadataSize = metadataSegments.reduce((total, seg) => total + seg.length, 0);
    let readOffset = 2; // Skip SOI in new image
    
    // Skip any existing metadata in the new image
    while (readOffset < jpegBytes.length - 1) {
        const marker = (jpegBytes[readOffset] << 8) | jpegBytes[readOffset + 1];
        if (marker >= 0xFFE0 && marker <= 0xFFEF) {
            const segLength = (jpegBytes[readOffset + 2] << 8) | jpegBytes[readOffset + 3];
            readOffset += 2 + segLength;
        } else break;
    }
    
    const finalSize = 2 + metadataSize + (jpegBytes.length - readOffset);
    const result = new Uint8Array(finalSize);
    let writeOffset = 0;
    
    // Copy SOI
    result[writeOffset++] = jpegBytes[0];
    result[writeOffset++] = jpegBytes[1];
    
    // Insert all original metadata
    metadataSegments.forEach(segment => {
        result.set(segment, writeOffset);
        writeOffset += segment.length;
    });
    
    // Copy rest of new image
    result.set(jpegBytes.slice(readOffset), writeOffset);
    
    return result;
}

function extractOriginalEXIF(jpegBytes) {
    let offset = 2; // Skip SOI
    while (offset < jpegBytes.length - 4) {
        const marker = (jpegBytes[offset] << 8) | jpegBytes[offset + 1];
        if (marker === 0xFFE1) { // EXIF marker
            const length = (jpegBytes[offset + 2] << 8) | jpegBytes[offset + 3];
            // Check for "Exif\0\0"
            if (jpegBytes[offset + 4] === 0x45 && jpegBytes[offset + 5] === 0x78 &&
                jpegBytes[offset + 6] === 0x69 && jpegBytes[offset + 7] === 0x66 &&
                jpegBytes[offset + 8] === 0x00 && jpegBytes[offset + 9] === 0x00) {
                console.log(`Found EXIF: ${length} bytes`);
                return jpegBytes.slice(offset, offset + 2 + length);
            }
        }
        if (marker === 0xFFDA) break; // Start of scan
        const segLength = (jpegBytes[offset + 2] << 8) | jpegBytes[offset + 3];
        offset += 2 + segLength;
    }
    return null;
}

function dataURLToBytes(dataURL) {
    const base64 = dataURL.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function mergeEXIFWithImage(imageBytes, exifSegment) {
    // Create new image: SOI + EXIF + rest of image (skipping any existing EXIF)
    let readOffset = 2; // Skip SOI in canvas image
    
    // Skip any existing EXIF in canvas output
    while (readOffset < imageBytes.length - 1) {
        if (imageBytes[readOffset] === 0xFF && imageBytes[readOffset + 1] === 0xE1) {
            const segLength = (imageBytes[readOffset + 2] << 8) | imageBytes[readOffset + 3];
            readOffset += 2 + segLength;
        } else break;
    }
    
    const newSize = 2 + exifSegment.length + (imageBytes.length - readOffset);
    const result = new Uint8Array(newSize);
    let writeOffset = 0;
    
    // SOI
    result[writeOffset++] = imageBytes[0];
    result[writeOffset++] = imageBytes[1];
    
    // Original EXIF
    result.set(exifSegment, writeOffset);
    writeOffset += exifSegment.length;
    
    // Rest of image
    result.set(imageBytes.slice(readOffset), writeOffset);
    
    // Convert back to data URL
    let binary = '';
    for (let i = 0; i < result.length; i++) {
        binary += String.fromCharCode(result[i]);
    }
    return 'data:image/jpeg;base64,' + btoa(binary);
}

function getOptimalDataURLWithDPI(canvas, filename, dpiX = 72, dpiY = 72, imageIndex = 0) {
    const mimeType = getImageMimeType(filename);
    
    console.log(`Processing ${filename}, index ${imageIndex}, DPI: ${dpiX}x${dpiY}`);
    
    // For JPEG files, use pixel-perfect approach with complete metadata preservation
    if (mimeType === 'image/jpeg' && originalImageFiles[imageIndex]) {
        console.log('Using pixel-perfect watermarking with complete metadata preservation');
        return createWatermarkWithOriginalIntegrity(originalImageFiles[imageIndex], imageIndex);
    }
    
    // Standard export for other formats
    console.log(`Standard export for ${mimeType}`);
    if (mimeType === 'image/jpeg' || mimeType === 'image/webp') {
        return Promise.resolve(canvas.toDataURL(mimeType, 0.98));
    }
    return Promise.resolve(canvas.toDataURL(mimeType));
}

function extractDPIFromEXIF(arrayBuffer) {
    // Simple EXIF DPI extraction for common cases
    const view = new DataView(arrayBuffer);
    
    // Check for JPEG format (0xFFD8)
    if (view.getUint16(0) === 0xFFD8) {
        let offset = 2;
        
        // Look for EXIF marker (0xFFE1)
        while (offset < view.byteLength - 4) {
            const marker = view.getUint16(offset);
            if (marker === 0xFFE1) {
                // Found EXIF segment
                const exifLength = view.getUint16(offset + 2);
                const exifStart = offset + 4;
                
                // Look for "Exif\0\0" identifier
                if (exifStart + 6 < view.byteLength) {
                    const exifId = String.fromCharCode(
                        view.getUint8(exifStart),
                        view.getUint8(exifStart + 1),
                        view.getUint8(exifStart + 2),
                        view.getUint8(exifStart + 3)
                    );
                    
                    if (exifId === 'Exif') {
                        return extractDPIFromTIFF(view, exifStart + 6);
                    }
                }
            }
            
            if (marker === 0xFFDA) break; // Start of scan data
            const segmentLength = view.getUint16(offset + 2);
            offset += 2 + segmentLength;
        }
    }
    
    return { dpiX: 72, dpiY: 72 }; // Default DPI
}

function extractDPIFromTIFF(view, tiffStart) {
    try {
        // Check byte order
        const byteOrder = view.getUint16(tiffStart);
        const isLittleEndian = byteOrder === 0x4949;
        
        // Get IFD offset
        const ifdOffset = isLittleEndian ? 
            view.getUint32(tiffStart + 4, true) : 
            view.getUint32(tiffStart + 4, false);
        
        const ifdStart = tiffStart + ifdOffset;
        
        // Number of directory entries
        const numEntries = isLittleEndian ? 
            view.getUint16(ifdStart, true) : 
            view.getUint16(ifdStart, false);
        
        let dpiX = 72, dpiY = 72;
        let resolutionUnit = 2; // Default to inches
        
        // Read directory entries
        for (let i = 0; i < numEntries; i++) {
            const entryStart = ifdStart + 2 + (i * 12);
            const tag = isLittleEndian ? 
                view.getUint16(entryStart, true) : 
                view.getUint16(entryStart, false);
            
            if (tag === 0x011A) { // X Resolution
                const valueOffset = isLittleEndian ? 
                    view.getUint32(entryStart + 8, true) : 
                    view.getUint32(entryStart + 8, false);
                const numerator = isLittleEndian ? 
                    view.getUint32(tiffStart + valueOffset, true) : 
                    view.getUint32(tiffStart + valueOffset, false);
                const denominator = isLittleEndian ? 
                    view.getUint32(tiffStart + valueOffset + 4, true) : 
                    view.getUint32(tiffStart + valueOffset + 4, false);
                dpiX = numerator / denominator;
            } else if (tag === 0x011B) { // Y Resolution
                const valueOffset = isLittleEndian ? 
                    view.getUint32(entryStart + 8, true) : 
                    view.getUint32(entryStart + 8, false);
                const numerator = isLittleEndian ? 
                    view.getUint32(tiffStart + valueOffset, true) : 
                    view.getUint32(tiffStart + valueOffset, false);
                const denominator = isLittleEndian ? 
                    view.getUint32(tiffStart + valueOffset + 4, true) : 
                    view.getUint32(tiffStart + valueOffset + 4, false);
                dpiY = numerator / denominator;
            } else if (tag === 0x0128) { // Resolution Unit
                resolutionUnit = isLittleEndian ? 
                    view.getUint16(entryStart + 8, true) : 
                    view.getUint16(entryStart + 8, false);
            }
        }
        
        // Convert from cm to inches if needed
        if (resolutionUnit === 3) {
            dpiX *= 2.54;
            dpiY *= 2.54;
        }
        
        return { dpiX: Math.round(dpiX), dpiY: Math.round(dpiY) };
    } catch (e) {
        console.warn('Error extracting DPI from TIFF:', e);
        return { dpiX: 72, dpiY: 72 };
    }
}

function createHighDPICanvas(image, dpi) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Ensure exact pixel dimensions match the original image
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    
    // Configure for high quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Disable any automatic scaling
    ctx.scale(1, 1);
    
    return canvas;
}

function downloadAllImages() {
    if (!watermarkImage || originalImages.length === 0) {
        alert(translations[currentLanguage]['no-images-warning']);
        return;
    }
    
    // Add a small delay between downloads to prevent browser blocking
    originalImages.forEach((img, index) => {
        setTimeout(() => {
            const canvas = applyWatermark(img, index);
            if (canvas) {
                const originalName = originalImageNames[index];
                const watermarkedName = getWatermarkedFilename(originalName);
                downloadImage(canvas, watermarkedName, originalName, index);
            }
        }, index * 100); // 100ms delay between each download
    });
}

function showFullSizePreview(imageIndex) {
    currentPreviewIndex = imageIndex;
    
    // Remove existing preview if any
    const existingPreview = document.getElementById('fullsize-preview');
    if (existingPreview) {
        existingPreview.remove();
    }
    
    const canvas = applyWatermark(originalImages[currentPreviewIndex], currentPreviewIndex);
    const imageSrc = canvas.toDataURL();
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'fullsize-preview';
    overlay.innerHTML = `
        <div class="preview-backdrop">
            <div class="preview-container">
                <div class="preview-header">
                    <h3>${translations[currentLanguage]['full-size-preview-title']} (${currentPreviewIndex + 1} of ${originalImages.length})</h3>
                    <div class="preview-actions">
                        <button class="preview-btn download-btn" onclick="downloadImageFromPreview()">${translations[currentLanguage]['download-btn']}</button>
                        <button class="preview-btn close-btn" onclick="closeFullSizePreview()">${translations[currentLanguage]['close-btn']}</button>
                    </div>
                </div>
                <div class="preview-content">
                    <button class="nav-btn prev-btn" onclick="showPreviousImage()" ${currentPreviewIndex === 0 ? 'disabled' : ''}>
                        <span>‹</span>
                    </button>
                    <div class="preview-main">
                        <div class="preview-image-container">
                            <img id="preview-image" src="${imageSrc}" alt="Full size watermarked image">
                        </div>
                        <div class="preview-settings">
                            <h4>${translations[currentLanguage]['settings-title']}</h4>
                            <div class="preview-settings-grid">
                                <div class="preview-setting-group">
                                    <label for="preview-size">${translations[currentLanguage]['size-label']}</label>
                                    <input type="range" id="preview-size" min="0.01" max="1" step="0.01" value="${watermarkSize}">
                                    <span id="preview-size-value">${Math.round(watermarkSize * 100)}%</span>
                                </div>
                                <div class="preview-setting-group">
                                    <label for="preview-opacity">${translations[currentLanguage]['opacity-label']}</label>
                                    <input type="range" id="preview-opacity" min="0.01" max="1" step="0.01" value="${watermarkOpacity}">
                                    <span id="preview-opacity-value">${Math.round(watermarkOpacity * 100)}%</span>
                                </div>
                                <div class="preview-setting-group position-control">
                                    <label>${translations[currentLanguage]['position-label']}</label>
                                    <div class="preview-position-container" id="preview-position-container">
                                        <div class="position-area">
                                            <div class="watermark-dot"></div>
                                        </div>
                                        <p class="position-instruction">${translations[currentLanguage]['position-instruction']}</p>
                                    </div>
                                </div>
                                <div class="preview-setting-group checkbox-group">
                                    <label for="preview-negative" class="checkbox-label">
                                        <input type="checkbox" id="preview-negative" ${watermarkNegative ? 'checked' : ''}>
                                        <span class="checkmark"></span>
                                        <span>${translations[currentLanguage]['invert-color-label']}</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button class="nav-btn next-btn" onclick="showNextImage()" ${currentPreviewIndex === originalImages.length - 1 ? 'disabled' : ''}>
                        <span>›</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Store canvas for download
    overlay.canvas = canvas;
    
    document.body.appendChild(overlay);
    
    // Add event listeners for preview settings
    setupPreviewSettingsListeners();
    setupPreviewPositionInterface();
    
    // Close on backdrop click
    overlay.querySelector('.preview-backdrop').addEventListener('click', function(e) {
        if (e.target === this) {
            closeFullSizePreview();
        }
    });
    
    // Handle keyboard navigation
    document.addEventListener('keydown', handlePreviewKeydown);
}

function setupPreviewSettingsListeners() {
    const previewSize = document.getElementById('preview-size');
    const previewOpacity = document.getElementById('preview-opacity');
    const previewNegative = document.getElementById('preview-negative');
    
    if (previewSize) {
        previewSize.addEventListener('input', debouncedUpdatePreviewImage);
    }
    if (previewOpacity) {
        previewOpacity.addEventListener('input', debouncedUpdatePreviewImage);
    }
    if (previewNegative) {
        previewNegative.addEventListener('change', debouncedUpdatePreviewImage);
    }
}

function updatePreviewDisplayValues() {
    // Get preview settings values
    const previewSize = document.getElementById('preview-size');
    const previewOpacity = document.getElementById('preview-opacity');
    const previewNegative = document.getElementById('preview-negative');
    
    if (!previewSize || !previewOpacity || !previewNegative) {
        return;
    }
    
    // Apply preview settings temporarily (for display values only)
    const tempSize = parseFloat(previewSize.value);
    const tempOpacity = parseFloat(previewOpacity.value);
    
    // Update display values immediately for instant feedback
    const sizeValue = document.getElementById('preview-size-value');
    const opacityValue = document.getElementById('preview-opacity-value');
    
    if (sizeValue) {
        sizeValue.textContent = Math.round(tempSize * 100) + '%';
    }
    if (opacityValue) {
        opacityValue.textContent = Math.round(tempOpacity * 100) + '%';
    }
}

function debouncedUpdatePreviewImage() {
    // Update display values immediately for instant feedback
    updatePreviewDisplayValues();
    
    // Clear existing timer
    if (previewUpdateTimer) {
        clearTimeout(previewUpdateTimer);
    }
    
    // Set new timer for 100 milliseconds
    previewUpdateTimer = setTimeout(() => {
        updatePreviewImage();
        previewUpdateTimer = null;
    }, 100);
}

function updatePreviewImage() {
    // Get preview settings values
    const previewSize = document.getElementById('preview-size');
    const previewOpacity = document.getElementById('preview-opacity');
    const previewNegative = document.getElementById('preview-negative');
    
    if (!previewSize || !previewOpacity || !previewNegative) {
        return;
    }
    
    // Apply preview settings temporarily
    watermarkSize = parseFloat(previewSize.value);
    watermarkOpacity = parseFloat(previewOpacity.value);
    watermarkNegative = previewNegative.checked;
    
    // Update display values
    const sizeValue = document.getElementById('preview-size-value');
    const opacityValue = document.getElementById('preview-opacity-value');
    
    if (sizeValue) {
        sizeValue.textContent = Math.round(watermarkSize * 100) + '%';
    }
    if (opacityValue) {
        opacityValue.textContent = Math.round(watermarkOpacity * 100) + '%';
    }
    
    // Generate new watermarked image
    const canvas = applyWatermark(originalImages[currentPreviewIndex], currentPreviewIndex);
    const imageSrc = canvas.toDataURL();
    
    // Update the preview image
    const previewImg = document.getElementById('preview-image');
    if (previewImg) {
        previewImg.src = imageSrc;
    }
    
    // Update stored canvas for download
    const overlay = document.getElementById('fullsize-preview');
    if (overlay) {
        overlay.canvas = canvas;
    }
    
    // Update global settings to match preview
    updateGlobalSettings();
}

function updateGlobalSettings() {
    // Update main settings to match preview settings
    const mainSize = document.getElementById('watermark-size');
    const mainOpacity = document.getElementById('watermark-opacity');
    const mainNegative = document.getElementById('watermark-negative');
    
    if (mainSize) mainSize.value = watermarkSize;
    if (mainOpacity) mainOpacity.value = watermarkOpacity;
    if (mainNegative) mainNegative.checked = watermarkNegative;
    
    // Update display values in main interface
    const mainSizeValue = document.getElementById('size-value');
    const mainOpacityValue = document.getElementById('opacity-value');
    
    if (mainSizeValue) {
        mainSizeValue.textContent = Math.round(watermarkSize * 100) + '%';
    }
    if (mainOpacityValue) {
        mainOpacityValue.textContent = Math.round(watermarkOpacity * 100) + '%';
    }
    
    // Update positioning interfaces
    updatePositionInterface();
    updatePreviewPositionInterface();
    
    // Save settings
    saveSettingsToStorage();
}

function handlePreviewKeydown(e) {
    if (!document.getElementById('fullsize-preview')) return;
    
    switch(e.key) {
        case 'Escape':
            closeFullSizePreview();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            showPreviousImage();
            break;
        case 'ArrowRight':
            e.preventDefault();
            showNextImage();
            break;
    }
}

function showPreviousImage() {
    if (currentPreviewIndex > 0) {
        showFullSizePreview(currentPreviewIndex - 1);
    }
}

function showNextImage() {
    if (currentPreviewIndex < originalImages.length - 1) {
        showFullSizePreview(currentPreviewIndex + 1);
    }
}

function closeFullSizePreview() {
    const preview = document.getElementById('fullsize-preview');
    if (preview) {
        preview.remove();
    }
    // Remove keyboard event listener
    document.removeEventListener('keydown', handlePreviewKeydown);
    
    // Update main watermarked images to reflect any changes made in preview
    updateWatermarkedImages();
}

function downloadImageFromPreview() {
    const preview = document.getElementById('fullsize-preview');
    if (preview && preview.canvas) {
        const originalName = originalImageNames[currentPreviewIndex];
        const watermarkedName = getWatermarkedFilename(originalName);
        downloadImage(preview.canvas, watermarkedName, originalName, currentPreviewIndex);
    }
}

function updateWatermarkedImages() {
    const watermarkedContainer = document.getElementById('watermarked-image-container');
    
    if (!watermarkImage || originalImages.length === 0) {
        watermarkedContainer.innerHTML = '';
        
        if (originalImages.length > 0 && !watermarkImage) {
            const message = document.createElement('p');
            message.textContent = translations[currentLanguage]['watermark-warning'];
            message.style.color = '#666';
            message.style.fontSize = '13px';
            message.style.textAlign = 'center';
            message.style.marginTop = '20px';
            message.id = 'watermark-warning';
            watermarkedContainer.appendChild(message);
        }
        return;
    }
    
    // Clear container and create grid
    watermarkedContainer.innerHTML = '';
    watermarkedContainer.className = 'image-grid';
    
    originalImages.forEach((img, index) => {
        const canvas = applyWatermark(img, index);
        if (canvas) {
            // Create watermarked image
            const watermarkedImage = new Image();
            watermarkedImage.src = canvas.toDataURL();
            
            // Add click functionality for full size preview
            watermarkedImage.addEventListener('click', () => showFullSizePreview(index));
            watermarkedImage.title = 'Click to view full size';
            
            watermarkedContainer.appendChild(watermarkedImage);
        }
    });
}

function downloadImage(canvas, filename, originalFilename = null, imageIndex = 0) {
    const link = document.createElement('a');
    link.download = filename;
    
    // Use original filename to determine optimal format and quality
    const sourceFilename = originalFilename || filename;
    
    // Get DPI information
    const dpi = canvas.dpi || originalImageDPI[imageIndex] || { dpiX: 72, dpiY: 72 };
    
    // Verify final canvas dimensions match original
    const originalDims = canvas.originalDimensions;
    if (originalDims) {
        console.log(`Downloading ${filename}: ${canvas.width}×${canvas.height} pixels (Original: ${originalDims.width}×${originalDims.height}) at ${dpi.dpiX}×${dpi.dpiY} DPI`);
        
        if (canvas.width !== originalDims.width || canvas.height !== originalDims.height) {
            console.warn(`WARNING: Canvas dimensions ${canvas.width}×${canvas.height} don't match original ${originalDims.width}×${originalDims.height}!`);
        }
        
        // Verify DPI values are reasonable
        if (dpi.dpiX <= 0 || dpi.dpiY <= 0 || dpi.dpiX > 5000 || dpi.dpiY > 5000) {
            console.warn(`WARNING: Suspicious DPI values ${dpi.dpiX}x${dpi.dpiY}, using 150 DPI as fallback`);
            dpi.dpiX = 150;
            dpi.dpiY = 150;
        }
    } else {
        console.log(`Downloading ${filename} with DPI: ${dpi.dpiX}×${dpi.dpiY}`);
    }
    
    // Use enhanced data URL function that preserves original EXIF
    console.log(`Getting optimal data URL with EXIF preservation`);
    const dataURLPromise = getOptimalDataURLWithDPI(canvas, sourceFilename, dpi.dpiX, dpi.dpiY, imageIndex);
    
    // Handle both promise and direct return cases
    if (dataURLPromise instanceof Promise) {
        dataURLPromise.then(dataURL => {
            link.href = dataURL;
            link.click();
            console.log(`Download initiated with preserved EXIF`);
        }).catch(error => {
            console.error('Error with EXIF preservation, falling back:', error);
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            link.click();
        });
    } else {
        link.href = dataURLPromise;
        link.click();
    }
}

function showWatermarkPreview() {
    const display = document.getElementById('watermark-display');
    
    if (watermarkImage) {
        // Show watermark image
        display.innerHTML = `<img src="${watermarkImage.src}" alt="Watermark">`;
    } else {
        // Show placeholder text
        display.innerHTML = `<div style="color: #666; font-size: 12px; text-align: center; padding: 20px;">No watermark selected</div>`;
    }
}

function clearWatermark() {
    watermarkImage = null;
    clearWatermarkFromStorage();
    showWatermarkPreview();
    
    // Clear watermarked images
    const watermarkedContainer = document.getElementById('watermarked-image-container');
    watermarkedContainer.innerHTML = `<h3>${translations[currentLanguage]['watermarked-images-title']}</h3>`;
}

function handleWatermarkUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            watermarkImage = new Image();
            watermarkImage.onload = function() {
                // Save to localStorage
                saveWatermarkToStorage(e.target.result);
                
                // Update watermark preview display
                showWatermarkPreview();
                
                // Remove any existing warning message and update watermarked images
                const warningMessage = document.getElementById('watermark-warning');
                if (warningMessage) {
                    warningMessage.remove();
                }
                
                // Update watermarked images if any exist
                debouncedUpdateMain();
            };
            watermarkImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function updateDPIDisplay() {
    const dpiInfo = document.getElementById('dpi-info');
    if (!dpiInfo) return;
    
    if (originalImageDPI.length === 0 || originalImages.length === 0) {
        dpiInfo.innerHTML = '';
        return;
    }
    
    if (originalImages.length === 1) {
        const image = originalImages[0];
        const dpi = originalImageDPI[0];
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        dpiInfo.innerHTML = `📐 Image: ${width} × ${height} pixels at ${dpi.dpiX} × ${dpi.dpiY} DPI (exact dimensions preserved)`;
    } else {
        // Get dimension info for multiple images
        const dimensions = originalImages.map((img, i) => {
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;
            const dpi = originalImageDPI[i] || { dpiX: 72, dpiY: 72 };
            return { width, height, dpiX: dpi.dpiX, dpiY: dpi.dpiY };
        });
        
        const maxWidth = Math.max(...dimensions.map(d => d.width));
        const maxHeight = Math.max(...dimensions.map(d => d.height));
        const minWidth = Math.min(...dimensions.map(d => d.width));
        const minHeight = Math.min(...dimensions.map(d => d.height));
        
        if (maxWidth === minWidth && maxHeight === minHeight) {
            // All images same dimensions
            const dpi = originalImageDPI[0];
            dpiInfo.innerHTML = `📐 ${originalImages.length} images: ${maxWidth} × ${maxHeight} pixels at ${dpi.dpiX} × ${dpi.dpiY} DPI (dimensions preserved)`;
        } else {
            // Various dimensions
            dpiInfo.innerHTML = `📐 ${originalImages.length} images: ${minWidth}-${maxWidth} × ${minHeight}-${maxHeight} pixels with original DPI (each preserved exactly)`;
        }
    }
}

function handleFileUpload(event) {
    const files = event.target.files;
    const imageContainer = document.getElementById('image-container');
    
    // Clear previous images and reset arrays
    imageContainer.innerHTML = '';
    imageContainer.className = 'image-grid';
    originalImages = [];
    originalImageNames = [];
    originalImageFiles = [];
    originalImageDPI = [];
    
    // Clear DPI display
    updateDPIDisplay();
    
    if (files.length === 0) {
        updateWatermarkedImages();
        return;
    }
    
    let loadedCount = 0;
    let dpiReadCount = 0;
    const totalFiles = Array.from(files).filter(file => file.type.startsWith('image/')).length;
    
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const img = new Image();
            const reader = new FileReader();
            const dpiReader = new FileReader();
            
            // Read as DataURL for image display
            reader.onload = function(e) {
                img.src = e.target.result;
                img.onload = function() {
                    // Store original image and filename
                    originalImages.push(img);
                    originalImageNames.push(file.name);
                    originalImageFiles.push(file);
                    
                    // Display original image in grid
                    const originalImg = img.cloneNode();
                    imageContainer.appendChild(originalImg);
                    
                    // Check if all images are loaded
                    loadedCount++;
                    if (loadedCount === totalFiles) {
                        updateWatermarkedImages();
                    }
                };
            };
            
            // Read as ArrayBuffer for DPI extraction
            dpiReader.onload = function(e) {
                const dpi = extractDPIFromEXIF(e.target.result);
                originalImageDPI.push(dpi);
                console.log(`Extracted DPI from ${file.name}: ${dpi.dpiX}x${dpi.dpiY}`);
                
                // Update DPI display when all DPI data is read
                dpiReadCount++;
                if (dpiReadCount === totalFiles) {
                    updateDPIDisplay();
                }
            };
            
            reader.readAsDataURL(file);
            dpiReader.readAsArrayBuffer(file);
        }
    });
}

function updateSettingsValues() {
    watermarkSize = parseFloat(document.getElementById('watermark-size').value);
    watermarkOpacity = parseFloat(document.getElementById('watermark-opacity').value);
    watermarkNegative = document.getElementById('watermark-negative').checked;
    
    // Save settings to localStorage
    saveSettingsToStorage();
    
    // Update display values only
    document.getElementById('size-value').textContent = Math.round(watermarkSize * 100) + '%';
    document.getElementById('opacity-value').textContent = Math.round(watermarkOpacity * 100) + '%';
}

function updatePreviews() {
    // Update watermarked images with new settings
    updateWatermarkedImages();
}

function debouncedUpdateMain() {
    // Update display values immediately for instant feedback
    updateSettingsValues();
    
    // Clear existing timer
    if (mainUpdateTimer) {
        clearTimeout(mainUpdateTimer);
    }
    
    // Set new timer for 300 milliseconds
    mainUpdateTimer = setTimeout(() => {
        updatePreviews();
        mainUpdateTimer = null;
    }, 300);
}

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const sizeRange = document.getElementById('watermark-size');
    const opacityRange = document.getElementById('watermark-opacity');
    const negativeCheckbox = document.getElementById('watermark-negative');
    
    // Load language preference first
    loadLanguageFromStorage();
    
    // Initialize burger menu
    initializeBurgerMenu();
    
    // Load saved settings and watermark
    loadSettingsFromStorage();
    const hasWatermark = loadWatermarkFromStorage();
    
    fileInput.addEventListener('change', handleFileUpload);
    
    // Setup watermark input
    const watermarkInput = document.getElementById('watermark-input');
    if (watermarkInput) {
        watermarkInput.addEventListener('change', handleWatermarkUpload);
    }
    
    // Auto-update with debouncing
    sizeRange.addEventListener('input', debouncedUpdateMain);
    opacityRange.addEventListener('input', debouncedUpdateMain);
    negativeCheckbox.addEventListener('change', debouncedUpdateMain);
    
    // Initialize positioning interface
    setupPositionInterface();
    
    // Initialize watermark preview if no saved watermark
    if (!hasWatermark) {
        showWatermarkPreview();
    }
    
    // Initialize display values
    updateSettingsValues();
});

function setupPositionInterface() {
    const positionArea = document.getElementById('watermark-position-container');
    if (!positionArea) {
        console.warn('Position container not found');
        return;
    }

    let isDragging = false;
    
    function handlePointerDown(e) {
        isDragging = true;
        positionArea.setPointerCapture(e.pointerId);
        updatePosition(e);
        e.preventDefault();
    }
    
    function handlePointerMove(e) {
        if (isDragging) {
            updatePosition(e);
        }
    }
    
    function handlePointerUp(e) {
        isDragging = false;
        positionArea.releasePointerCapture(e.pointerId);
    }
    
    function updatePosition(e) {
        const rect = positionArea.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        
        watermarkPositionX = Math.max(0, Math.min(1, x));
        watermarkPositionY = Math.max(0, Math.min(1, y));
        
        updatePositionInterface();
        saveSettingsToStorage();
        debouncedUpdateMain();
    }
    
    positionArea.addEventListener('pointerdown', handlePointerDown);
    positionArea.addEventListener('pointermove', handlePointerMove);
    positionArea.addEventListener('pointerup', handlePointerUp);
    
    // Initial position setup
    updatePositionInterface();
}

function updatePositionInterface() {
    const dot = document.querySelector('#watermark-position-container .watermark-dot');
    if (dot) {
        dot.style.left = (watermarkPositionX * 100) + '%';
        dot.style.top = (watermarkPositionY * 100) + '%';
    }
}

function updatePositionInterface() {
    const watermarkDot = document.querySelector('.watermark-dot');
    if (!watermarkDot) return;
    
    // Position the dot within the padded area (10px padding)
    const padding = 10;
    const positionArea = watermarkDot.closest('.position-area');
    if (positionArea) {
        const totalWidth = positionArea.offsetWidth;
        const totalHeight = positionArea.offsetHeight;
        const availableWidth = totalWidth - (padding * 2);
        const availableHeight = totalHeight - (padding * 2);
        
        const left = padding + (watermarkPositionX * availableWidth);
        const top = padding + (watermarkPositionY * availableHeight);
        
        watermarkDot.style.left = left + 'px';
        watermarkDot.style.top = top + 'px';
    }
}

function setupPreviewPositionInterface() {
    const positionContainer = document.getElementById('preview-position-container');
    if (!positionContainer) return;
    
    const positionArea = positionContainer.querySelector('.position-area');
    const watermarkDot = positionContainer.querySelector('.watermark-dot');
    
    if (!positionArea || !watermarkDot) return;
    
    // Position the dot based on current watermark position
    updatePreviewPositionInterface();
    
    // Make the dot draggable
    let isDragging = false;
    
    // Mouse events
    watermarkDot.addEventListener('mousedown', startDrag);
    positionArea.addEventListener('mousedown', function(e) {
        if (e.target === positionArea) {
            updatePositionFromEvent(e);
            // Update preview image for clicks (with debouncer)
            debouncedUpdatePreviewImage();
        }
    });
    
    // Touch events for mobile
    watermarkDot.addEventListener('touchstart', startDrag, { passive: false });
    positionArea.addEventListener('touchstart', function(e) {
        if (e.target === positionArea) {
            updatePositionFromEvent(e);
            // Update preview image for touch taps (with debouncer)
            debouncedUpdatePreviewImage();
        }
    }, { passive: false });
    
    function startDrag(e) {
        e.preventDefault();
        isDragging = true;
        // Add both mouse and touch event listeners
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchmove', handleDrag, { passive: false });
        document.addEventListener('touchend', stopDrag);
    }
    
    function handleDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        updatePositionFromEvent(e);
    }
    
    function stopDrag() {
        isDragging = false;
        // Remove both mouse and touch event listeners
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchmove', handleDrag);
        document.removeEventListener('touchend', stopDrag);
        // Update preview image only when dragging ends (with debouncer)
        debouncedUpdatePreviewImage();
    }
    
    function updatePositionFromEvent(e) {
        const rect = positionArea.getBoundingClientRect();
        const padding = 8; // Match CSS padding for preview
        
        // Get coordinates from either mouse or touch event
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const x = clientX - rect.left - padding;
        const y = clientY - rect.top - padding;
        
        // Calculate available area (subtract padding from both sides)
        const availableWidth = rect.width - (padding * 2);
        const availableHeight = rect.height - (padding * 2);
        
        // Convert to relative coordinates (0-1)
        watermarkPositionX = Math.max(0, Math.min(1, x / availableWidth));
        watermarkPositionY = Math.max(0, Math.min(1, y / availableHeight));
        
        updatePreviewPositionInterface();
        // Preview image will update when drag ends (in stopDrag)
    }
}

function updatePreviewPositionInterface() {
    const watermarkDot = document.querySelector('#preview-position-container .watermark-dot');
    if (!watermarkDot) return;
    
    // Position the dot within the padded area (8px padding for preview)
    const padding = 8;
    const positionArea = watermarkDot.closest('.position-area');
    if (positionArea) {
        const totalWidth = positionArea.offsetWidth;
        const totalHeight = positionArea.offsetHeight;
        const availableWidth = totalWidth - (padding * 2);
        const availableHeight = totalHeight - (padding * 2);
        
        const left = padding + (watermarkPositionX * availableWidth);
        const top = padding + (watermarkPositionY * availableHeight);
        
        watermarkDot.style.left = left + 'px';
        watermarkDot.style.top = top + 'px';
    }
}
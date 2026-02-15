let watermarkImage = null;
let watermarkSize = 0.2;
let watermarkPositionX = 0.8; // Relative position (0-1) from left
let watermarkPositionY = 0.8; // Relative position (0-1) from top
let watermarkOpacity = 0.8;
let watermarkNegative = false;
let originalImages = [];
let originalImageNames = [];
let currentPreviewIndex = 0;
let currentLanguage = 'en';
let previewUpdateTimer = null; // Debouncer for preview updates

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
            document.getElementById('language-select').value = savedLang;
            changeLanguage(savedLang);
            return true;
        }
    } catch (e) {
        console.warn('Could not load language preference:', e);
    }
    return false;
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

function applyWatermark(image) {
    if (!watermarkImage) {
        return null;
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    // Draw the original image
    ctx.drawImage(image, 0, 0);
    
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

    return canvas;
}

function getWatermarkedFilename(originalFilename) {
    // Remove the file extension
    const lastDotIndex = originalFilename.lastIndexOf('.');
    const nameWithoutExt = lastDotIndex !== -1 ? originalFilename.substring(0, lastDotIndex) : originalFilename;
    const extension = lastDotIndex !== -1 ? originalFilename.substring(lastDotIndex) : '.png';
    
    return `${nameWithoutExt}_watermark${extension}`;
}

function downloadAllImages() {
    if (!watermarkImage || originalImages.length === 0) {
        alert(translations[currentLanguage]['no-images-warning']);
        return;
    }
    
    // Add a small delay between downloads to prevent browser blocking
    originalImages.forEach((img, index) => {
        setTimeout(() => {
            const canvas = applyWatermark(img);
            if (canvas) {
                const originalName = originalImageNames[index];
                const watermarkedName = getWatermarkedFilename(originalName);
                downloadImage(canvas, watermarkedName);
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
    
    const canvas = applyWatermark(originalImages[currentPreviewIndex]);
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
    
    // Set new timer for 3 seconds
    previewUpdateTimer = setTimeout(() => {
        updatePreviewImage();
        previewUpdateTimer = null;
    }, 3000);
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
    const canvas = applyWatermark(originalImages[currentPreviewIndex]);
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
        downloadImage(preview.canvas, watermarkedName);
    }
}

function updateWatermarkedImages() {
    const watermarkedContainer = document.getElementById('watermarked-image-container');
    
    if (!watermarkImage || originalImages.length === 0) {
        watermarkedContainer.innerHTML = `<h2>${translations[currentLanguage]['watermarked-images-title']}</h2>`;
        
        if (originalImages.length > 0 && !watermarkImage) {
            const message = document.createElement('p');
            message.textContent = translations[currentLanguage]['watermark-warning'];
            message.style.color = '#666';
            message.style.fontStyle = 'italic';
            message.style.marginTop = '20px';
            message.id = 'watermark-warning';
            watermarkedContainer.appendChild(message);
        }
        return;
    }
    
    // Clear everything including any warning messages
    watermarkedContainer.innerHTML = `
        <div class="results-header">
            <h2>${translations[currentLanguage]['watermarked-images-title']}</h2>
            <button class="upload-btn download-all-btn" onclick="downloadAllImages()">${translations[currentLanguage]['download-all-btn']}</button>
        </div>
    `;
    
    originalImages.forEach((img, index) => {
        const canvas = applyWatermark(img);
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

function downloadImage(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL();
    link.click();
}

function showWatermarkPreview() {
    const display = document.getElementById('watermark-display');
    
    if (watermarkImage) {
        // Show watermark image with change and clear buttons
        display.innerHTML = `
            <div class="watermark-loaded">
                <img src="${watermarkImage.src}" style="max-width: 200px; max-height: 100px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div class="watermark-actions">
                    <input type="file" id="watermark-input-change" accept="image/*" style="display: none;">
                    <label for="watermark-input-change" class="upload-btn watermark-btn change-btn">${translations[currentLanguage]['change-watermark-btn']}</label>
                    <button class="upload-btn clear-btn" onclick="clearWatermark()">${translations[currentLanguage]['clear-watermark-btn']}</button>
                </div>
            </div>
        `;
        
        // Add event listener for the new change button
        document.getElementById('watermark-input-change').addEventListener('change', handleWatermarkUpload);
    } else {
        // Show initial upload interface
        display.innerHTML = `
            <div class="watermark-placeholder">
                <input type="file" id="watermark-input" accept="image/*" style="display: none;">
                <label for="watermark-input" class="upload-btn watermark-btn">${translations[currentLanguage]['choose-watermark-btn']}</label>
                <p>${translations[currentLanguage]['watermark-instruction']}</p>
            </div>
        `;
        
        // Add event listener for the initial upload button
        document.getElementById('watermark-input').addEventListener('change', handleWatermarkUpload);
    }
}

function clearWatermark() {
    watermarkImage = null;
    clearWatermarkFromStorage();
    showWatermarkPreview();
    
    // Clear watermarked images
    const watermarkedContainer = document.getElementById('watermarked-image-container');
    watermarkedContainer.innerHTML = `<h2>${translations[currentLanguage]['watermarked-images-title']}</h2>`;
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
                updateWatermarkedImages();
            };
            watermarkImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function handleFileUpload(event) {
    const files = event.target.files;
    const imageContainer = document.getElementById('image-container');
    
    // Clear previous images but keep the heading
    imageContainer.innerHTML = `<h3>${translations[currentLanguage]['original-images-title']}</h3>`;
    originalImages = [];
    originalImageNames = [];
    
    if (files.length === 0) {
        updateWatermarkedImages();
        return;
    }
    
    let loadedCount = 0;
    const totalFiles = Array.from(files).filter(file => file.type.startsWith('image/')).length;
    
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const img = new Image();
            const reader = new FileReader();
            
            reader.onload = function(e) {
                img.src = e.target.result;
                img.onload = function() {
                    // Store original image and filename
                    originalImages.push(img);
                    originalImageNames.push(file.name);
                    
                    // Display original image in grid
                    const originalImg = img.cloneNode();
                    imageContainer.appendChild(originalImg);
                    
                    // Update watermarked images when all images are loaded
                    loadedCount++;
                    if (loadedCount === totalFiles) {
                        updateWatermarkedImages();
                    }
                };
            };
            
            reader.readAsDataURL(file);
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

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const sizeRange = document.getElementById('watermark-size');
    const opacityRange = document.getElementById('watermark-opacity');
    const negativeCheckbox = document.getElementById('watermark-negative');
    const updateBtn = document.getElementById('update-preview-btn');
    const languageSelect = document.getElementById('language-select');
    
    // Load language preference first
    loadLanguageFromStorage();
    
    // Load saved settings and watermark
    loadSettingsFromStorage();
    const hasWatermark = loadWatermarkFromStorage();
    
    fileInput.addEventListener('change', handleFileUpload);
    
    // Only update display values, not previews
    sizeRange.addEventListener('input', updateSettingsValues);
    opacityRange.addEventListener('input', updateSettingsValues);
    negativeCheckbox.addEventListener('change', updateSettingsValues);
    
    // Update previews only when button is clicked
    updateBtn.addEventListener('click', updatePreviews);
    
    // Language switcher event
    languageSelect.addEventListener('change', function() {
        changeLanguage(this.value);
    });
    
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
    const positionContainer = document.getElementById('watermark-position-container');
    if (!positionContainer) return;
    
    const positionArea = positionContainer.querySelector('.position-area');
    const watermarkDot = positionContainer.querySelector('.watermark-dot');
    
    if (!positionArea || !watermarkDot) return;
    
    // Position the dot based on current watermark position
    updatePositionInterface();
    
    // Make the dot draggable
    let isDragging = false;
    
    watermarkDot.addEventListener('mousedown', startDrag);
    positionArea.addEventListener('mousedown', function(e) {
        if (e.target === positionArea) {
            // Click on area to move dot
            updatePositionFromClick(e);
        }
    });
    
    function startDrag(e) {
        e.preventDefault();
        isDragging = true;
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', stopDrag);
    }
    
    function handleDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        updatePositionFromMouse(e);
    }
    
    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', stopDrag);
    }
    
    function updatePositionFromClick(e) {
        updatePositionFromMouse(e);
    }
    
    function updatePositionFromMouse(e) {
        const rect = positionArea.getBoundingClientRect();
        const padding = 10; // Match CSS padding
        const x = e.clientX - rect.left - padding;
        const y = e.clientY - rect.top - padding;
        
        // Calculate available area (subtract padding from both sides)
        const availableWidth = rect.width - (padding * 2);
        const availableHeight = rect.height - (padding * 2);
        
        // Convert to relative coordinates (0-1)
        watermarkPositionX = Math.max(0, Math.min(1, x / availableWidth));
        watermarkPositionY = Math.max(0, Math.min(1, y / availableHeight));
        
        updatePositionInterface();
        updateSettingsValues();
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
    
    watermarkDot.addEventListener('mousedown', startDrag);
    positionArea.addEventListener('mousedown', function(e) {
        if (e.target === positionArea) {
            updatePositionFromClick(e);
        }
    });
    
    function startDrag(e) {
        e.preventDefault();
        isDragging = true;
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', stopDrag);
    }
    
    function handleDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        updatePositionFromMouse(e);
    }
    
    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', stopDrag);
        // Update preview image only when dragging ends (with debouncer)
        debouncedUpdatePreviewImage();
    }
    
    function updatePositionFromClick(e) {
        updatePositionFromMouse(e);
        // Update preview image for clicks (with debouncer)
        debouncedUpdatePreviewImage();
    }
    
    function updatePositionFromMouse(e) {
        const rect = positionArea.getBoundingClientRect();
        const padding = 8; // Match CSS padding for preview
        const x = e.clientX - rect.left - padding;
        const y = e.clientY - rect.top - padding;
        
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
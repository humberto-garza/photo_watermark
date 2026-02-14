let watermarkImage = null;
let watermarkSize = 0.2;
let watermarkPosition = 'bottom-right';
let watermarkOpacity = 0.8;
let originalImages = [];
let originalImageNames = [];
let currentPreviewIndex = 0;

function getWatermarkPosition(canvasWidth, canvasHeight, watermarkWidth, watermarkHeight) {
    const margin = 20;
    let x, y;
    
    switch (watermarkPosition) {
        case 'top-left':
            x = margin;
            y = margin;
            break;
        case 'top-right':
            x = canvasWidth - watermarkWidth - margin;
            y = margin;
            break;
        case 'bottom-left':
            x = margin;
            y = canvasHeight - watermarkHeight - margin;
            break;
        case 'bottom-right':
            x = canvasWidth - watermarkWidth - margin;
            y = canvasHeight - watermarkHeight - margin;
            break;
        case 'center':
            x = (canvasWidth - watermarkWidth) / 2;
            y = (canvasHeight - watermarkHeight) / 2;
            break;
        default:
            x = canvasWidth - watermarkWidth - margin;
            y = canvasHeight - watermarkHeight - margin;
    }
    
    return { x, y };
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
            position: watermarkPosition,
            opacity: watermarkOpacity
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
            watermarkPosition = settings.position || 'bottom-right';
            watermarkOpacity = settings.opacity || 0.8;
            
            // Update UI elements
            document.getElementById('watermark-size').value = watermarkSize;
            document.getElementById('watermark-position').value = watermarkPosition;
            document.getElementById('watermark-opacity').value = watermarkOpacity;
            
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
    
    // Apply opacity and draw watermark
    ctx.globalAlpha = watermarkOpacity;
    ctx.drawImage(watermarkImage, position.x, position.y, watermarkWidth, watermarkHeight);
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
        alert('No watermarked images available to download.');
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
                    <h3>Full Size Preview (${currentPreviewIndex + 1} of ${originalImages.length})</h3>
                    <div class="preview-actions">
                        <button class="preview-btn download-btn" onclick="downloadImageFromPreview()">Download</button>
                        <button class="preview-btn close-btn" onclick="closeFullSizePreview()">Close</button>
                    </div>
                </div>
                <div class="preview-content">
                    <button class="nav-btn prev-btn" onclick="showPreviousImage()" ${currentPreviewIndex === 0 ? 'disabled' : ''}>
                        <span>‹</span>
                    </button>
                    <div class="preview-image-container">
                        <img src="${imageSrc}" alt="Full size watermarked image">
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
    
    // Close on backdrop click
    overlay.querySelector('.preview-backdrop').addEventListener('click', function(e) {
        if (e.target === this) {
            closeFullSizePreview();
        }
    });
    
    // Handle keyboard navigation
    document.addEventListener('keydown', handlePreviewKeydown);
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
        watermarkedContainer.innerHTML = '<h2>Watermarked Images</h2>';
        
        if (originalImages.length > 0 && !watermarkImage) {
            const message = document.createElement('p');
            message.textContent = 'Please select a watermark image to see watermarked previews.';
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
            <h2>Watermarked Images</h2>
            <button class="upload-btn download-all-btn" onclick="downloadAllImages()">Download All</button>
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
                    <label for="watermark-input-change" class="upload-btn watermark-btn change-btn">Change Watermark</label>
                    <button class="upload-btn clear-btn" onclick="clearWatermark()">Clear Watermark</button>
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
                <label for="watermark-input" class="upload-btn watermark-btn">Choose Watermark Image</label>
                <p>Select an image to use as watermark</p>
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
    watermarkedContainer.innerHTML = '<h2>Watermarked Images</h2>';
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
    imageContainer.innerHTML = '<h2>Original Images</h2>';
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
    watermarkPosition = document.getElementById('watermark-position').value;
    watermarkOpacity = parseFloat(document.getElementById('watermark-opacity').value);
    
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
    const positionSelect = document.getElementById('watermark-position');
    const opacityRange = document.getElementById('watermark-opacity');
    const updateBtn = document.getElementById('update-preview-btn');
    
    // Load saved settings and watermark
    loadSettingsFromStorage();
    const hasWatermark = loadWatermarkFromStorage();
    
    fileInput.addEventListener('change', handleFileUpload);
    
    // Only update display values, not previews
    sizeRange.addEventListener('input', updateSettingsValues);
    positionSelect.addEventListener('change', updateSettingsValues);
    opacityRange.addEventListener('input', updateSettingsValues);
    
    // Update previews only when button is clicked
    updateBtn.addEventListener('click', updatePreviews);
    
    // Initialize watermark preview if no saved watermark
    if (!hasWatermark) {
        showWatermarkPreview();
    }
    
    // Initialize display values
    updateSettingsValues();
});
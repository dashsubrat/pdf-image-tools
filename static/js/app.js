/**
 * PDF & Image Tools - Frontend JavaScript
 * Handles file uploads, drag-and-drop, tool switching, and API communication
 */

// Tool Configurations
const TOOLS = {
    // PDF Tools
    merge: {
        title: 'Merge PDF',
        uploadTitle: 'Drag & drop PDF files here',
        uploadHint: 'Maximum 100MB total • PDF files only',
        accept: '.pdf',
        multiple: true,
        minFiles: 2,
        actionText: 'Merge PDFs',
        progressText: 'Merging your PDFs...',
        successTitle: 'PDFs Merged Successfully!',
        endpoint: '/merge',
        fileKey: 'files[]',
        showReorder: true
    },
    split: {
        title: 'Split PDF',
        uploadTitle: 'Drag & drop a PDF file here',
        uploadHint: 'Maximum 100MB • PDF files only',
        accept: '.pdf',
        multiple: false,
        minFiles: 1,
        actionText: 'Split PDF',
        progressText: 'Splitting your PDF...',
        successTitle: 'PDF Split Successfully!',
        endpoint: '/split',
        fileKey: 'file',
        showReorder: false,
        options: `
            <div class="option-group">
                <label>Split Mode</label>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="splitMode" value="all" checked>
                        <span>Every Page</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="splitMode" value="chunks">
                        <span>Every N Pages</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="splitMode" value="range">
                        <span>Page Range</span>
                    </label>
                </div>
            </div>
            <div class="option-group" id="splitValueGroup" style="display: none;">
                <label id="splitValueLabel">Value</label>
                <input type="text" id="splitValue" placeholder="">
                <p class="option-description" id="splitValueDesc"></p>
            </div>
        `
    },
    compress: {
        title: 'Compress PDF',
        uploadTitle: 'Drag & drop a PDF file here',
        uploadHint: 'Maximum 100MB • PDF files only',
        accept: '.pdf',
        multiple: false,
        minFiles: 1,
        actionText: 'Compress PDF',
        progressText: 'Compressing your PDF...',
        successTitle: 'PDF Compressed Successfully!',
        endpoint: '/compress',
        fileKey: 'file',
        showReorder: false,
        options: `
            <div class="option-group">
                <label>Compression Level</label>
                <select id="compressionLevel">
                    <option value="low">Low (Better Quality)</option>
                    <option value="medium" selected>Medium (Balanced)</option>
                    <option value="high">High (Smaller Size)</option>
                </select>
            </div>
        `
    },
    rotate: {
        title: 'Rotate PDF',
        uploadTitle: 'Drag & drop a PDF file here',
        uploadHint: 'Maximum 100MB • PDF files only',
        accept: '.pdf',
        multiple: false,
        minFiles: 1,
        actionText: 'Rotate PDF',
        progressText: 'Rotating your PDF...',
        successTitle: 'PDF Rotated Successfully!',
        endpoint: '/rotate',
        fileKey: 'file',
        showReorder: false,
        options: `
            <div class="option-group">
                <label>Rotation Angle</label>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="rotation" value="90" checked>
                        <span>90° Clockwise</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="rotation" value="180">
                        <span>180°</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="rotation" value="270">
                        <span>90° Counter-clockwise</span>
                    </label>
                </div>
            </div>
            <div class="option-group">
                <label>Pages to Rotate</label>
                <input type="text" id="rotatePages" placeholder="all" value="all">
                <p class="option-description">Enter "all" or specific pages (e.g., 1,3,5-7)</p>
            </div>
        `
    },
    extract: {
        title: 'Extract Pages',
        uploadTitle: 'Drag & drop a PDF file here',
        uploadHint: 'Maximum 100MB • PDF files only',
        accept: '.pdf',
        multiple: false,
        minFiles: 1,
        actionText: 'Extract Pages',
        progressText: 'Extracting pages...',
        successTitle: 'Pages Extracted Successfully!',
        endpoint: '/extract',
        fileKey: 'file',
        showReorder: false,
        options: `
            <div class="option-group">
                <label>Pages to Extract</label>
                <input type="text" id="extractPages" placeholder="1-3,5,7-9" required>
                <p class="option-description">Enter page numbers or ranges (e.g., 1-3,5,7-9)</p>
            </div>
        `
    },
    'images-to-pdf': {
        title: 'Images to PDF',
        uploadTitle: 'Drag & drop images here',
        uploadHint: 'Maximum 100MB total • JPG, PNG, GIF, BMP, TIFF, WebP',
        accept: '.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp',
        multiple: true,
        minFiles: 1,
        actionText: 'Convert to PDF',
        progressText: 'Converting images to PDF...',
        successTitle: 'Images Converted Successfully!',
        endpoint: '/images-to-pdf',
        fileKey: 'files[]',
        showReorder: true,
        isImage: true,
        options: `
            <div class="option-group">
                <label>Page Size</label>
                <select id="pageSize">
                    <option value="A4" selected>A4</option>
                    <option value="Letter">Letter</option>
                    <option value="Legal">Legal</option>
                    <option value="A3">A3</option>
                </select>
            </div>
        `
    },

    // Image Tools
    'compress-image': {
        title: 'Compress Image',
        uploadTitle: 'Drag & drop images here',
        uploadHint: 'Maximum 50MB • JPG, PNG, WebP',
        accept: '.jpg,.jpeg,.png,.webp',
        multiple: true,
        minFiles: 1,
        actionText: 'Compress Images',
        progressText: 'Compressing images...',
        successTitle: 'Images Compressed Successfully!',
        endpoint: '/compress-image',
        fileKey: 'files[]',
        showReorder: false,
        isImage: true,
        options: `
            <div class="option-group">
                <label>Quality</label>
                <select id="imageQuality">
                    <option value="90">High (90%)</option>
                    <option value="75" selected>Medium (75%)</option>
                    <option value="50">Low (50%)</option>
                </select>
            </div>
        `
    },
    'resize-image': {
        title: 'Resize Image',
        uploadTitle: 'Drag & drop an image here',
        uploadHint: 'Maximum 50MB • JPG, PNG, WebP, GIF',
        accept: '.jpg,.jpeg,.png,.webp,.gif',
        multiple: false,
        minFiles: 1,
        actionText: 'Resize Image',
        progressText: 'Resizing image...',
        successTitle: 'Image Resized Successfully!',
        endpoint: '/resize-image',
        fileKey: 'file',
        showReorder: false,
        isImage: true,
        options: `
            <div class="option-group">
                <label>Width (px)</label>
                <input type="number" id="resizeWidth" placeholder="800">
            </div>
            <div class="option-group">
                <label>Height (px)</label>
                <input type="number" id="resizeHeight" placeholder="600">
            </div>
            <div class="option-group">
                <label class="radio-option">
                    <input type="checkbox" id="maintainAspect" checked>
                    <span>Maintain aspect ratio</span>
                </label>
            </div>
        `
    },
    'convert-image': {
        title: 'Convert Image',
        uploadTitle: 'Drag & drop images here',
        uploadHint: 'Maximum 50MB • JPG, PNG, WebP, GIF, BMP',
        accept: '.jpg,.jpeg,.png,.webp,.gif,.bmp',
        multiple: true,
        minFiles: 1,
        actionText: 'Convert Images',
        progressText: 'Converting images...',
        successTitle: 'Images Converted Successfully!',
        endpoint: '/convert-image',
        fileKey: 'files[]',
        showReorder: false,
        isImage: true,
        options: `
            <div class="option-group">
                <label>Convert to</label>
                <select id="outputFormat">
                    <option value="jpg">JPG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                </select>
            </div>
        `
    },
    'crop-image': {
        title: 'Crop Image',
        uploadTitle: 'Drag & drop an image here',
        uploadHint: 'Maximum 50MB • JPG, PNG, WebP',
        accept: '.jpg,.jpeg,.png,.webp',
        multiple: false,
        minFiles: 1,
        actionText: 'Crop Image',
        progressText: 'Cropping image...',
        successTitle: 'Image Cropped Successfully!',
        endpoint: '/crop-image',
        fileKey: 'file',
        showReorder: false,
        isImage: true,
        options: `
            <div class="option-group crop-instructions">
                <label>📐 Drag to move • Drag corners/edges to resize</label>
                <p class="option-description">Use the visual crop box on the image above to select your crop area</p>
            </div>
            <div class="option-group">
                <label>Crop Coordinates</label>
                <input type="text" id="cropArea" placeholder="0,0,100,100" readonly>
                <p class="option-description">Auto-updated from visual selection (x, y, width, height in pixels)</p>
            </div>
            <div class="option-group crop-presets">
                <label>Quick Presets</label>
                <div class="preset-buttons">
                    <button type="button" class="preset-btn" data-preset="free">Free</button>
                    <button type="button" class="preset-btn" data-preset="1:1">1:1</button>
                    <button type="button" class="preset-btn" data-preset="4:3">4:3</button>
                    <button type="button" class="preset-btn" data-preset="16:9">16:9</button>
                    <button type="button" class="preset-btn" data-preset="3:2">3:2</button>
                </div>
            </div>
        `
    },
    'watermark-image': {
        title: 'Add Watermark',
        uploadTitle: 'Drag & drop an image here',
        uploadHint: 'Maximum 50MB • JPG, PNG, WebP',
        accept: '.jpg,.jpeg,.png,.webp',
        multiple: false,
        minFiles: 1,
        actionText: 'Add Watermark',
        progressText: 'Adding watermark...',
        successTitle: 'Watermark Added Successfully!',
        endpoint: '/watermark-image',
        fileKey: 'file',
        showReorder: false,
        isImage: true,
        options: `
            <div class="option-group">
                <label>Watermark Text</label>
                <input type="text" id="watermarkText" placeholder="© Your Name">
            </div>
            <div class="option-group">
                <label>Position</label>
                <select id="watermarkPosition">
                    <option value="bottom-right" selected>Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                    <option value="center">Center</option>
                </select>
            </div>
        `
    },
    'rotate-image': {
        title: 'Rotate Image',
        uploadTitle: 'Drag & drop an image here',
        uploadHint: 'Maximum 50MB • JPG, PNG, WebP, GIF',
        accept: '.jpg,.jpeg,.png,.webp,.gif',
        multiple: false,
        minFiles: 1,
        actionText: 'Rotate Image',
        progressText: 'Rotating image...',
        successTitle: 'Image Rotated Successfully!',
        endpoint: '/rotate-image',
        fileKey: 'file',
        showReorder: false,
        isImage: true,
        options: `
            <div class="option-group">
                <label>Rotation</label>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="imageRotation" value="90" checked>
                        <span>90° Clockwise</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="imageRotation" value="180">
                        <span>180°</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="imageRotation" value="270">
                        <span>90° Counter-clockwise</span>
                    </label>
                </div>
            </div>
            <div class="option-group">
                <label class="radio-option">
                    <input type="checkbox" id="flipHorizontal">
                    <span>Flip Horizontal</span>
                </label>
            </div>
            <div class="option-group">
                <label class="radio-option">
                    <input type="checkbox" id="flipVertical">
                    <span>Flip Vertical</span>
                </label>
            </div>
        `
    }
};

// DOM Elements
const toolsHome = document.getElementById('toolsHome');
const toolWorkspace = document.getElementById('toolWorkspace');
const toolCards = document.querySelectorAll('.tool-card');
const backBtn = document.getElementById('backBtn');
const toolTitle = document.getElementById('toolTitle');
const uploadSection = document.getElementById('uploadSection');
const uploadArea = document.getElementById('uploadArea');
const uploadTitleEl = document.getElementById('uploadTitle');
const uploadHint = document.getElementById('uploadHint');
const fileInput = document.getElementById('fileInput');
const filesSection = document.getElementById('filesSection');
const fileList = document.getElementById('fileList');
const fileCount = document.getElementById('fileCount');
const dragHint = document.getElementById('dragHint');
const toolOptions = document.getElementById('toolOptions');
const addMoreBtn = document.getElementById('addMoreBtn');
const addMoreInput = document.getElementById('addMoreInput');
const clearAllBtn = document.getElementById('clearAllBtn');
const actionBtn = document.getElementById('actionBtn');
const progressSection = document.getElementById('progressSection');
const progressTitle = document.getElementById('progressTitle');
const successSection = document.getElementById('successSection');
const successTitle = document.getElementById('successTitle');
const resultStats = document.getElementById('resultStats');
const downloadBtn = document.getElementById('downloadBtn');
const processAnotherBtn = document.getElementById('processAnotherBtn');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const tryAgainBtn = document.getElementById('tryAgainBtn');
const featuresSection = document.getElementById('featuresSection');

// State
let currentTool = null;
let files = [];
let downloadUrl = '';
let draggedItem = null;

// Initialize
function init() {
    setupEventListeners();
    setupTabSwitching();
}

// Setup Tab Switching
function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            // Update button states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Update panel states
            tabPanels.forEach(panel => {
                if (panel.id === `${targetTab}-panel`) {
                    panel.classList.add('active');
                } else {
                    panel.classList.remove('active');
                }
            });
        });
    });
}

// Event Listeners Setup
function setupEventListeners() {
    // Tool card clicks
    toolCards.forEach(card => {
        card.addEventListener('click', () => {
            const tool = card.dataset.tool;
            selectTool(tool);
        });
    });

    // Back button
    backBtn.addEventListener('click', goBack);

    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    addMoreInput.addEventListener('change', handleFileSelect);

    // Upload area click - but not when clicking on the browse button or file input
    uploadArea.addEventListener('click', (e) => {
        // Don't trigger if clicking on the browse button label or the file input itself
        if (e.target.closest('.browse-btn') || e.target === fileInput) {
            return;
        }
        fileInput.click();
    });

    // Drag and drop for upload area
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Action buttons
    addMoreBtn.addEventListener('click', () => addMoreInput.click());
    clearAllBtn.addEventListener('click', clearAllFiles);
    actionBtn.addEventListener('click', processFiles);
    downloadBtn.addEventListener('click', downloadFile);
    processAnotherBtn.addEventListener('click', resetTool);
    tryAgainBtn.addEventListener('click', resetTool);

    // Prevent default drag behavior on document
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
}

// Select a tool
function selectTool(toolName) {
    currentTool = TOOLS[toolName];
    if (!currentTool) return;

    // Update UI
    toolTitle.textContent = currentTool.title;
    uploadTitleEl.textContent = currentTool.uploadTitle;
    uploadHint.textContent = currentTool.uploadHint;
    fileInput.accept = currentTool.accept;
    fileInput.multiple = currentTool.multiple;
    addMoreInput.accept = currentTool.accept;
    addMoreInput.multiple = currentTool.multiple;
    actionBtn.textContent = currentTool.actionText;
    progressTitle.textContent = currentTool.progressText;
    dragHint.style.display = currentTool.showReorder ? 'block' : 'none';

    // Show/hide add more button based on multiple file support
    addMoreBtn.style.display = currentTool.multiple ? 'inline-flex' : 'none';

    // Set tool options
    toolOptions.innerHTML = currentTool.options || '';

    // Setup tool-specific event listeners
    setupToolOptions(toolName);

    // Show workspace
    toolsHome.style.display = 'none';
    toolWorkspace.style.display = 'block';
    featuresSection.style.display = 'none';

    // Reset state
    files = [];
    downloadUrl = '';
    showUploadSection();
}

// Setup tool-specific options
function setupToolOptions(toolName) {
    if (toolName === 'split') {
        const modeRadios = document.querySelectorAll('input[name="splitMode"]');
        const valueGroup = document.getElementById('splitValueGroup');
        const valueLabel = document.getElementById('splitValueLabel');
        const valueInput = document.getElementById('splitValue');
        const valueDesc = document.getElementById('splitValueDesc');

        modeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                const mode = radio.value;
                if (mode === 'all') {
                    valueGroup.style.display = 'none';
                } else if (mode === 'chunks') {
                    valueGroup.style.display = 'block';
                    valueLabel.textContent = 'Pages per chunk';
                    valueInput.placeholder = '5';
                    valueDesc.textContent = 'Number of pages in each split file';
                } else if (mode === 'range') {
                    valueGroup.style.display = 'block';
                    valueLabel.textContent = 'Page range';
                    valueInput.placeholder = '1-3,5,7-9';
                    valueDesc.textContent = 'Pages to extract (e.g., 1-3,5,7-9)';
                }
            });
        });
    }
}

// Go back to tools home
function goBack() {
    toolsHome.style.display = 'block';
    toolWorkspace.style.display = 'none';
    featuresSection.style.display = 'block';
    currentTool = null;
    files = [];
    downloadUrl = '';
}

// Handle file selection
function handleFileSelect(e) {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
    e.target.value = '';
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('dragover');
}

// Handle drag leave
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('dragover');
}

// Handle drop
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('dragover');

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
}

// Add files to the list
function addFiles(newFiles) {
    if (!currentTool) return;

    const allowedExtensions = currentTool.accept.split(',').map(ext => ext.trim().toLowerCase());

    const validFiles = newFiles.filter(file => {
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        return allowedExtensions.includes(ext);
    });

    if (validFiles.length !== newFiles.length) {
        showNotification('Some files were skipped due to invalid format.', 'warning');
    }

    if (validFiles.length === 0) {
        return;
    }

    // For single file tools, replace existing file
    if (!currentTool.multiple) {
        files = [validFiles[0]];
    } else {
        files = [...files, ...validFiles];
    }

    updateFileList();
    showFilesSection();
}

// Update file list UI
function updateFileList() {
    fileList.innerHTML = '';

    files.forEach((file, index) => {
        const li = createFileItem(file, index);
        fileList.appendChild(li);
    });

    fileCount.textContent = `${files.length} file${files.length !== 1 ? 's' : ''}`;
    actionBtn.disabled = files.length < currentTool.minFiles;
}

// Create file item element
function createFileItem(file, index) {
    const li = document.createElement('li');
    li.className = 'file-item';
    li.dataset.index = index;

    if (currentTool.showReorder) {
        li.draggable = true;
    }

    const isImage = currentTool.isImage;
    const iconClass = isImage ? 'file-icon image-icon' : 'file-icon';
    const iconSvg = isImage ? `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
            <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="2"/>
            <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2"/>
        </svg>
    ` : `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;

    const dragHandle = currentTool.showReorder ? `
        <div class="file-drag-handle">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="4" y1="9" x2="20" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <line x1="4" y1="15" x2="20" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </div>
    ` : '';

    li.innerHTML = `
        ${dragHandle}
        <div class="${iconClass}">
            ${iconSvg}
        </div>
        <div class="file-info">
            <div class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
            <div class="file-size">${formatFileSize(file.size)}</div>
        </div>
        <button class="file-remove" data-index="${index}" title="Remove file">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>
    `;

    // Add event listeners for drag and drop reordering
    if (currentTool.showReorder) {
        li.addEventListener('dragstart', handleItemDragStart);
        li.addEventListener('dragend', handleItemDragEnd);
        li.addEventListener('dragover', handleItemDragOver);
        li.addEventListener('drop', handleItemDrop);
    }

    // Remove button
    li.querySelector('.file-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        removeFile(index);
    });

    return li;
}

// File list item drag handlers
function handleItemDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleItemDragEnd() {
    this.classList.remove('dragging');
    draggedItem = null;
    document.querySelectorAll('.file-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

function handleItemDragOver(e) {
    e.preventDefault();
    if (this !== draggedItem) {
        this.classList.add('drag-over');
    }
}

function handleItemDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    if (draggedItem && this !== draggedItem) {
        const fromIndex = parseInt(draggedItem.dataset.index);
        const toIndex = parseInt(this.dataset.index);

        const [movedFile] = files.splice(fromIndex, 1);
        files.splice(toIndex, 0, movedFile);

        updateFileList();
    }
}

// Remove file from list
function removeFile(index) {
    files.splice(index, 1);
    updateFileList();

    if (files.length === 0) {
        showUploadSection();
    }
}

// Clear all files
function clearAllFiles() {
    files = [];
    updateFileList();
    showUploadSection();
}

// Show upload section
function showUploadSection() {
    uploadSection.style.display = 'block';
    filesSection.style.display = 'none';
    progressSection.style.display = 'none';
    successSection.style.display = 'none';
    errorSection.style.display = 'none';
}

// Show files section
function showFilesSection() {
    uploadSection.style.display = 'none';
    filesSection.style.display = 'block';
    progressSection.style.display = 'none';
    successSection.style.display = 'none';
    errorSection.style.display = 'none';
}

// Process files
async function processFiles() {
    if (!currentTool || files.length < currentTool.minFiles) {
        showNotification(`Please add at least ${currentTool.minFiles} file(s)`, 'error');
        return;
    }

    // Show progress
    filesSection.style.display = 'none';
    progressSection.style.display = 'block';

    const formData = new FormData();

    // Add files
    if (currentTool.fileKey === 'files[]') {
        files.forEach(file => {
            formData.append('files[]', file);
        });
    } else {
        formData.append('file', files[0]);
    }

    // Add tool-specific options
    addToolOptions(formData);

    try {
        const response = await fetch(currentTool.endpoint, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showSuccess(result);
        } else {
            showError(result.error || 'An error occurred');
        }
    } catch (error) {
        showError('Network error. Please check your connection and try again.');
    }
}

// Add tool-specific options to form data
function addToolOptions(formData) {
    const toolName = Object.keys(TOOLS).find(key => TOOLS[key] === currentTool);

    switch (toolName) {
        case 'split':
            const splitMode = document.querySelector('input[name="splitMode"]:checked')?.value || 'all';
            const splitValue = document.getElementById('splitValue')?.value || '';
            formData.append('mode', splitMode);
            formData.append('value', splitValue);
            break;

        case 'compress':
            const level = document.getElementById('compressionLevel')?.value || 'medium';
            formData.append('level', level);
            break;

        case 'rotate':
            const rotation = document.querySelector('input[name="rotation"]:checked')?.value || '90';
            const pages = document.getElementById('rotatePages')?.value || 'all';
            formData.append('rotation', rotation);
            formData.append('pages', pages);
            break;

        case 'extract':
            const extractPages = document.getElementById('extractPages')?.value || '1';
            formData.append('pages', extractPages);
            break;

        case 'images-to-pdf':
            const pageSize = document.getElementById('pageSize')?.value || 'A4';
            formData.append('pageSize', pageSize);
            break;

        // Image Tools
        case 'compress-image':
            const imageQuality = document.getElementById('imageQuality')?.value || '75';
            formData.append('quality', imageQuality);
            break;

        case 'resize-image':
            const resizeWidth = document.getElementById('resizeWidth')?.value || '';
            const resizeHeight = document.getElementById('resizeHeight')?.value || '';
            const maintainAspect = document.getElementById('maintainAspect')?.checked ? 'true' : 'false';
            formData.append('width', resizeWidth);
            formData.append('height', resizeHeight);
            formData.append('maintainAspect', maintainAspect);
            break;

        case 'convert-image':
            const outputFormat = document.getElementById('outputFormat')?.value || 'jpg';
            formData.append('format', outputFormat);
            break;

        case 'crop-image':
            const cropArea = document.getElementById('cropArea')?.value || '0,0,100,100';
            formData.append('cropArea', cropArea);
            break;

        case 'watermark-image':
            const watermarkText = document.getElementById('watermarkText')?.value || 'Watermark';
            const watermarkPosition = document.getElementById('watermarkPosition')?.value || 'bottom-right';
            formData.append('text', watermarkText);
            formData.append('position', watermarkPosition);
            break;

        case 'rotate-image':
            const imageRotation = document.querySelector('input[name="imageRotation"]:checked')?.value || '90';
            const flipHorizontal = document.getElementById('flipHorizontal')?.checked ? 'true' : 'false';
            const flipVertical = document.getElementById('flipVertical')?.checked ? 'true' : 'false';
            formData.append('rotation', imageRotation);
            formData.append('flipHorizontal', flipHorizontal);
            formData.append('flipVertical', flipVertical);
            break;
    }
}

// Show success
function showSuccess(result) {
    progressSection.style.display = 'none';
    successSection.style.display = 'block';

    successTitle.textContent = currentTool.successTitle;
    downloadUrl = `/download/${result.session_id}/${result.filename}`;

    // Build stats based on tool type
    let statsHtml = '';
    const toolName = Object.keys(TOOLS).find(key => TOOLS[key] === currentTool);

    switch (toolName) {
        case 'merge':
            statsHtml = `
                <div class="stat">
                    <div class="stat-value">${result.files_merged}</div>
                    <div class="stat-label">Files Merged</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${result.total_pages}</div>
                    <div class="stat-label">Total Pages</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${formatFileSize(result.file_size)}</div>
                    <div class="stat-label">File Size</div>
                </div>
            `;
            break;

        case 'split':
            statsHtml = `
                <div class="stat">
                    <div class="stat-value">${result.total_pages}</div>
                    <div class="stat-label">Original Pages</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${result.files_created}</div>
                    <div class="stat-label">Files Created</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${formatFileSize(result.file_size)}</div>
                    <div class="stat-label">${result.is_zip ? 'ZIP Size' : 'File Size'}</div>
                </div>
            `;
            break;

        case 'compress':
            statsHtml = `
                <div class="stat">
                    <div class="stat-value">${formatFileSize(result.original_size)}</div>
                    <div class="stat-label">Original Size</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${formatFileSize(result.compressed_size)}</div>
                    <div class="stat-label">Compressed Size</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${result.reduction}%</div>
                    <div class="stat-label">Size Reduction</div>
                </div>
            `;
            break;

        case 'rotate':
            statsHtml = `
                <div class="stat">
                    <div class="stat-value">${result.total_pages}</div>
                    <div class="stat-label">Total Pages</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${result.rotated_pages}</div>
                    <div class="stat-label">Pages Rotated</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${formatFileSize(result.file_size)}</div>
                    <div class="stat-label">File Size</div>
                </div>
            `;
            break;

        case 'extract':
            statsHtml = `
                <div class="stat">
                    <div class="stat-value">${result.total_pages}</div>
                    <div class="stat-label">Original Pages</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${result.extracted_pages}</div>
                    <div class="stat-label">Pages Extracted</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${formatFileSize(result.file_size)}</div>
                    <div class="stat-label">File Size</div>
                </div>
            `;
            break;

        case 'images-to-pdf':
            statsHtml = `
                <div class="stat">
                    <div class="stat-value">${result.images_converted}</div>
                    <div class="stat-label">Images Converted</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${formatFileSize(result.file_size)}</div>
                    <div class="stat-label">PDF Size</div>
                </div>
            `;
            break;

        // Image Tools
        case 'compress-image':
            statsHtml = `
                <div class="stat">
                    <div class="stat-value">${result.images_processed || 1}</div>
                    <div class="stat-label">Images Processed</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${formatFileSize(result.original_size)}</div>
                    <div class="stat-label">Original Size</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${result.reduction}%</div>
                    <div class="stat-label">Size Reduction</div>
                </div>
            `;
            break;

        case 'resize-image':
            statsHtml = `
                <div class="stat">
                    <div class="stat-value">${result.original_dimensions}</div>
                    <div class="stat-label">Original Size</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${result.new_dimensions}</div>
                    <div class="stat-label">New Size</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${formatFileSize(result.file_size)}</div>
                    <div class="stat-label">File Size</div>
                </div>
            `;
            break;

        case 'convert-image':
            statsHtml = `
                <div class="stat">
                    <div class="stat-value">${result.images_converted || 1}</div>
                    <div class="stat-label">Images Converted</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${result.output_format}</div>
                    <div class="stat-label">Output Format</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${formatFileSize(result.file_size)}</div>
                    <div class="stat-label">File Size</div>
                </div>
            `;
            break;

        case 'crop-image':
            statsHtml = `
                <div class="stat">
                    <div class="stat-value">${result.original_dimensions}</div>
                    <div class="stat-label">Original Size</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${result.crop_dimensions}</div>
                    <div class="stat-label">Cropped Size</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${formatFileSize(result.file_size)}</div>
                    <div class="stat-label">File Size</div>
                </div>
            `;
            break;

        case 'watermark-image':
            statsHtml = `
                <div class="stat">
                    <div class="stat-value">"${result.watermark_text}"</div>
                    <div class="stat-label">Watermark Text</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${result.watermark_position}</div>
                    <div class="stat-label">Position</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${formatFileSize(result.file_size)}</div>
                    <div class="stat-label">File Size</div>
                </div>
            `;
            break;

        case 'rotate-image':
            statsHtml = `
                <div class="stat">
                    <div class="stat-value">${result.rotation}°</div>
                    <div class="stat-label">Rotation</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${result.flipped_horizontal ? 'Yes' : 'No'}</div>
                    <div class="stat-label">Flipped H</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${formatFileSize(result.file_size)}</div>
                    <div class="stat-label">File Size</div>
                </div>
            `;
            break;

        default:
            statsHtml = `
                <div class="stat">
                    <div class="stat-value">${formatFileSize(result.file_size)}</div>
                    <div class="stat-label">File Size</div>
                </div>
            `;
    }

    resultStats.innerHTML = statsHtml;
}

// Download file
function downloadFile() {
    if (downloadUrl) {
        window.location.href = downloadUrl;
    }
}

// Show error
function showError(message) {
    progressSection.style.display = 'none';
    filesSection.style.display = 'none';
    errorSection.style.display = 'block';
    errorMessage.textContent = message;
}

// Reset tool
function resetTool() {
    files = [];
    downloadUrl = '';
    showUploadSection();
    updateFileList();

    // Reset tool options
    if (currentTool && currentTool.options) {
        toolOptions.innerHTML = currentTool.options;
        const toolName = Object.keys(TOOLS).find(key => TOOLS[key] === currentTool);
        setupToolOptions(toolName);
    }
}

// Utility: Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utility: Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#10b981'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    notification.textContent = message;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    }, 3000);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);

// =============================================
// IMAGE PREVIEW & CROP TOOL FUNCTIONALITY
// =============================================

// Image Preview Elements (will be initialized after DOM ready)
let imagePreviewSection, imagePreviewContainer, previewImage, cropOverlay, cropBox, cropInfo;
let imageDimensions, imageSizeEl;
let cropToolInitialized = false;

// Crop state
let cropState = {
    active: false,
    startX: 0,
    startY: 0,
    currentHandle: null,
    cropRect: { x: 0, y: 0, width: 100, height: 100 },
    imageWidth: 0,
    imageHeight: 0,
    containerWidth: 0,
    containerHeight: 0,
    scale: 1,
    initialCropRect: { x: 0, y: 0, width: 0, height: 0 }
};

// Initialize image preview elements
function initImagePreview() {
    imagePreviewSection = document.getElementById('imagePreviewSection');
    imagePreviewContainer = document.getElementById('imagePreviewContainer');
    previewImage = document.getElementById('previewImage');
    cropOverlay = document.getElementById('cropOverlay');
    cropBox = document.getElementById('cropBox');
    cropInfo = document.getElementById('cropInfo');
    imageDimensions = document.getElementById('imageDimensions');
    imageSizeEl = document.getElementById('imageSize');
}

// Show image preview for single-file image tools
function showImagePreview(file) {
    if (!file || !currentTool || !currentTool.isImage) return;

    // Initialize elements if not done
    if (!imagePreviewSection) {
        initImagePreview();
    }

    if (!imagePreviewSection) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewImage.onload = () => {
            // Store original image dimensions
            cropState.imageWidth = previewImage.naturalWidth;
            cropState.imageHeight = previewImage.naturalHeight;

            // Show preview section first so layout is calculated
            imagePreviewSection.style.display = 'block';

            // Use requestAnimationFrame to ensure layout is complete
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // Get rendered dimensions after layout
                    const imgRect = previewImage.getBoundingClientRect();
                    cropState.containerWidth = imgRect.width;
                    cropState.containerHeight = imgRect.height;
                    cropState.scale = cropState.containerWidth / cropState.imageWidth;

                    console.log('Image dimensions:', cropState.imageWidth, 'x', cropState.imageHeight);
                    console.log('Container dimensions:', cropState.containerWidth, 'x', cropState.containerHeight);
                    console.log('Scale:', cropState.scale);

                    // Update image info
                    if (imageDimensions) {
                        imageDimensions.textContent = `${cropState.imageWidth} × ${cropState.imageHeight} px`;
                    }
                    if (imageSizeEl) {
                        imageSizeEl.textContent = formatFileSize(file.size);
                    }

                    // Initialize crop tool if this is crop-image tool
                    const toolName = Object.keys(TOOLS).find(key => TOOLS[key] === currentTool);
                    if (toolName === 'crop-image') {
                        // Setup crop tool if not already done
                        if (!cropToolInitialized) {
                            setupCropTool();
                            cropToolInitialized = true;
                        }

                        // Only show crop overlay if we have valid dimensions
                        if (cropState.containerWidth > 0 && cropState.containerHeight > 0) {
                            initCropArea();
                            cropOverlay.style.display = 'block';
                        } else {
                            console.error('Invalid container dimensions for crop');
                            cropOverlay.style.display = 'none';
                        }
                    } else {
                        if (cropOverlay) cropOverlay.style.display = 'none';
                    }

                    // Add watermark preview for watermark tool
                    if (toolName === 'watermark-image') {
                        setupWatermarkPreview();
                    }

                    // Add rotation preview for rotate tool
                    if (toolName === 'rotate-image') {
                        setupRotationPreview();
                    }
                });
            });
        };
    };
    reader.readAsDataURL(file);
}

// Hide image preview
function hideImagePreview() {
    if (imagePreviewSection) {
        imagePreviewSection.style.display = 'none';
    }
    if (cropOverlay) {
        cropOverlay.style.display = 'none';
    }
    // Remove any dynamic preview elements
    const watermarkPreview = document.querySelector('.watermark-preview');
    if (watermarkPreview) watermarkPreview.remove();

    // Reset container classes
    if (imagePreviewContainer) {
        imagePreviewContainer.className = 'image-preview-container';
    }

    // Reset crop state
    cropState.active = false;
}

// Initialize crop area to default position
function initCropArea() {
    if (!cropBox || !cropOverlay) return;

    const padding = Math.min(20, cropState.containerWidth * 0.1, cropState.containerHeight * 0.1);
    const maxWidth = cropState.containerWidth - (padding * 2);
    const maxHeight = cropState.containerHeight - (padding * 2);

    // Start with most of the image
    cropState.cropRect = {
        x: padding,
        y: padding,
        width: Math.max(50, maxWidth),
        height: Math.max(50, maxHeight)
    };

    updateCropAreaUI();
    updateCropInput();
}

// Update crop area visual
function updateCropAreaUI() {
    if (!cropBox) return;

    cropBox.style.left = cropState.cropRect.x + 'px';
    cropBox.style.top = cropState.cropRect.y + 'px';
    cropBox.style.width = cropState.cropRect.width + 'px';
    cropBox.style.height = cropState.cropRect.height + 'px';

    // Update crop info display (in actual image pixels)
    const actualWidth = Math.round(cropState.cropRect.width / cropState.scale);
    const actualHeight = Math.round(cropState.cropRect.height / cropState.scale);
    if (cropInfo) {
        cropInfo.textContent = `${actualWidth} × ${actualHeight}`;
    }
}

// Update crop input field with actual pixel values
function updateCropInput() {
    const cropInput = document.getElementById('cropArea');
    if (!cropInput) return;

    const actualX = Math.round(cropState.cropRect.x / cropState.scale);
    const actualY = Math.round(cropState.cropRect.y / cropState.scale);
    const actualWidth = Math.round(cropState.cropRect.width / cropState.scale);
    const actualHeight = Math.round(cropState.cropRect.height / cropState.scale);

    cropInput.value = `${actualX},${actualY},${actualWidth},${actualHeight}`;
}

// Get mouse position relative to the image container
function getRelativePosition(e) {
    // Use the preview image's bounding rect for accurate positioning
    const rect = previewImage.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

// Setup crop tool event listeners
function setupCropTool() {
    if (!cropBox || !cropOverlay) {
        console.log('Crop elements not found');
        return;
    }

    console.log('Setting up crop tool');

    // Mouse events for crop box (move) - check if NOT clicking on a handle
    cropBox.addEventListener('mousedown', function(e) {
        // Check if clicking on a handle
        if (e.target.classList.contains('crop-handle')) {
            return; // Let the handle's own event listener handle it
        }

        e.preventDefault();
        e.stopPropagation();

        const pos = getRelativePosition(e);
        cropState.active = true;
        cropState.currentHandle = 'move';
        cropState.offsetX = pos.x - cropState.cropRect.x;
        cropState.offsetY = pos.y - cropState.cropRect.y;
        cropBox.style.cursor = 'grabbing';
    });

    // Mouse events for handles
    const handles = cropBox.querySelectorAll('.crop-handle');
    handles.forEach(handle => {
        handle.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();

            cropState.active = true;
            cropState.currentHandle = this.dataset.handle;
            cropState.startRect = { ...cropState.cropRect };
            cropState.startPos = getRelativePosition(e);
        });
    });

    // Global mouse events
    document.addEventListener('mousemove', handleCropMouseMove);
    document.addEventListener('mouseup', handleCropMouseUp);

    // Touch events for mobile - check if NOT touching a handle
    cropBox.addEventListener('touchstart', function(e) {
        if (e.target.classList.contains('crop-handle')) {
            return;
        }

        e.preventDefault();
        const touch = e.touches[0];
        const pos = getRelativePosition(touch);
        cropState.active = true;
        cropState.currentHandle = 'move';
        cropState.offsetX = pos.x - cropState.cropRect.x;
        cropState.offsetY = pos.y - cropState.cropRect.y;
    }, { passive: false });

    handles.forEach(handle => {
        handle.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const touch = e.touches[0];
            cropState.active = true;
            cropState.currentHandle = this.dataset.handle;
            cropState.startRect = { ...cropState.cropRect };
            cropState.startPos = getRelativePosition(touch);
        }, { passive: false });
    });

    document.addEventListener('touchmove', function(e) {
        if (!cropState.active) return;
        e.preventDefault();
        const touch = e.touches[0];
        handleCropMove(touch);
    }, { passive: false });

    document.addEventListener('touchend', handleCropMouseUp);
}

// Handle mouse move during crop
function handleCropMouseMove(e) {
    if (!cropState.active) return;
    e.preventDefault();
    handleCropMove(e);
}

// Handle crop move (shared between mouse and touch)
function handleCropMove(e) {
    if (!cropState.active || !imagePreviewContainer) return;

    const pos = getRelativePosition(e);
    const minSize = 30;

    if (cropState.currentHandle === 'move') {
        // Move the crop box
        let newX = pos.x - cropState.offsetX;
        let newY = pos.y - cropState.offsetY;

        // Constrain to container bounds
        newX = Math.max(0, Math.min(newX, cropState.containerWidth - cropState.cropRect.width));
        newY = Math.max(0, Math.min(newY, cropState.containerHeight - cropState.cropRect.height));

        cropState.cropRect.x = newX;
        cropState.cropRect.y = newY;
    } else {
        // Resize based on handle
        const handle = cropState.currentHandle;
        const startRect = cropState.startRect;
        const startPos = cropState.startPos;
        const dx = pos.x - startPos.x;
        const dy = pos.y - startPos.y;

        let newX = startRect.x;
        let newY = startRect.y;
        let newWidth = startRect.width;
        let newHeight = startRect.height;

        // Handle horizontal resizing
        if (handle.includes('w')) {
            newX = Math.min(startRect.x + dx, startRect.x + startRect.width - minSize);
            newX = Math.max(0, newX);
            newWidth = startRect.x + startRect.width - newX;
        } else if (handle.includes('e')) {
            newWidth = Math.max(minSize, startRect.width + dx);
            newWidth = Math.min(newWidth, cropState.containerWidth - startRect.x);
        }

        // Handle vertical resizing
        if (handle.includes('n')) {
            newY = Math.min(startRect.y + dy, startRect.y + startRect.height - minSize);
            newY = Math.max(0, newY);
            newHeight = startRect.y + startRect.height - newY;
        } else if (handle.includes('s')) {
            newHeight = Math.max(minSize, startRect.height + dy);
            newHeight = Math.min(newHeight, cropState.containerHeight - startRect.y);
        }

        cropState.cropRect.x = newX;
        cropState.cropRect.y = newY;
        cropState.cropRect.width = newWidth;
        cropState.cropRect.height = newHeight;
    }

    updateCropAreaUI();
    updateCropInput();
}

// Handle mouse up - stop crop operation
function handleCropMouseUp() {
    if (cropState.active) {
        cropState.active = false;
        cropState.currentHandle = null;
        if (cropBox) {
            cropBox.style.cursor = 'move';
        }
    }
}

// Setup watermark preview
function setupWatermarkPreview() {
    // Remove existing preview
    let preview = document.querySelector('.watermark-preview');
    if (!preview) {
        preview = document.createElement('div');
        preview.className = 'watermark-preview bottom-right';
        imagePreviewContainer.appendChild(preview);
    }

    // Update preview on input change
    const textInput = document.getElementById('watermarkText');
    const positionSelect = document.getElementById('watermarkPosition');

    if (textInput) {
        textInput.addEventListener('input', updateWatermarkPreview);
        preview.textContent = textInput.value || '© Your Name';
    }

    if (positionSelect) {
        positionSelect.addEventListener('change', updateWatermarkPreview);
    }
}

function updateWatermarkPreview() {
    const preview = document.querySelector('.watermark-preview');
    if (!preview) return;

    const textInput = document.getElementById('watermarkText');
    const positionSelect = document.getElementById('watermarkPosition');

    if (textInput) {
        preview.textContent = textInput.value || '© Your Name';
    }

    if (positionSelect) {
        preview.className = 'watermark-preview ' + positionSelect.value;
    }
}

// Setup rotation preview
function setupRotationPreview() {
    // Listen for rotation changes
    const rotationRadios = document.querySelectorAll('input[name="imageRotation"]');
    const flipHCheckbox = document.getElementById('flipHorizontal');
    const flipVCheckbox = document.getElementById('flipVertical');

    rotationRadios.forEach(radio => {
        radio.addEventListener('change', updateRotationPreview);
    });

    if (flipHCheckbox) {
        flipHCheckbox.addEventListener('change', updateRotationPreview);
    }

    if (flipVCheckbox) {
        flipVCheckbox.addEventListener('change', updateRotationPreview);
    }

    // Initial preview
    updateRotationPreview();
}

function updateRotationPreview() {
    if (!imagePreviewContainer) return;

    // Remove existing classes
    imagePreviewContainer.classList.remove('rotate-90', 'rotate-180', 'rotate-270', 'flip-h', 'flip-v');

    // Get current rotation
    const rotationRadio = document.querySelector('input[name="imageRotation"]:checked');
    const rotation = rotationRadio ? rotationRadio.value : '0';

    // Get flip states
    const flipH = document.getElementById('flipHorizontal')?.checked;
    const flipV = document.getElementById('flipVertical')?.checked;

    // Apply rotation class
    if (rotation === '90') {
        imagePreviewContainer.classList.add('rotate-90');
    } else if (rotation === '180') {
        imagePreviewContainer.classList.add('rotate-180');
    } else if (rotation === '270') {
        imagePreviewContainer.classList.add('rotate-270');
    }

    // Apply flip classes
    if (flipH) {
        imagePreviewContainer.classList.add('flip-h');
    }
    if (flipV) {
        imagePreviewContainer.classList.add('flip-v');
    }
}

// Override the original updateFileList to include image preview
const originalUpdateFileList = updateFileList;
updateFileList = function () {
    originalUpdateFileList();

    // Show image preview for single-file image tools
    if (currentTool && currentTool.isImage && !currentTool.multiple && files.length === 1) {
        showImagePreview(files[0]);
    } else {
        hideImagePreview();
    }
};

// Override resetTool to hide image preview
const originalResetTool = resetTool;
resetTool = function () {
    hideImagePreview();
    originalResetTool();
};

// Override goBack to hide image preview
const originalGoBack = goBack;
goBack = function () {
    hideImagePreview();
    originalGoBack();
};

// Initialize image preview elements on DOM ready
document.addEventListener('DOMContentLoaded', initImagePreview);

// =============================================
// CROP PRESET FUNCTIONALITY
// =============================================

// Current aspect ratio constraint (null = free)
let cropAspectRatio = null;

// Setup preset buttons event listeners
function setupCropPresets() {
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active state
            presetBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const preset = this.dataset.preset;
            applyPreset(preset);
        });
    });

    // Set Free as default active
    const freeBtn = document.querySelector('.preset-btn[data-preset="free"]');
    if (freeBtn) freeBtn.classList.add('active');
}

// Apply aspect ratio preset
function applyPreset(preset) {
    if (!cropState.containerWidth || !cropState.containerHeight) return;

    if (preset === 'free') {
        cropAspectRatio = null;
        return;
    }

    // Parse aspect ratio
    const parts = preset.split(':');
    const ratioWidth = parseInt(parts[0]);
    const ratioHeight = parseInt(parts[1]);
    cropAspectRatio = ratioWidth / ratioHeight;

    // Calculate new crop area maintaining aspect ratio
    const currentCenterX = cropState.cropRect.x + cropState.cropRect.width / 2;
    const currentCenterY = cropState.cropRect.y + cropState.cropRect.height / 2;

    let newWidth, newHeight;

    // Try to fit the aspect ratio within current area
    if (cropState.cropRect.width / cropState.cropRect.height > cropAspectRatio) {
        // Current area is wider, constrain by height
        newHeight = cropState.cropRect.height;
        newWidth = newHeight * cropAspectRatio;
    } else {
        // Current area is taller, constrain by width
        newWidth = cropState.cropRect.width;
        newHeight = newWidth / cropAspectRatio;
    }

    // Ensure it fits within container
    if (newWidth > cropState.containerWidth) {
        newWidth = cropState.containerWidth - 20;
        newHeight = newWidth / cropAspectRatio;
    }
    if (newHeight > cropState.containerHeight) {
        newHeight = cropState.containerHeight - 20;
        newWidth = newHeight * cropAspectRatio;
    }

    // Calculate new position centered around current center
    let newX = currentCenterX - newWidth / 2;
    let newY = currentCenterY - newHeight / 2;

    // Constrain to bounds
    newX = Math.max(0, Math.min(newX, cropState.containerWidth - newWidth));
    newY = Math.max(0, Math.min(newY, cropState.containerHeight - newHeight));

    cropState.cropRect = {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
    };

    updateCropAreaUI();
    updateCropInput();
}

// Override handleCropMove to respect aspect ratio
const originalHandleCropMove = handleCropMove;
handleCropMove = function(e) {
    if (!cropState.active || !imagePreviewContainer) return;

    const pos = getRelativePosition(e);
    const minSize = 30;

    if (cropState.currentHandle === 'move') {
        // Move the crop box (no aspect ratio constraint needed)
        let newX = pos.x - cropState.offsetX;
        let newY = pos.y - cropState.offsetY;

        // Constrain to container bounds
        newX = Math.max(0, Math.min(newX, cropState.containerWidth - cropState.cropRect.width));
        newY = Math.max(0, Math.min(newY, cropState.containerHeight - cropState.cropRect.height));

        cropState.cropRect.x = newX;
        cropState.cropRect.y = newY;
    } else if (cropAspectRatio) {
        // Resize with aspect ratio constraint
        const handle = cropState.currentHandle;
        const startRect = cropState.startRect;
        const startPos = cropState.startPos;
        const dx = pos.x - startPos.x;
        const dy = pos.y - startPos.y;

        let newX = startRect.x;
        let newY = startRect.y;
        let newWidth = startRect.width;
        let newHeight = startRect.height;

        // Determine primary direction based on handle
        if (handle === 'se' || handle === 'e' || handle === 's') {
            // Expanding from bottom-right
            newWidth = Math.max(minSize, startRect.width + dx);
            newHeight = newWidth / cropAspectRatio;

            // Check bounds
            if (newX + newWidth > cropState.containerWidth) {
                newWidth = cropState.containerWidth - newX;
                newHeight = newWidth / cropAspectRatio;
            }
            if (newY + newHeight > cropState.containerHeight) {
                newHeight = cropState.containerHeight - newY;
                newWidth = newHeight * cropAspectRatio;
            }
        } else if (handle === 'nw' || handle === 'w' || handle === 'n') {
            // Contracting from top-left
            newWidth = Math.max(minSize, startRect.width - dx);
            newHeight = newWidth / cropAspectRatio;
            newX = startRect.x + startRect.width - newWidth;
            newY = startRect.y + startRect.height - newHeight;

            // Check bounds
            if (newX < 0) {
                newX = 0;
                newWidth = startRect.x + startRect.width;
                newHeight = newWidth / cropAspectRatio;
                newY = startRect.y + startRect.height - newHeight;
            }
            if (newY < 0) {
                newY = 0;
                newHeight = startRect.y + startRect.height;
                newWidth = newHeight * cropAspectRatio;
                newX = startRect.x + startRect.width - newWidth;
            }
        } else if (handle === 'ne') {
            // Expanding from top-right
            newWidth = Math.max(minSize, startRect.width + dx);
            newHeight = newWidth / cropAspectRatio;
            newY = startRect.y + startRect.height - newHeight;

            if (newX + newWidth > cropState.containerWidth) {
                newWidth = cropState.containerWidth - newX;
                newHeight = newWidth / cropAspectRatio;
                newY = startRect.y + startRect.height - newHeight;
            }
            if (newY < 0) {
                newY = 0;
                newHeight = startRect.y + startRect.height;
                newWidth = newHeight * cropAspectRatio;
            }
        } else if (handle === 'sw') {
            // Expanding from bottom-left
            newWidth = Math.max(minSize, startRect.width - dx);
            newHeight = newWidth / cropAspectRatio;
            newX = startRect.x + startRect.width - newWidth;

            if (newX < 0) {
                newX = 0;
                newWidth = startRect.x + startRect.width;
                newHeight = newWidth / cropAspectRatio;
            }
            if (newY + newHeight > cropState.containerHeight) {
                newHeight = cropState.containerHeight - newY;
                newWidth = newHeight * cropAspectRatio;
                newX = startRect.x + startRect.width - newWidth;
            }
        }

        cropState.cropRect.x = newX;
        cropState.cropRect.y = newY;
        cropState.cropRect.width = newWidth;
        cropState.cropRect.height = newHeight;
    } else {
        // Free resize (original behavior)
        const handle = cropState.currentHandle;
        const startRect = cropState.startRect;
        const startPos = cropState.startPos;
        const dx = pos.x - startPos.x;
        const dy = pos.y - startPos.y;

        let newX = startRect.x;
        let newY = startRect.y;
        let newWidth = startRect.width;
        let newHeight = startRect.height;

        // Handle horizontal resizing
        if (handle.includes('w')) {
            newX = Math.min(startRect.x + dx, startRect.x + startRect.width - minSize);
            newX = Math.max(0, newX);
            newWidth = startRect.x + startRect.width - newX;
        } else if (handle.includes('e')) {
            newWidth = Math.max(minSize, startRect.width + dx);
            newWidth = Math.min(newWidth, cropState.containerWidth - startRect.x);
        }

        // Handle vertical resizing
        if (handle.includes('n')) {
            newY = Math.min(startRect.y + dy, startRect.y + startRect.height - minSize);
            newY = Math.max(0, newY);
            newHeight = startRect.y + startRect.height - newY;
        } else if (handle.includes('s')) {
            newHeight = Math.max(minSize, startRect.height + dy);
            newHeight = Math.min(newHeight, cropState.containerHeight - startRect.y);
        }

        cropState.cropRect.x = newX;
        cropState.cropRect.y = newY;
        cropState.cropRect.width = newWidth;
        cropState.cropRect.height = newHeight;
    }

    updateCropAreaUI();
    updateCropInput();
};

// Setup crop presets when tool options are rendered
const originalSetupToolOptions = setupToolOptions;
setupToolOptions = function(toolName) {
    originalSetupToolOptions(toolName);

    if (toolName === 'crop-image') {
        // Wait for DOM to update
        setTimeout(() => {
            setupCropPresets();
            cropAspectRatio = null; // Reset to free
        }, 100);
    }
};

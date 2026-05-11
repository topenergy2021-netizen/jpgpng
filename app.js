document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const tabToPng = document.getElementById('tab-to-png');
    const tabToJpeg = document.getElementById('tab-to-jpeg');
    const tabToWebp = document.getElementById('tab-to-webp');
    
    const dropzoneContent = document.getElementById('dropzone-content');
    const previewContent = document.getElementById('preview-content');
    const processingContent = document.getElementById('processing-content');
    
    const fileListContainer = document.getElementById('file-list');
    const convertBtn = document.getElementById('convert-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    const qualityContainer = document.getElementById('quality-container');
    const qualityRange = document.getElementById('quality-range');
    const qualityValue = document.getElementById('quality-value');
    
    const canvas = document.getElementById('conversion-canvas');
    const ctx = canvas.getContext('2d');

    // --- State ---
    let currentMode = 'to-png'; 
    let filesList = []; // Array of File objects

    // --- Tab Switching ---
    const updateTabStyles = () => {
        const tabs = [
            { el: tabToPng, mode: 'to-png' },
            { el: tabToJpeg, mode: 'to-jpeg' },
            { el: tabToWebp, mode: 'to-webp' }
        ];
        tabs.forEach(tab => {
            if (tab.mode === currentMode) {
                tab.el.classList.add('text-primary', 'border-b-2', 'border-primary', 'bg-white', 'font-bold');
                tab.el.classList.remove('text-gray-500', 'font-medium');
            } else {
                tab.el.classList.remove('text-primary', 'border-b-2', 'border-primary', 'bg-white', 'font-bold');
                tab.el.classList.add('text-gray-500', 'font-medium');
            }
        });
    };

    const setMode = (mode) => {
        currentMode = mode;
        updateTabStyles();
        qualityContainer.classList.toggle('hidden', mode === 'to-png');
        if (filesList.length > 0) updateFileListUI();
    };

    tabToPng.addEventListener('click', () => setMode('to-png'));
    tabToJpeg.addEventListener('click', () => setMode('to-jpeg'));
    tabToWebp.addEventListener('click', () => setMode('to-webp'));

    // --- File Handling ---
    const handleFiles = (files) => {
        const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (newFiles.length === 0) return;

        filesList = [...filesList, ...newFiles];
        updateFileListUI();
        showPreview();
    };

    const updateFileListUI = () => {
        fileListContainer.innerHTML = '';
        filesList.forEach((file, index) => {
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center bg-white p-3 rounded border border-gray-100 text-sm animate-fade-in shadow-sm';
            
            const ext = currentMode === 'to-png' ? 'PNG' : (currentMode === 'to-jpeg' ? 'JPEG' : 'WEBP');
            
            div.innerHTML = `
                <div class="flex items-center gap-3 overflow-hidden">
                    <span class="material-symbols-outlined text-gray-400">image</span>
                    <span class="truncate font-medium text-gray-700">${file.name}</span>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                    <span class="text-[10px] font-bold text-primary bg-primary-container/30 px-2 py-0.5 rounded">→ ${ext}</span>
                    <button class="text-gray-300 hover:text-red-500 transition-colors remove-file" data-index="${index}">
                        <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            `;
            fileListContainer.appendChild(div);
        });

        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-file').forEach(btn => {
            btn.onclick = (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                filesList.splice(idx, 1);
                if (filesList.length === 0) resetUI();
                else updateFileListUI();
            };
        });
    };

    // --- UI States ---
    const showPreview = () => {
        dropzoneContent.classList.add('hidden');
        previewContent.classList.remove('hidden');
        processingContent.classList.add('hidden');
    };

    const showProcessing = () => {
        previewContent.classList.add('hidden');
        processingContent.classList.remove('hidden');
    };

    const resetUI = () => {
        filesList = [];
        fileListContainer.innerHTML = '';
        previewContent.classList.add('hidden');
        processingContent.classList.add('hidden');
        dropzoneContent.classList.remove('hidden');
        fileInput.value = '';
    };

    resetBtn.onclick = resetUI;

    // --- Dropzone Logic ---
    dropzone.onclick = (e) => {
        if (!previewContent.contains(e.target)) fileInput.click();
    };

    fileInput.onchange = (e) => handleFiles(e.target.files);

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
        dropzone.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); });
    });

    ['dragenter', 'dragover'].forEach(evt => {
        dropzone.addEventListener(evt, () => dropzone.classList.add('dropzone-active'));
    });

    ['dragleave', 'drop'].forEach(evt => {
        dropzone.addEventListener(evt, () => dropzone.classList.remove('dropzone-active'));
    });

    dropzone.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));

    qualityRange.oninput = (e) => qualityValue.textContent = `${e.target.value}%`;

    // --- Core Conversion Logic ---
    const processImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    if (currentMode === 'to-jpeg') {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    } else {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                    
                    ctx.drawImage(img, 0, 0);
                    
                    const quality = parseInt(qualityRange.value) / 100;
                    const mime = currentMode === 'to-png' ? 'image/png' : (currentMode === 'to-jpeg' ? 'image/jpeg' : 'image/webp');
                    const extension = currentMode === 'to-png' ? 'png' : (currentMode === 'to-jpeg' ? 'jpeg' : 'webp');
                    
                    const dataUrl = canvas.toDataURL(mime, quality);
                    const base64 = dataUrl.split(',')[1];
                    const fileName = file.name.split('.').slice(0, -1).join('.') + '-converted.' + extension;
                    
                    resolve({ name: fileName, data: base64 });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    convertBtn.onclick = async () => {
        if (filesList.length === 0) return;
        
        showProcessing();
        const zip = new JSZip();
        
        for (const file of filesList) {
            const result = await processImage(file);
            zip.file(result.name, result.data, { base64: true });
        }
        
        zip.generateAsync({ type: 'blob' }).then((content) => {
            saveAs(content, "imagens_convertidas.zip");
            resetUI();
        });
    };
});

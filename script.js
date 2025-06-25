// editIQ Video Editor - Main JavaScript
// Created by Noskam Amkahc

class EditIQ {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvasOverlay = document.getElementById('canvasOverlay');
        this.elements = [];
        this.selectedElement = null;
        this.isDragging = false;
        this.isResizing = false;
        this.dragOffset = { x: 0, y: 0 };
        this.zoom = 1;
        this.timeline = {
            currentTime: 0,
            totalTime: 30,
            isPlaying: false,
            tracks: {
                video: [],
                audio: [],
                text: []
            }
        };
        this.mediaLibrary = [];
        this.animationPresets = [
            'fadeIn', 'slideInLeft', 'slideInRight', 'slideInUp', 'slideInDown',
            'zoomIn', 'zoomOut', 'rotateIn', 'bounce', 'pulse', 'shake', 'flip',
            'typewriter', 'glow', 'float'
        ];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCanvas();
        this.setupTimeline();
        this.hideLoadingScreen();
        this.render();
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            loadingScreen.classList.add('hidden');
        }, 2000);
    }

    setupEventListeners() {
        // Media upload
        document.getElementById('mediaUpload').addEventListener('change', (e) => {
            this.handleMediaUpload(e);
        });

        // Element creation
        document.querySelectorAll('.element-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.createElement(e.target.closest('.element-item').dataset.type);
            });
        });

        // Animation presets
        document.querySelectorAll('.animation-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (this.selectedElement) {
                    this.applyAnimation(e.target.dataset.animation);
                }
            });
        });

        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleCanvasWheel(e));

        // Properties panel
        this.setupPropertiesPanel();

        // Timeline controls
        document.getElementById('playBtn').addEventListener('click', () => this.playTimeline());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseTimeline());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopTimeline());

        // Export modal
        document.getElementById('exportBtn').addEventListener('click', () => this.showExportModal());
        document.getElementById('closeExportModal').addEventListener('click', () => this.hideExportModal());
        document.getElementById('startExport').addEventListener('click', () => this.startExport());

        // Zoom controls
        document.getElementById('zoomIn').addEventListener('click', () => this.zoomCanvas(1.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoomCanvas(0.8));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    setupCanvas() {
        this.resizeCanvas();
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const aspectRatio = 16 / 9;
        
        let width = rect.width - 40;
        let height = width / aspectRatio;
        
        if (height > rect.height - 40) {
            height = rect.height - 40;
            width = height * aspectRatio;
        }
        
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
    }

    handleMediaUpload(event) {
        const files = Array.from(event.target.files);
        
        files.forEach(file => {
            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const mediaItem = {
                        id: this.generateId(),
                        type: file.type.startsWith('image/') ? 'image' : 'video',
                        src: e.target.result,
                        name: file.name,
                        file: file
                    };
                    
                    this.mediaLibrary.push(mediaItem);
                    this.renderMediaLibrary();
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Reset input
        event.target.value = '';
    }

    renderMediaLibrary() {
        const library = document.getElementById('mediaLibrary');
        library.innerHTML = '';
        
        this.mediaLibrary.forEach(item => {
            const element = document.createElement('div');
            element.className = 'media-item';
            element.draggable = true;
            element.dataset.mediaId = item.id;
            
            if (item.type === 'image') {
                const img = document.createElement('img');
                img.src = item.src;
                img.alt = item.name;
                element.appendChild(img);
            } else if (item.type === 'video') {
                const video = document.createElement('video');
                video.src = item.src;
                video.muted = true;
                element.appendChild(video);
            }
            
            element.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.id);
            });
            
            element.addEventListener('click', () => {
                this.addMediaToCanvas(item);
            });
            
            library.appendChild(element);
        });
    }

    addMediaToCanvas(mediaItem) {
        const element = {
            id: this.generateId(),
            type: mediaItem.type,
            src: mediaItem.src,
            x: 100,
            y: 100,
            width: mediaItem.type === 'image' ? 200 : 300,
            height: mediaItem.type === 'image' ? 150 : 200,
            rotation: 0,
            opacity: 1,
            visible: true,
            animation: null,
            style: {
                borderRadius: 0,
                borderWidth: 0,
                borderColor: '#ffffff',
                shadowBlur: 0,
                shadowColor: '#000000',
                transform3d: { x: 0, y: 0, z: 0 }
            }
        };
        
        this.elements.push(element);
        this.selectElement(element);
        this.render();
    }

    createElement(type) {
        let element;
        
        switch (type) {
            case 'text':
                element = {
                    id: this.generateId(),
                    type: 'text',
                    content: 'Sample Text',
                    x: 100,
                    y: 100,
                    width: 200,
                    height: 50,
                    rotation: 0,
                    opacity: 1,
                    visible: true,
                    animation: null,
                    style: {
                        fontSize: 24,
                        fontFamily: 'Inter',
                        color: '#ffffff',
                        borderRadius: 0,
                        borderWidth: 0,
                        borderColor: '#ffffff',
                        shadowBlur: 0,
                        shadowColor: '#000000',
                        transform3d: { x: 0, y: 0, z: 0 }
                    }
                };
                break;
                
            case 'shape':
                element = {
                    id: this.generateId(),
                    type: 'shape',
                    shape: 'rectangle',
                    x: 100,
                    y: 100,
                    width: 150,
                    height: 100,
                    rotation: 0,
                    opacity: 1,
                    visible: true,
                    animation: null,
                    style: {
                        fillColor: '#667eea',
                        borderRadius: 0,
                        borderWidth: 0,
                        borderColor: '#ffffff',
                        shadowBlur: 0,
                        shadowColor: '#000000',
                        transform3d: { x: 0, y: 0, z: 0 }
                    }
                };
                break;
                
            case 'emoji':
                element = {
                    id: this.generateId(),
                    type: 'emoji',
                    content: '😀',
                    x: 100,
                    y: 100,
                    width: 60,
                    height: 60,
                    rotation: 0,
                    opacity: 1,
                    visible: true,
                    animation: null,
                    style: {
                        fontSize: 48,
                        borderRadius: 0,
                        borderWidth: 0,
                        borderColor: '#ffffff',
                        shadowBlur: 0,
                        shadowColor: '#000000',
                        transform3d: { x: 0, y: 0, z: 0 }
                    }
                };
                break;
                
            case 'sticker':
                element = {
                    id: this.generateId(),
                    type: 'sticker',
                    content: '⭐',
                    x: 100,
                    y: 100,
                    width: 80,
                    height: 80,
                    rotation: 0,
                    opacity: 1,
                    visible: true,
                    animation: null,
                    style: {
                        fontSize: 64,
                        borderRadius: 0,
                        borderWidth: 0,
                        borderColor: '#ffffff',
                        shadowBlur: 0,
                        shadowColor: '#000000',
                        transform3d: { x: 0, y: 0, z: 0 }
                    }
                };
                break;
        }
        
        if (element) {
            this.elements.push(element);
            this.selectElement(element);
            this.render();
        }
    }

    selectElement(element) {
        this.selectedElement = element;
        this.showPropertiesPanel();
        this.updatePropertiesPanel();
        this.render();
    }

    showPropertiesPanel() {
        const panel = document.getElementById('propertiesPanel');
        panel.classList.add('open');
    }

    hidePropertiesPanel() {
        const panel = document.getElementById('propertiesPanel');
        panel.classList.remove('open');
    }

    updatePropertiesPanel() {
        if (!this.selectedElement) return;
        
        const element = this.selectedElement;
        
        // Transform properties
        document.getElementById('posX').value = element.x;
        document.getElementById('posY').value = element.y;
        document.getElementById('width').value = element.width;
        document.getElementById('height').value = element.height;
        document.getElementById('rotation').value = element.rotation;
        document.getElementById('rotationValue').textContent = element.rotation + '°';
        
        // Style properties
        document.getElementById('opacity').value = element.opacity * 100;
        document.getElementById('opacityValue').textContent = (element.opacity * 100) + '%';
        document.getElementById('borderRadius').value = element.style.borderRadius;
        document.getElementById('borderRadiusValue').textContent = element.style.borderRadius + 'px';
        document.getElementById('borderWidth').value = element.style.borderWidth;
        document.getElementById('borderWidthValue').textContent = element.style.borderWidth + 'px';
        document.getElementById('borderColor').value = element.style.borderColor;
        
        // Effects
        document.getElementById('shadowBlur').value = element.style.shadowBlur;
        document.getElementById('shadowBlurValue').textContent = element.style.shadowBlur + 'px';
        document.getElementById('shadowColor').value = element.style.shadowColor;
        document.getElementById('rotateX').value = element.style.transform3d.x;
        document.getElementById('rotateXValue').textContent = element.style.transform3d.x + '°';
        document.getElementById('rotateY').value = element.style.transform3d.y;
        document.getElementById('rotateYValue').textContent = element.style.transform3d.y + '°';
        document.getElementById('rotateZ').value = element.style.transform3d.z;
        document.getElementById('rotateZValue').textContent = element.style.transform3d.z + '°';
        
        // Text properties
        const textProperties = document.getElementById('textProperties');
        if (element.type === 'text') {
            textProperties.style.display = 'block';
            document.getElementById('fontFamily').value = element.style.fontFamily;
            document.getElementById('fontSize').value = element.style.fontSize;
            document.getElementById('fontSizeValue').textContent = element.style.fontSize + 'px';
            document.getElementById('textColor').value = element.style.color;
            document.getElementById('textContent').value = element.content;
        } else {
            textProperties.style.display = 'none';
        }
    }

    setupPropertiesPanel() {
        // Transform controls
        ['posX', 'posY', 'width', 'height'].forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                if (this.selectedElement) {
                    const property = id === 'posX' ? 'x' : id === 'posY' ? 'y' : id;
                    this.selectedElement[property] = parseFloat(e.target.value) || 0;
                    this.render();
                }
            });
        });
        
        // Slider controls
        const sliders = [
            'rotation', 'opacity', 'borderRadius', 'borderWidth', 'shadowBlur',
            'rotateX', 'rotateY', 'rotateZ', 'fontSize'
        ];
        
        sliders.forEach(id => {
            const slider = document.getElementById(id);
            const valueSpan = document.getElementById(id + 'Value');
            
            slider.addEventListener('input', (e) => {
                if (!this.selectedElement) return;
                
                const value = parseFloat(e.target.value);
                let unit = '';
                
                switch (id) {
                    case 'rotation':
                    case 'rotateX':
                    case 'rotateY':
                    case 'rotateZ':
                        unit = '°';
                        break;
                    case 'opacity':
                        unit = '%';
                        break;
                    default:
                        unit = 'px';
                }
                
                valueSpan.textContent = value + unit;
                
                if (id === 'rotation') {
                    this.selectedElement.rotation = value;
                } else if (id === 'opacity') {
                    this.selectedElement.opacity = value / 100;
                } else if (id === 'fontSize') {
                    this.selectedElement.style.fontSize = value;
                } else if (['rotateX', 'rotateY', 'rotateZ'].includes(id)) {
                    const axis = id.replace('rotate', '').toLowerCase();
                    this.selectedElement.style.transform3d[axis] = value;
                } else {
                    this.selectedElement.style[id] = value;
                }
                
                this.render();
            });
        });
        
        // Color controls
        ['borderColor', 'shadowColor', 'textColor'].forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                if (!this.selectedElement) return;
                
                if (id === 'textColor') {
                    this.selectedElement.style.color = e.target.value;
                } else {
                    this.selectedElement.style[id] = e.target.value;
                }
                
                this.render();
            });
        });
        
        // Text controls
        document.getElementById('fontFamily').addEventListener('change', (e) => {
            if (this.selectedElement && this.selectedElement.type === 'text') {
                this.selectedElement.style.fontFamily = e.target.value;
                this.render();
            }
        });
        
        document.getElementById('textContent').addEventListener('input', (e) => {
            if (this.selectedElement && this.selectedElement.type === 'text') {
                this.selectedElement.content = e.target.value;
                this.render();
            }
        });
        
        // Close panel
        document.getElementById('closePanelBtn').addEventListener('click', () => {
            this.hidePropertiesPanel();
        });
    }

    handleCanvasMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) / this.zoom;
        const y = (event.clientY - rect.top) / this.zoom;
        
        // Find clicked element
        const clickedElement = this.getElementAtPosition(x, y);
        
        if (clickedElement) {
            this.selectElement(clickedElement);
            this.isDragging = true;
            this.dragOffset = {
                x: x - clickedElement.x,
                y: y - clickedElement.y
            };
        } else {
            this.selectedElement = null;
            this.hidePropertiesPanel();
            this.render();
        }
    }

    handleCanvasMouseMove(event) {
        if (!this.isDragging || !this.selectedElement) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) / this.zoom;
        const y = (event.clientY - rect.top) / this.zoom;
        
        this.selectedElement.x = x - this.dragOffset.x;
        this.selectedElement.y = y - this.dragOffset.y;
        
        this.updatePropertiesPanel();
        this.render();
    }

    handleCanvasMouseUp(event) {
        this.isDragging = false;
        this.isResizing = false;
    }

    handleCanvasWheel(event) {
        event.preventDefault();
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        this.zoomCanvas(zoomFactor);
    }

    getElementAtPosition(x, y) {
        // Check elements in reverse order (top to bottom)
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const element = this.elements[i];
            if (x >= element.x && x <= element.x + element.width &&
                y >= element.y && y <= element.y + element.height) {
                return element;
            }
        }
        return null;
    }

    zoomCanvas(factor) {
        this.zoom = Math.max(0.1, Math.min(5, this.zoom * factor));
        document.getElementById('zoomLevel').textContent = Math.round(this.zoom * 100) + '%';
        this.render();
    }

    applyAnimation(animationName) {
        if (!this.selectedElement) return;
        
        this.selectedElement.animation = animationName;
        
        // Create DOM element for animation preview
        const previewElement = document.createElement('div');
        previewElement.style.position = 'absolute';
        previewElement.style.left = this.selectedElement.x + 'px';
        previewElement.style.top = this.selectedElement.y + 'px';
        previewElement.style.width = this.selectedElement.width + 'px';
        previewElement.style.height = this.selectedElement.height + 'px';
        previewElement.style.background = 'rgba(102, 126, 234, 0.5)';
        previewElement.style.border = '2px solid #667eea';
        previewElement.style.borderRadius = this.selectedElement.style.borderRadius + 'px';
        previewElement.className = `animate-${animationName}`;
        
        this.canvasOverlay.appendChild(previewElement);
        
        // Remove preview after animation
        setTimeout(() => {
            if (previewElement.parentNode) {
                previewElement.parentNode.removeChild(previewElement);
            }
        }, 3000);
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply zoom transform
        this.ctx.save();
        this.ctx.scale(this.zoom, this.zoom);
        
        // Render all elements
        this.elements.forEach(element => {
            if (!element.visible) return;
            
            this.ctx.save();
            
            // Apply transformations
            this.ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
            this.ctx.rotate((element.rotation * Math.PI) / 180);
            this.ctx.globalAlpha = element.opacity;
            
            // Apply 3D transforms (simplified 2D representation)
            const transform3d = element.style.transform3d;
            if (transform3d.x !== 0 || transform3d.y !== 0 || transform3d.z !== 0) {
                this.ctx.transform(
                    Math.cos(transform3d.y * Math.PI / 180),
                    Math.sin(transform3d.x * Math.PI / 180),
                    -Math.sin(transform3d.y * Math.PI / 180),
                    Math.cos(transform3d.x * Math.PI / 180),
                    0, 0
                );
            }
            
            this.ctx.translate(-element.width / 2, -element.height / 2);
            
            // Apply shadow
            if (element.style.shadowBlur > 0) {
                this.ctx.shadowBlur = element.style.shadowBlur;
                this.ctx.shadowColor = element.style.shadowColor;
            }
            
            // Render based on element type
            switch (element.type) {
                case 'text':
                    this.renderTextElement(element);
                    break;
                case 'image':
                    this.renderImageElement(element);
                    break;
                case 'video':
                    this.renderVideoElement(element);
                    break;
                case 'shape':
                    this.renderShapeElement(element);
                    break;
                case 'emoji':
                case 'sticker':
                    this.renderEmojiElement(element);
                    break;
            }
            
            // Apply border
            if (element.style.borderWidth > 0) {
                this.ctx.strokeStyle = element.style.borderColor;
                this.ctx.lineWidth = element.style.borderWidth;
                this.ctx.strokeRect(0, 0, element.width, element.height);
            }
            
            this.ctx.restore();
        });
        
        this.ctx.restore();
        
        // Render selection indicator
        if (this.selectedElement) {
            this.renderSelectionIndicator(this.selectedElement);
        }
    }

    renderTextElement(element) {
        this.ctx.font = `${element.style.fontSize}px ${element.style.fontFamily}`;
        this.ctx.fillStyle = element.style.color;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        // Handle multiline text
        const lines = element.content.split('\n');
        const lineHeight = element.style.fontSize * 1.2;
        
        lines.forEach((line, index) => {
            this.ctx.fillText(line, 0, index * lineHeight);
        });
    }

    renderImageElement(element) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            this.ctx.drawImage(img, 0, 0, element.width, element.height);
        };
        img.src = element.src;
    }

    renderVideoElement(element) {
        // For video elements, we'll render the first frame or current frame
        const video = document.createElement('video');
        video.src = element.src;
        video.currentTime = this.timeline.currentTime;
        video.onloadeddata = () => {
            this.ctx.drawImage(video, 0, 0, element.width, element.height);
        };
    }

    renderShapeElement(element) {
        this.ctx.fillStyle = element.style.fillColor || '#667eea';
        
        if (element.style.borderRadius > 0) {
            this.roundRect(0, 0, element.width, element.height, element.style.borderRadius);
            this.ctx.fill();
        } else {
            this.ctx.fillRect(0, 0, element.width, element.height);
        }
    }

    renderEmojiElement(element) {
        this.ctx.font = `${element.style.fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(element.content, element.width / 2, element.height / 2);
    }

    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    renderSelectionIndicator(element) {
        this.ctx.save();
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(element.x - 2, element.y - 2, element.width + 4, element.height + 4);
        
        // Render resize handles
        const handles = [
            { x: element.x - 4, y: element.y - 4 },
            { x: element.x + element.width, y: element.y - 4 },
            { x: element.x - 4, y: element.y + element.height },
            { x: element.x + element.width, y: element.y + element.height }
        ];
        
        this.ctx.fillStyle = '#667eea';
        handles.forEach(handle => {
            this.ctx.fillRect(handle.x, handle.y, 8, 8);
        });
        
        this.ctx.restore();
    }

    setupTimeline() {
        this.renderTimelineRuler();
        this.updateTimelineDisplay();
    }

    renderTimelineRuler() {
        const ruler = document.getElementById('timelineRuler');
        ruler.innerHTML = '';
        
        const totalWidth = 1000; // Timeline width in pixels
        const timeStep = 1; // 1 second per step
        const pixelsPerSecond = totalWidth / this.timeline.totalTime;
        
        for (let i = 0; i <= this.timeline.totalTime; i += timeStep) {
            const mark = document.createElement('div');
            mark.style.position = 'absolute';
            mark.style.left = (i * pixelsPerSecond) + 'px';
            mark.style.top = '0';
            mark.style.width = '1px';
            mark.style.height = '20px';
            mark.style.background = '#555';
            
            if (i % 5 === 0) {
                mark.style.height = '20px';
                mark.style.background = '#777';
                
                const label = document.createElement('span');
                label.textContent = this.formatTime(i);
                label.style.position = 'absolute';
                label.style.left = '2px';
                label.style.top = '2px';
                label.style.fontSize = '10px';
                label.style.color = '#ccc';
                mark.appendChild(label);
            }
            
            ruler.appendChild(mark);
        }
    }

    playTimeline() {
        this.timeline.isPlaying = true;
        this.timelineInterval = setInterval(() => {
            this.timeline.currentTime += 0.1;
            if (this.timeline.currentTime >= this.timeline.totalTime) {
                this.stopTimeline();
            }
            this.updateTimelineDisplay();
            this.updatePlayhead();
        }, 100);
    }

    pauseTimeline() {
        this.timeline.isPlaying = false;
        if (this.timelineInterval) {
            clearInterval(this.timelineInterval);
        }
    }

    stopTimeline() {
        this.timeline.isPlaying = false;
        this.timeline.currentTime = 0;
        if (this.timelineInterval) {
            clearInterval(this.timelineInterval);
        }
        this.updateTimelineDisplay();
        this.updatePlayhead();
    }

    updateTimelineDisplay() {
        document.getElementById('currentTime').textContent = this.formatTime(this.timeline.currentTime);
        document.getElementById('totalTime').textContent = this.formatTime(this.timeline.totalTime);
    }

    updatePlayhead() {
        const playhead = document.getElementById('timelinePlayhead');
        const totalWidth = 1000;
        const position = (this.timeline.currentTime / this.timeline.totalTime) * totalWidth;
        playhead.style.left = (100 + position) + 'px';
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    showExportModal() {
        document.getElementById('exportModal').classList.add('show');
    }

    hideExportModal() {
        document.getElementById('exportModal').classList.remove('show');
    }

    async startExport() {
        const format = document.getElementById('exportFormat').value;
        const quality = document.getElementById('exportQuality').value;
        const frameRate = parseInt(document.getElementById('exportFrameRate').value);
        
        const progressContainer = document.getElementById('exportProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        progressContainer.style.display = 'block';
        
        try {
            // Simulate export process
            progressText.textContent = 'Initializing export...';
            progressFill.style.width = '10%';
            
            await this.delay(1000);
            
            progressText.textContent = 'Rendering frames...';
            progressFill.style.width = '30%';
            
            await this.delay(2000);
            
            progressText.textContent = 'Encoding video...';
            progressFill.style.width = '70%';
            
            await this.delay(2000);
            
            progressText.textContent = 'Finalizing...';
            progressFill.style.width = '90%';
            
            await this.delay(1000);
            
            // Create download link
            const canvas = document.createElement('canvas');
            canvas.width = 1920;
            canvas.height = 1080;
            const ctx = canvas.getContext('2d');
            
            // Render final frame
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // For demo purposes, create a simple image export
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `editiq-export.${format === 'gif' ? 'gif' : 'png'}`;
                a.click();
                URL.revokeObjectURL(url);
            });
            
            progressText.textContent = 'Export complete!';
            progressFill.style.width = '100%';
            
            setTimeout(() => {
                this.hideExportModal();
                progressContainer.style.display = 'none';
                progressFill.style.width = '0%';
            }, 2000);
            
        } catch (error) {
            console.error('Export failed:', error);
            progressText.textContent = 'Export failed. Please try again.';
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    handleKeyboard(event) {
        if (event.key === 'Delete' && this.selectedElement) {
            this.deleteSelectedElement();
        } else if (event.key === 'Escape') {
            this.selectedElement = null;
            this.hidePropertiesPanel();
            this.render();
        } else if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 's':
                    event.preventDefault();
                    this.saveProject();
                    break;
                case 'z':
                    event.preventDefault();
                    this.undo();
                    break;
                case 'y':
                    event.preventDefault();
                    this.redo();
                    break;
            }
        }
    }

    deleteSelectedElement() {
        if (!this.selectedElement) return;
        
        const index = this.elements.indexOf(this.selectedElement);
        if (index > -1) {
            this.elements.splice(index, 1);
            this.selectedElement = null;
            this.hidePropertiesPanel();
            this.render();
        }
    }

    saveProject() {
        const projectData = {
            elements: this.elements,
            timeline: this.timeline,
            mediaLibrary: this.mediaLibrary.map(item => ({
                ...item,
                src: null // Don't save large data URLs
            }))
        };
        
        const dataStr = JSON.stringify(projectData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'editiq-project.json';
        a.click();
        
        URL.revokeObjectURL(url);
    }

    loadProject(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const projectData = JSON.parse(e.target.result);
                this.elements = projectData.elements || [];
                this.timeline = { ...this.timeline, ...projectData.timeline };
                this.selectedElement = null;
                this.hidePropertiesPanel();
                this.render();
                this.setupTimeline();
            } catch (error) {
                console.error('Failed to load project:', error);
                alert('Failed to load project file.');
            }
        };
        reader.readAsText(file);
    }

    handleResize() {
        this.resizeCanvas();
        this.render();
    }

    generateId() {
        return 'element_' + Math.random().toString(36).substr(2, 9);
    }

    undo() {
        // Implement undo functionality
        console.log('Undo functionality would be implemented here');
    }

    redo() {
        // Implement redo functionality
        console.log('Redo functionality would be implemented here');
    }
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.editIQ = new EditIQ();
});

// Service Worker for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

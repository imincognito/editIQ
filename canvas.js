// Canvas management for editIQ

class CanvasManager {
    constructor(canvasId, overlayId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById(overlayId);
        
        this.elements = new Map();
        this.selectedElement = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        
        this.setupEventListeners();
        this.setupResizeObserver();
        
        // Animation frame for smooth rendering
        this.animationFrame = null;
        this.needsRedraw = true;
        
        this.startRenderLoop();
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Drop events
        this.canvas.addEventListener('dragover', this.handleDragOver.bind(this));
        this.canvas.addEventListener('drop', this.handleDrop.bind(this));
    }
    
    setupResizeObserver() {
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                this.updateCanvasSize();
            }
        });
        
        resizeObserver.observe(this.canvas.parentElement);
    }
    
    updateCanvasSize() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Maintain aspect ratio
        const aspectRatio = 16 / 9;
        let width = rect.width * 0.8;
        let height = width / aspectRatio;
        
        if (height > rect.height * 0.8) {
            height = rect.height * 0.8;
            width = height * aspectRatio;
        }
        
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        this.needsRedraw = true;
    }
    
    startRenderLoop() {
        const render = () => {
            if (this.needsRedraw) {
                this.render();
                this.needsRedraw = false;
            }
            this.animationFrame = requestAnimationFrame(render);
        };
        render();
    }
    
    render() {
        Performance.mark('render-start');
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply zoom and pan
        this.ctx.save();
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(this.pan.x, this.pan.y);
        
        // Render elements in z-index order
        const sortedElements = Array.from(this.elements.values())
            .sort((a, b) => a.zIndex - b.zIndex);
        
        for (const element of sortedElements) {
            this.renderElement(element);
        }
        
        this.ctx.restore();
        
        Performance.measure('render-time', 'render-start');
    }
    
    renderElement(element) {
        this.ctx.save();
        
        // Apply transformations
        this.ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
        this.ctx.rotate(element.rotation * Math.PI / 180);
        this.ctx.scale(element.scaleX, element.scaleY);
        this.ctx.globalAlpha = element.opacity;
        
        // Apply filters
        if (element.filters) {
            this.ctx.filter = this.buildFilterString(element.filters);
        }
        
        switch (element.type) {
            case 'text':
                this.renderText(element);
                break;
            case 'image':
                this.renderImage(element);
                break;
            case 'video':
                this.renderVideo(element);
                break;
            case 'shape':
                this.renderShape(element);
                break;
            case 'emoji':
                this.renderEmoji(element);
                break;
        }
        
        // Render selection outline
        if (element === this.selectedElement) {
            this.renderSelectionOutline(element);
        }
        
        this.ctx.restore();
    }
    
    renderText(element) {
        this.ctx.font = `${element.fontSize}px ${element.fontFamily}`;
        this.ctx.fillStyle = element.color;
        this.ctx.textAlign = element.textAlign;
        this.ctx.textBaseline = 'middle';
        
        // Apply text effects
        if (element.shadow) {
            this.ctx.shadowColor = element.shadow.color;
            this.ctx.shadowBlur = element.shadow.blur;
            this.ctx.shadowOffsetX = element.shadow.offsetX;
            this.ctx.shadowOffsetY = element.shadow.offsetY;
        }
        
        if (element.stroke) {
            this.ctx.strokeStyle = element.stroke.color;
            this.ctx.lineWidth = element.stroke.width;
            this.ctx.strokeText(element.text, -element.width / 2, 0);
        }
        
        this.ctx.fillText(element.text, -element.width / 2, 0);
    }
    
    renderImage(element) {
        if (element.imageData) {
            this.ctx.drawImage(
                element.imageData,
                -element.width / 2,
                -element.height / 2,
                element.width,
                element.height
            );
        }
    }
    
    renderVideo(element) {
        if (element.videoElement && !element.videoElement.paused) {
            this.ctx.drawImage(
                element.videoElement,
                -element.width / 2,
                -element.height / 2,
                element.width,
                element.height
            );
        }
    }
    
    renderShape(element) {
        this.ctx.fillStyle = element.fillColor;
        this.ctx.strokeStyle = element.strokeColor;
        this.ctx.lineWidth = element.strokeWidth;
        
        switch (element.shapeType) {
            case 'rectangle':
                this.ctx.fillRect(-element.width / 2, -element.height / 2, element.width, element.height);
                if (element.strokeWidth > 0) {
                    this.ctx.strokeRect(-element.width / 2, -element.height / 2, element.width, element.height);
                }
                break;
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(0, 0, element.width / 2, 0, 2 * Math.PI);
                this.ctx.fill();
                if (element.strokeWidth > 0) {
                    this.ctx.stroke();
                }
                break;
            case 'triangle':
                this.ctx.beginPath();
                this.ctx.moveTo(0, -element.height / 2);
                this.ctx.lineTo(-element.width / 2, element.height / 2);
                this.ctx.lineTo(element.width / 2, element.height / 2);
                this.ctx.closePath();
                this.ctx.fill();
                if (element.strokeWidth > 0) {
                    this.ctx.stroke();
                }
                break;
        }
    }
    
    renderEmoji(element) {
        this.ctx.font = `${element.fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(element.emoji, 0, 0);
    }
    
    renderSelectionOutline(element) {
        this.ctx.strokeStyle = '#6366f1';
        this.ctx.lineWidth = 2 / this.zoom;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(
            -element.width / 2 - 5,
            -element.height / 2 - 5,
            element.width + 10,
            element.height + 10
        );
        this.ctx.setLineDash([]);
    }
    
    buildFilterString(filters) {
        const filterParts = [];
        
        if (filters.blur > 0) filterParts.push(`blur(${filters.blur}px)`);
        if (filters.brightness !== 1) filterParts.push(`brightness(${filters.brightness})`);
        if (filters.contrast !== 1) filterParts.push(`contrast(${filters.contrast})`);
        if (filters.saturate !== 1) filterParts.push(`saturate(${filters.saturate})`);
        if (filters.hueRotate !== 0) filterParts.push(`hue-rotate(${filters.hueRotate}deg)`);
        
        return filterParts.join(' ') || 'none';
    }
    
    // Event handlers
    handleMouseDown(event) {
        const pos = getCanvasMousePos(this.canvas, event);
        const element = this.getElementAtPosition(pos.x, pos.y);
        
        if (element) {
            this.selectElement(element);
            this.isDragging = true;
            this.dragOffset = {
                x: pos.x - element.x,
                y: pos.y - element.y
            };
        } else {
            this.selectElement(null);
        }
        
        event.preventDefault();
    }
    
    handleMouseMove(event) {
        const pos = getCanvasMousePos(this.canvas, event);
        
        if (this.isDragging && this.selectedElement) {
            this.selectedElement.x = pos.x - this.dragOffset.x;
            this.selectedElement.y = pos.y - this.dragOffset.y;
            this.needsRedraw = true;
            
            // Update properties panel
            eventEmitter.emit('elementUpdated', this.selectedElement);
        }
        
        // Update cursor
        const element = this.getElementAtPosition(pos.x, pos.y);
        this.canvas.style.cursor = element ? 'grab' : 'default';
    }
    
    handleMouseUp(event) {
        this.isDragging = false;
        
        if (this.selectedElement) {
            this.canvas.style.cursor = 'grab';
        }
    }
    
    handleWheel(event) {
        event.preventDefault();
        
        const delta = event.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = clamp(this.zoom * delta, 0.1, 5);
        
        if (newZoom !== this.zoom) {
            this.zoom = newZoom;
            this.needsRedraw = true;
            
            // Update zoom display
            eventEmitter.emit('zoomChanged', this.zoom);
        }
    }
    
    handleKeyDown(event) {
        if (!this.selectedElement) return;
        
        switch (event.key) {
            case 'Delete':
            case 'Backspace':
                this.removeElement(this.selectedElement.id);
                break;
            case 'ArrowUp':
                this.selectedElement.y -= event.shiftKey ? 10 : 1;
                this.needsRedraw = true;
                break;
            case 'ArrowDown':
                this.selectedElement.y += event.shiftKey ? 10 : 1;
                this.needsRedraw = true;
                break;
            case 'ArrowLeft':
                this.selectedElement.x -= event.shiftKey ? 10 : 1;
                this.needsRedraw = true;
                break;
            case 'ArrowRight':
                this.selectedElement.x += event.shiftKey ? 10 : 1;
                this.needsRedraw = true;
                break;
        }
        
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
            eventEmitter.emit('elementUpdated', this.selectedElement);
        }
    }
    
    handleDragOver(event) {
        event.preventDefault();
        this.canvas.classList.add('drop-zone');
    }
    
    handleDrop(event) {
        event.preventDefault();
        this.canvas.classList.remove('drop-zone');
        
        const pos = getCanvasMousePos(this.canvas, event);
        const data = event.dataTransfer.getData('text/plain');
        
        if (data) {
            try {
                const elementData = JSON.parse(data);
                this.addElement({
                    ...elementData,
                    x: pos.x,
                    y: pos.y
                });
            } catch (error) {
                console.error('Failed to parse drop data:', error);
            }
        }
    }
    
    // Touch event handlers
    handleTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleMouseDown(mouseEvent);
    }
    
    handleTouchMove(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleMouseMove(mouseEvent);
    }
    
    handleTouchEnd(event) {
        event.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        this.handleMouseUp(mouseEvent);
    }
    
    // Element management
    addElement(elementData) {
        const element = {
            id: generateId(),
            type: 'text',
            x: 100,
            y: 100,
            width: 200,
            height: 50,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            zIndex: this.elements.size,
            ...elementData
        };
        
        // Set default properties based on type
        switch (element.type) {
            case 'text':
                element.text = element.text || 'Sample Text';
                element.fontSize = element.fontSize || 24;
                element.fontFamily = element.fontFamily || 'Arial';
                element.color = element.color || '#000000';
                element.textAlign = element.textAlign || 'center';
                break;
            case 'shape':
                element.shapeType = element.shapeType || 'rectangle';
                element.fillColor = element.fillColor || '#6366f1';
                element.strokeColor = element.strokeColor || '#000000';
                element.strokeWidth = element.strokeWidth || 0;
                break;
            case 'emoji':
                element.emoji = element.emoji || '😀';
                element.fontSize = element.fontSize || 48;
                break;
        }
        
        this.elements.set(element.id, element);
        this.selectElement(element);
        this.needsRedraw = true;
        
        eventEmitter.emit('elementAdded', element);
        
        return element;
    }
    
    removeElement(elementId) {
        const element = this.elements.get(elementId);
        if (element) {
            this.elements.delete(elementId);
            
            if (this.selectedElement === element) {
                this.selectedElement = null;
            }
            
            this.needsRedraw = true;
            eventEmitter.emit('elementRemoved', element);
        }
    }
    
    selectElement(element) {
        this.selectedElement = element;
        this.needsRedraw = true;
        eventEmitter.emit('elementSelected', element);
    }
    
    updateElement(elementId, updates) {
        const element = this.elements.get(elementId);
        if (element) {
            Object.assign(element, updates);
            this.needsRedraw = true;
            eventEmitter.emit('elementUpdated', element);
        }
    }
    
    getElementAtPosition(x, y) {
        // Check elements in reverse z-index order (top to bottom)
        const sortedElements = Array.from(this.elements.values())
            .sort((a, b) => b.zIndex - a.zIndex);
        
        for (const element of sortedElements) {
            if (this.isPointInElement(x, y, element)) {
                return element;
            }
        }
        
        return null;
    }
    
    isPointInElement(x, y, element) {
        // Simple bounding box check (could be enhanced for rotated elements)
        return x >= element.x && 
               x <= element.x + element.width &&
               y >= element.y && 
               y <= element.y + element.height;
    }
    
    // Zoom and pan controls
    setZoom(zoom) {
        this.zoom = clamp(zoom, 0.1, 5);
        this.needsRedraw = true;
        eventEmitter.emit('zoomChanged', this.zoom);
    }
    
    resetZoom() {
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        this.needsRedraw = true;
        eventEmitter.emit('zoomChanged', this.zoom);
    }
    
    // Export canvas as image
    exportAsImage(format = 'png') {
        return this.canvas.toDataURL(`image/${format}`);
    }
    
    // Clear all elements
    clear() {
        this.elements.clear();
        this.selectedElement = null;
        this.needsRedraw = true;
        eventEmitter.emit('canvasCleared');
    }
    
    // Get canvas data for export
    getCanvasData() {
        return {
            elements: Array.from(this.elements.values()),
            zoom: this.zoom,
            pan: this.pan
        };
    }
    
    // Load canvas data
    loadCanvasData(data) {
        this.clear();
        
        if (data.elements) {
            data.elements.forEach(elementData => {
                this.elements.set(elementData.id, elementData);
            });
        }
        
        if (data.zoom) this.zoom = data.zoom;
        if (data.pan) this.pan = data.pan;
        
        this.needsRedraw = true;
        eventEmitter.emit('canvasLoaded', data);
    }
}

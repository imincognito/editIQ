// Utility functions for editIQ

// Generate unique IDs
function generateId() {
    return 'el_' + Math.random().toString(36).substr(2, 9);
}

// Debounce function for performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for performance optimization
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Format time for timeline display
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

// Convert time to pixels for timeline
function timeToPixels(time, pixelsPerSecond = 50) {
    return time * pixelsPerSecond;
}

// Convert pixels to time for timeline
function pixelsToTime(pixels, pixelsPerSecond = 50) {
    return pixels / pixelsPerSecond;
}

// Clamp value between min and max
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Linear interpolation
function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

// Easing functions
const Easing = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInBounce: t => 1 - Easing.easeOutBounce(1 - t),
    easeOutBounce: t => {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
            return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
            return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
    }
};

// Color utilities
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// File utilities
function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

function isImageFile(file) {
    return file.type.startsWith('image/');
}

function isVideoFile(file) {
    return file.type.startsWith('video/');
}

// Canvas utilities
function getCanvasMousePos(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}

// Element transformation utilities
function applyTransform(element, transform) {
    const { x, y, scaleX, scaleY, rotation, skewX, skewY } = transform;
    
    element.style.transform = `
        translate(${x}px, ${y}px)
        scale(${scaleX}, ${scaleY})
        rotate(${rotation}deg)
        skew(${skewX}deg, ${skewY}deg)
    `;
}

// Animation utilities
class AnimationManager {
    constructor() {
        this.animations = new Map();
        this.isRunning = false;
    }
    
    add(id, animation) {
        this.animations.set(id, {
            ...animation,
            startTime: performance.now(),
            currentTime: 0
        });
        
        if (!this.isRunning) {
            this.start();
        }
    }
    
    remove(id) {
        this.animations.delete(id);
        
        if (this.animations.size === 0) {
            this.stop();
        }
    }
    
    start() {
        this.isRunning = true;
        this.tick();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    tick() {
        if (!this.isRunning) return;
        
        const now = performance.now();
        
        for (const [id, animation] of this.animations) {
            const elapsed = now - animation.startTime;
            const progress = Math.min(elapsed / animation.duration, 1);
            
            if (animation.easing) {
                const easedProgress = Easing[animation.easing](progress);
                animation.onUpdate(easedProgress);
            } else {
                animation.onUpdate(progress);
            }
            
            if (progress >= 1) {
                if (animation.onComplete) {
                    animation.onComplete();
                }
                this.remove(id);
            }
        }
        
        if (this.isRunning) {
            requestAnimationFrame(() => this.tick());
        }
    }
}

// Global animation manager instance
const animationManager = new AnimationManager();

// Local storage utilities
const Storage = {
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    },
    
    load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return null;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
            return false;
        }
    }
};

// Event emitter for component communication
class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    off(event, callback) {
        if (!this.events[event]) return;
        
        const index = this.events[event].indexOf(callback);
        if (index > -1) {
            this.events[event].splice(index, 1);
        }
    }
    
    emit(event, ...args) {
        if (!this.events[event]) return;
        
        this.events[event].forEach(callback => {
            callback(...args);
        });
    }
}

// Global event emitter instance
const eventEmitter = new EventEmitter();

// Performance monitoring
const Performance = {
    marks: {},
    
    mark(name) {
        this.marks[name] = performance.now();
    },
    
    measure(name, startMark) {
        const endTime = performance.now();
        const startTime = this.marks[startMark];
        
        if (startTime) {
            const duration = endTime - startTime;
            console.log(`${name}: ${duration.toFixed(2)}ms`);
            return duration;
        }
        
        return 0;
    }
};

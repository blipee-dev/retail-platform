// Linear-style Micro-interactions for blipee OS

// Smooth number animations for metrics
function animateValue(element, start, end, duration) {
    const range = end - start;
    const startTime = performance.now();
    
    function updateValue(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (range * easeOutQuart));
        
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        }
    }
    
    requestAnimationFrame(updateValue);
}

// Initialize metric animations
document.addEventListener('DOMContentLoaded', function() {
    // Animate KPI values on page load
    const kpiValues = document.querySelectorAll('.kpi-value');
    kpiValues.forEach(element => {
        const finalValue = parseInt(element.textContent.replace(/,/g, ''));
        if (!isNaN(finalValue)) {
            animateValue(element, 0, finalValue, 1000);
        }
    });
    
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    buttons.forEach(button => {
        button.addEventListener('click', createRipple);
    });
    
    // Add keyboard shortcuts hint
    addKeyboardShortcuts();
    
    // Enhance table row interactions
    enhanceTableInteractions();
});

// Ripple effect for buttons
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    // Add ripple styles if not exists
    if (!document.querySelector('#ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            .btn-primary, .btn-secondary {
                position: relative;
                overflow: hidden;
            }
            .ripple {
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: scale(0);
                animation: ripple-animation 600ms ease-out;
                pointer-events: none;
            }
            @keyframes ripple-animation {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Keyboard shortcuts
function addKeyboardShortcuts() {
    // Command/Ctrl + K for search
    document.addEventListener('keydown', function(e) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            showCommandPalette();
        }
    });
    
    // Escape to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCommandPalette();
            closeAllModals();
        }
    });
}

// Command palette (Linear-style)
function showCommandPalette() {
    let palette = document.querySelector('.command-palette');
    
    if (!palette) {
        palette = document.createElement('div');
        palette.className = 'command-palette';
        palette.innerHTML = `
            <input type="text" class="command-input" placeholder="Type a command or search..." autofocus>
            <div class="command-results"></div>
        `;
        document.body.appendChild(palette);
        
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'command-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            z-index: 9998;
        `;
        backdrop.onclick = closeCommandPalette;
        document.body.appendChild(backdrop);
    }
    
    palette.style.display = 'block';
    palette.querySelector('.command-input').focus();
    
    // Animate in
    requestAnimationFrame(() => {
        palette.style.opacity = '0';
        palette.style.transform = 'translateX(-50%) translateY(-10px)';
        requestAnimationFrame(() => {
            palette.style.transition = 'all 200ms ease-out';
            palette.style.opacity = '1';
            palette.style.transform = 'translateX(-50%) translateY(0)';
        });
    });
}

function closeCommandPalette() {
    const palette = document.querySelector('.command-palette');
    const backdrop = document.querySelector('.command-backdrop');
    
    if (palette) {
        palette.style.opacity = '0';
        palette.style.transform = 'translateX(-50%) translateY(-10px)';
        setTimeout(() => {
            palette.style.display = 'none';
        }, 200);
    }
    
    if (backdrop) {
        backdrop.remove();
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Enhanced table interactions
function enhanceTableInteractions() {
    const tables = document.querySelectorAll('.table');
    
    tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            // Add hover effect
            row.style.cursor = 'pointer';
            row.style.transition = 'all 150ms ease-out';
            
            // Click to select
            row.addEventListener('click', function() {
                // Remove previous selection
                rows.forEach(r => r.classList.remove('selected-row'));
                // Add selection to clicked row
                this.classList.add('selected-row');
            });
        });
    });
    
    // Add selection styles
    if (!document.querySelector('#table-selection-styles')) {
        const style = document.createElement('style');
        style.id = 'table-selection-styles';
        style.textContent = `
            .selected-row {
                background-color: var(--linear-blue-light) !important;
                position: relative;
            }
            .selected-row::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 3px;
                background-color: var(--linear-blue);
            }
        `;
        document.head.appendChild(style);
    }
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Page transition effect
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    requestAnimationFrame(() => {
        document.body.style.transition = 'opacity 300ms ease-out';
        document.body.style.opacity = '1';
    });
});
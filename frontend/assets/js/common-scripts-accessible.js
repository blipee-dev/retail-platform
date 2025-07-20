// Common Accessible Scripts for blipee OS
// WCAG 2.1 AA Compliant

// Accessibility utilities
const a11y = {
    // Announce messages to screen readers
    announce: function(message, priority = 'polite') {
        const announcer = document.querySelector(`[aria-live="${priority}"]`) || this.createAnnouncer(priority);
        announcer.textContent = message;
        
        // Clear after announcement
        setTimeout(() => {
            announcer.textContent = '';
        }, 1000);
    },
    
    // Create announcer element if it doesn't exist
    createAnnouncer: function(priority = 'polite') {
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', priority);
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        document.body.appendChild(announcer);
        return announcer;
    },
    
    // Trap focus within an element
    trapFocus: function(element) {
        const focusableElements = element.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        // Store current focus to restore later
        const previouslyFocused = document.activeElement;
        
        // Focus first element
        if (firstFocusable) {
            firstFocusable.focus();
        }
        
        // Handle tab key
        const handleTab = (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        };
        
        element.addEventListener('keydown', handleTab);
        
        // Return cleanup function
        return {
            release: () => {
                element.removeEventListener('keydown', handleTab);
                if (previouslyFocused) {
                    previouslyFocused.focus();
                }
            }
        };
    },
    
    // Manage ARIA attributes
    setAriaAttribute: function(element, attribute, value) {
        if (element) {
            element.setAttribute(`aria-${attribute}`, value);
        }
    },
    
    // Check if user prefers reduced motion
    prefersReducedMotion: function() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
};

// Initialize accessibility features on DOM load
document.addEventListener('DOMContentLoaded', function() {
    // Create screen reader announcer
    a11y.createAnnouncer('polite');
    a11y.createAnnouncer('assertive');
    
    // Restore saved preferences
    restoreUserPreferences();
    
    // Initialize navigation
    initializeNavigation();
    
    // Set up keyboard navigation
    setupKeyboardNavigation();
    
    // Initialize form validation
    initializeFormValidation();
});

// User preferences
function restoreUserPreferences() {
    // Restore sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        const layout = document.querySelector('.dashboard-layout');
        if (layout) {
            layout.classList.add('sidebar-collapsed');
            const collapseBtn = document.querySelector('.collapse-btn');
            if (collapseBtn) {
                collapseBtn.setAttribute('aria-expanded', 'false');
                const icon = collapseBtn.querySelector('svg');
                if (icon) icon.style.transform = 'rotate(180deg)';
            }
        }
    }
    
    // Restore theme preference
    const theme = localStorage.getItem('theme') || 'dark';
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        updateThemeToggle(true);
    }
    
    // Restore language preference
    const language = localStorage.getItem('language') || 'en';
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        languageSelector.value = language;
    }
}

// Navigation initialization
function initializeNavigation() {
    // Highlight active page in navigation
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.includes(href.replace('.html', ''))) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });
}

// Keyboard navigation setup
function setupKeyboardNavigation() {
    // Make clickable divs keyboard accessible
    document.querySelectorAll('[role="button"]').forEach(element => {
        if (!element.hasAttribute('tabindex')) {
            element.setAttribute('tabindex', '0');
        }
        
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                element.click();
            }
        });
    });
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Alt + M: Toggle mobile menu
        if (e.altKey && e.key === 'm') {
            e.preventDefault();
            const mobileToggle = document.querySelector('.mobile-nav-toggle');
            if (mobileToggle) mobileToggle.click();
        }
        
        // Alt + S: Toggle sidebar
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            toggleSidebar();
        }
        
        // Alt + U: Open user menu
        if (e.altKey && e.key === 'u') {
            e.preventDefault();
            const userProfile = document.querySelector('.user-profile');
            if (userProfile) userProfile.click();
        }
        
        // Escape: Close all dropdowns and modals
        if (e.key === 'Escape') {
            closeAllDropdowns();
            closeMobileNav();
            closeAllModals();
        }
    });
}

// User dropdown functionality
function toggleUserMenu(event) {
    if (event) {
        event.stopPropagation();
    }
    
    const dropdown = document.getElementById('userDropdown');
    const userProfile = document.querySelector('.user-profile');
    const isOpen = dropdown.classList.contains('active');
    
    if (isOpen) {
        dropdown.classList.remove('active');
        a11y.setAriaAttribute(userProfile, 'expanded', 'false');
        a11y.announce('User menu closed');
    } else {
        closeAllDropdowns(); // Close other dropdowns first
        dropdown.classList.add('active');
        a11y.setAriaAttribute(userProfile, 'expanded', 'true');
        a11y.announce('User menu opened');
        
        // Focus first menu item
        const firstItem = dropdown.querySelector('.dropdown-item');
        if (firstItem) {
            setTimeout(() => firstItem.focus(), 100);
        }
    }
}

// Close all dropdowns
function closeAllDropdowns() {
    document.querySelectorAll('.dropdown.active').forEach(dropdown => {
        dropdown.classList.remove('active');
        const trigger = dropdown.closest('[aria-expanded]');
        if (trigger) {
            a11y.setAriaAttribute(trigger, 'expanded', 'false');
        }
    });
    
    // Close user dropdown specifically
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown && userDropdown.classList.contains('active')) {
        userDropdown.classList.remove('active');
        const userProfile = document.querySelector('.user-profile');
        if (userProfile) {
            a11y.setAriaAttribute(userProfile, 'expanded', 'false');
        }
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const userProfile = event.target.closest('.user-profile');
    const dropdown = event.target.closest('.user-dropdown');
    
    if (!userProfile && !dropdown) {
        closeAllDropdowns();
    }
});

// Sidebar toggle
function toggleSidebar() {
    const layout = document.querySelector('.dashboard-layout');
    const isCollapsed = layout.classList.contains('sidebar-collapsed');
    layout.classList.toggle('sidebar-collapsed');
    
    const collapseBtn = document.querySelector('.collapse-btn');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const icon = collapseBtn ? collapseBtn.querySelector('svg') : null;
    
    if (!isCollapsed) {
        // Collapsing
        if (icon) icon.style.transform = 'rotate(180deg)';
        a11y.setAriaAttribute(collapseBtn, 'expanded', 'false');
        a11y.setAriaAttribute(sidebarToggle, 'expanded', 'false');
        a11y.announce('Sidebar collapsed');
    } else {
        // Expanding
        if (icon) icon.style.transform = 'rotate(0deg)';
        a11y.setAriaAttribute(collapseBtn, 'expanded', 'true');
        a11y.setAriaAttribute(sidebarToggle, 'expanded', 'true');
        a11y.announce('Sidebar expanded');
    }
    
    // Save preference
    localStorage.setItem('sidebarCollapsed', !isCollapsed);
}

// Mobile navigation
function toggleMobileNav() {
    const sidebar = document.getElementById('sidebar-nav');
    const overlay = document.querySelector('.mobile-overlay');
    const toggle = document.querySelector('.mobile-nav-toggle');
    const isOpen = sidebar.classList.contains('mobile-open');
    
    if (isOpen) {
        closeMobileNav();
    } else {
        sidebar.classList.add('mobile-open');
        overlay.classList.add('active');
        a11y.setAriaAttribute(toggle, 'expanded', 'true');
        a11y.announce('Navigation menu opened');
        
        // Trap focus in mobile nav
        const focusTrap = a11y.trapFocus(sidebar);
        sidebar.focusTrap = focusTrap;
    }
}

function closeMobileNav() {
    const sidebar = document.getElementById('sidebar-nav');
    const overlay = document.querySelector('.mobile-overlay');
    const toggle = document.querySelector('.mobile-nav-toggle');
    
    if (sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        a11y.setAriaAttribute(toggle, 'expanded', 'false');
        a11y.announce('Navigation menu closed');
        
        // Release focus trap
        if (sidebar.focusTrap) {
            sidebar.focusTrap.release();
            delete sidebar.focusTrap;
        }
    }
}

// Theme toggle functionality
function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    updateThemeToggle(isLight);
    
    // Save preference
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    
    // Announce change
    a11y.announce(`${isLight ? 'Light' : 'Dark'} theme activated`);
}

function updateThemeToggle(isLight) {
    const themeToggle = document.querySelector('.theme-toggle');
    const darkIcon = document.querySelector('.theme-icon-dark');
    const lightIcon = document.querySelector('.theme-icon-light');
    
    if (darkIcon && lightIcon) {
        darkIcon.style.display = isLight ? 'none' : 'block';
        lightIcon.style.display = isLight ? 'block' : 'none';
    }
    
    if (themeToggle) {
        a11y.setAriaAttribute(themeToggle, 'pressed', isLight ? 'true' : 'false');
        themeToggle.setAttribute('aria-label', `Toggle theme. Currently ${isLight ? 'light' : 'dark'} theme`);
    }
}

// Language change functionality
function changeLanguage(lang) {
    // Save preference
    localStorage.setItem('language', lang);
    
    const languages = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'pt': 'Portuguese'
    };
    
    a11y.announce(`Language changed to ${languages[lang] || lang}`);
    
    // In a real application, this would trigger language change
    console.log('Language changed to:', lang);
}

// Show notification
function showNotification(message, type = 'success', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    
    notification.innerHTML = `
        <div class="notification-content">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                ${type === 'success' ? 
                    '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>' :
                    type === 'error' ?
                    '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>' :
                    '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>'
                }
            </svg>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="notification-close" aria-label="Close notification">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
            </button>
        </div>
    `;
    
    // Add styles if not already present
    addNotificationStyles();
    
    document.body.appendChild(notification);
    
    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (!a11y.prefersReducedMotion()) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            } else {
                notification.remove();
            }
        }, duration);
    }
}

// Add notification styles
function addNotificationStyles() {
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(15, 23, 42, 0.95);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 0.5rem;
                padding: 1rem 1.5rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                z-index: 1001;
                animation: slideIn 0.3s ease-out;
                max-width: 400px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                flex: 1;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.6);
                cursor: pointer;
                padding: 0.25rem;
                margin-left: 0.5rem;
                border-radius: 0.25rem;
                transition: all 0.2s ease;
            }
            
            .notification-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }
            
            .notification-success {
                border-color: rgba(16, 185, 129, 0.3);
                color: #10B981;
            }
            
            .notification-error {
                border-color: rgba(239, 68, 68, 0.3);
                color: #EF4444;
            }
            
            .notification-warning {
                border-color: rgba(245, 158, 11, 0.3);
                color: #F59E0B;
            }
            
            .notification-info {
                border-color: rgba(59, 130, 246, 0.3);
                color: #3B82F6;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            @media (prefers-reduced-motion: reduce) {
                .notification {
                    animation: none;
                }
            }
            
            @media (max-width: 640px) {
                .notification {
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

// Form validation
function initializeFormValidation() {
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(form)) {
                e.preventDefault();
                a11y.announce('Please correct the errors in the form', 'assertive');
            }
        });
        
        // Real-time validation
        form.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('blur', function() {
                validateField(field);
            });
        });
    });
}

function validateForm(form) {
    let isValid = true;
    
    form.querySelectorAll('[required], [aria-required="true"]').forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    const isRequired = field.hasAttribute('required') || field.getAttribute('aria-required') === 'true';
    let isValid = true;
    let errorMessage = '';
    
    // Remove previous error
    const errorElement = field.parentElement.querySelector('.form-error');
    if (errorElement) {
        errorElement.remove();
    }
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
    
    // Check if required
    if (isRequired && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    }
    
    // Check specific validations
    if (value && field.type === 'email') {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    }
    
    if (value && field.type === 'tel') {
        const phonePattern = /^[\d\s\-\+\(\)]+$/;
        if (!phonePattern.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number';
        }
    }
    
    // Show error if invalid
    if (!isValid) {
        const error = document.createElement('span');
        error.className = 'form-error';
        error.textContent = errorMessage;
        error.id = `${field.id}-error`;
        field.parentElement.appendChild(error);
        
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', error.id);
    }
    
    return isValid;
}

// Modal management
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = modal ? modal.closest('.modal-overlay') : null;
    
    if (modal && overlay) {
        overlay.classList.add('active');
        a11y.announce('Modal opened');
        
        // Trap focus
        const focusTrap = a11y.trapFocus(modal);
        modal.focusTrap = focusTrap;
        
        // Set ARIA attributes
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('role', 'dialog');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = modal ? modal.closest('.modal-overlay') : null;
    
    if (modal && overlay) {
        overlay.classList.remove('active');
        a11y.announce('Modal closed');
        
        // Release focus trap
        if (modal.focusTrap) {
            modal.focusTrap.release();
            delete modal.focusTrap;
        }
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay.active').forEach(overlay => {
        const modal = overlay.querySelector('.modal');
        if (modal && modal.id) {
            closeModal(modal.id);
        }
    });
}

// Utility functions
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatCurrency(amount) {
    return '$' + formatNumber(amount.toFixed(2));
}

function formatPercentage(value, decimals = 1) {
    return value.toFixed(decimals) + '%';
}

// Submenu toggle functionality
function toggleSubmenu(menuId) {
    const button = event.currentTarget;
    const submenu = document.getElementById(`${menuId}-submenu`);
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    
    if (isExpanded) {
        // Close submenu
        button.setAttribute('aria-expanded', 'false');
        submenu.style.display = 'none';
        a11y.announce(`${menuId} submenu closed`);
    } else {
        // Close other submenus first
        document.querySelectorAll('.nav-link-expandable[aria-expanded="true"]').forEach(otherButton => {
            if (otherButton !== button) {
                const otherId = otherButton.getAttribute('aria-controls');
                const otherSubmenu = document.getElementById(otherId);
                otherButton.setAttribute('aria-expanded', 'false');
                if (otherSubmenu) otherSubmenu.style.display = 'none';
            }
        });
        
        // Open this submenu
        button.setAttribute('aria-expanded', 'true');
        submenu.style.display = 'block';
        a11y.announce(`${menuId} submenu opened`);
        
        // Focus first item
        const firstLink = submenu.querySelector('.nav-sublink');
        if (firstLink) {
            setTimeout(() => firstLink.focus(), 100);
        }
    }
    
    // Save state
    localStorage.setItem(`submenu-${menuId}`, !isExpanded);
}

// Restore submenu states
function restoreSubmenuStates() {
    document.querySelectorAll('.nav-link-expandable').forEach(button => {
        const menuId = button.getAttribute('aria-controls').replace('-submenu', '');
        const isOpen = localStorage.getItem(`submenu-${menuId}`) === 'true';
        
        if (isOpen) {
            button.setAttribute('aria-expanded', 'true');
            const submenu = document.getElementById(`${menuId}-submenu`);
            if (submenu) submenu.style.display = 'block';
        }
    });
}

// Add to initialization
document.addEventListener('DOMContentLoaded', function() {
    // Existing initialization...
    restoreSubmenuStates();
});

// Export for use in other scripts
window.a11y = a11y;
window.showNotification = showNotification;
window.toggleUserMenu = toggleUserMenu;
window.toggleSidebar = toggleSidebar;
window.toggleMobileNav = toggleMobileNav;
window.closeMobileNav = closeMobileNav;
window.toggleTheme = toggleTheme;
window.changeLanguage = changeLanguage;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleSubmenu = toggleSubmenu;
window.formatNumber = formatNumber;
window.formatCurrency = formatCurrency;
window.formatPercentage = formatPercentage;
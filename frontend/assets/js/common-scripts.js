// Common Scripts for blipee OS

// User dropdown functionality
function toggleUserMenu(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('active');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('userDropdown');
    const userProfile = event.target.closest('.user-profile');
    
    if (!userProfile && dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
    }
});

// Sidebar toggle
function toggleSidebar() {
    const layout = document.querySelector('.dashboard-layout');
    layout.classList.toggle('sidebar-collapsed');
    
    const collapseBtn = document.querySelector('.collapse-btn');
    const icon = collapseBtn.querySelector('svg');
    
    if (layout.classList.contains('sidebar-collapsed')) {
        icon.style.transform = 'rotate(180deg)';
    } else {
        icon.style.transform = 'rotate(0deg)';
    }
    
    // Save preference
    localStorage.setItem('sidebarCollapsed', layout.classList.contains('sidebar-collapsed'));
}

// Restore sidebar state
document.addEventListener('DOMContentLoaded', function() {
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        document.querySelector('.dashboard-layout').classList.add('sidebar-collapsed');
        document.querySelector('.collapse-btn svg').style.transform = 'rotate(180deg)';
    }
});

// Active navigation highlighting
document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath.includes(href.replace('.html', ''))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                ${type === 'success' ? 
                    '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>' :
                    '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>'
                }
            </svg>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles if not already present
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
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .notification-success {
                border-color: rgba(16, 185, 129, 0.3);
                color: #10B981;
            }
            
            .notification-error {
                border-color: rgba(239, 68, 68, 0.3);
                color: #EF4444;
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
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format currency
function formatCurrency(amount) {
    return '$' + formatNumber(amount.toFixed(2));
}

// Format percentage
function formatPercentage(value, decimals = 1) {
    return value.toFixed(decimals) + '%';
}

// Theme toggle functionality
function toggleTheme() {
    // In a real application, this would toggle between light and dark themes
    const isDark = document.body.classList.toggle('light-theme');
    document.querySelector('.theme-icon-dark').style.display = isDark ? 'none' : 'block';
    document.querySelector('.theme-icon-light').style.display = isDark ? 'block' : 'none';
}

// Language change functionality
function changeLanguage(lang) {
    // In a real application, this would change the language
    console.log('Language changed to:', lang);
}
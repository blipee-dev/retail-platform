# blipee OS Layout Guide

## Overview
All pages in blipee OS should follow the consistent layout structure established in `dashboard.html`. This guide explains how to properly implement the layout.

## Layout Structure

### 1. Basic HTML Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title - blipee OS</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="common-styles.css">
    <!-- Page specific styles here -->
</head>
<body>
    <div class="dashboard-layout">
        <!-- Header -->
        <!-- Sidebar -->
        <!-- Main Content -->
    </div>
    <script src="common-scripts.js"></script>
    <!-- Page specific scripts here -->
</body>
</html>
```

### 2. Header Structure
The header should be at the top level of the dashboard-layout, NOT inside main content:

```html
<header class="header">
    <div class="header-left">
        <a href="dashboard.html" class="logo">blipee</a>
        <nav class="breadcrumb">
            <a href="sites.html" class="breadcrumb-item">All Stores</a>
            <span class="breadcrumb-separator">/</span>
            <a href="dashboard.html" class="breadcrumb-item">Downtown Store</a>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-item active">Current Page</span>
        </nav>
    </div>
    <div class="header-actions">
        <!-- Page specific actions (buttons, etc) -->
        <div class="user-profile" onclick="toggleUserMenu(event)">
            <div class="user-avatar">JD</div>
            <div class="user-info">
                <span class="user-name">John Doe</span>
                <span class="user-role">Administrator</span>
            </div>
            <div class="user-dropdown" id="userDropdown">
                <!-- Dropdown items -->
            </div>
        </div>
    </div>
</header>
```

### 3. Sidebar Structure
The sidebar should be consistent across all pages:

```html
<aside class="sidebar">
    <nav>
        <ul class="nav-menu">
            <li class="nav-item">
                <a href="sites.html" class="nav-link">
                    <svg class="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                    </svg>
                    <span>Home</span>
                </a>
            </li>
            <!-- Other nav items -->
            <li class="nav-divider"></li>
            <li class="nav-item">
                <a href="settings.html" class="nav-link">
                    <svg class="nav-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path>
                    </svg>
                    <span>Settings</span>
                </a>
            </li>
        </ul>
    </nav>

    <!-- Sidebar Bottom -->
    <div class="sidebar-bottom">
        <div class="sidebar-footer">
            <!-- Footer content -->
        </div>
    </div>

    <!-- Collapse Button -->
    <button class="collapse-btn" onclick="toggleSidebar()">
        <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path>
        </svg>
    </button>
</aside>
```

### 4. Main Content Structure
The main content area should only contain the page-specific content:

```html
<main class="main-content">
    <!-- NO HEADER HERE - Header is at the top level -->
    
    <!-- Page specific content -->
    <div class="page-header">
        <h1 class="page-title">Page Title</h1>
        <p class="page-subtitle">Page description</p>
    </div>
    
    <!-- Rest of page content -->
</main>
```

## Key Differences from Current Implementation

### ❌ WRONG (Current in some pages):
```html
<main class="main-content">
    <header class="header">
        <!-- Header inside main -->
    </header>
    <!-- Content -->
</main>
```

### ✅ CORRECT (Dashboard pattern):
```html
<div class="dashboard-layout">
    <header class="header">
        <!-- Header at top level -->
    </header>
    <aside class="sidebar">
        <!-- Sidebar -->
    </aside>
    <main class="main-content">
        <!-- Only page content -->
    </main>
</div>
```

## Grid Layout
The dashboard uses CSS Grid for layout:
- Header: spans full width
- Sidebar: fixed 250px width (70px when collapsed)  
- Main: takes remaining space

```css
.dashboard-layout {
    display: grid;
    grid-template-columns: 250px 1fr;
    grid-template-rows: 70px 1fr;
    grid-template-areas: 
        "header header"
        "sidebar main";
    height: 100vh;
}
```

## Migration Checklist

When updating a page to the new layout:

1. [ ] Move header outside of main content to top level
2. [ ] Update sidebar navigation to match dashboard
3. [ ] Add breadcrumb navigation in header
4. [ ] Include user profile dropdown in header
5. [ ] Add collapse button to sidebar
6. [ ] Remove any duplicate header/sidebar styling
7. [ ] Include common-styles.css and common-scripts.js
8. [ ] Test sidebar collapse functionality
9. [ ] Test user dropdown functionality
10. [ ] Ensure responsive design works

## Common Components

### Buttons
- `.btn` - Base button class
- `.btn-primary` - Gradient primary button
- `.btn-secondary` - Glass secondary button
- `.btn-icon` - Icon-only button
- `.btn-danger` - Danger/delete button

### Cards
- `.card` - Glass morphism card container
- `.card-header` - Card header with title
- `.card-body` - Card content area

### Forms
- `.form-group` - Form field wrapper
- `.form-label` - Field label
- `.form-input` - Text input
- `.form-select` - Select dropdown
- `.form-textarea` - Textarea
- `.form-help` - Help text

## Color Variables
Always use CSS variables for consistency:
- `--gradient-primary` - Main gradient
- `--purple`, `--blue`, `--green`, etc - Solid colors
- `--dark`, `--darker` - Background colors
- `--white` - Text color
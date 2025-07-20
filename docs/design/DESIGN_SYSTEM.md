# blipee OS Retail Intelligence - Design System

## Overview

The blipee Design System is a comprehensive collection of reusable components, patterns, and guidelines that ensure consistency across the entire retail intelligence platform.

## Design Tokens

### Color Palette

```css
:root {
  /* Primary Brand Colors */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;   /* Primary */
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;

  /* Semantic Colors */
  --color-success-50: #ecfdf5;
  --color-success-500: #10b981;
  --color-success-600: #059669;
  
  --color-warning-50: #fffbeb;
  --color-warning-500: #f59e0b;
  --color-warning-600: #d97706;
  
  --color-error-50: #fef2f2;
  --color-error-500: #ef4444;
  --color-error-600: #dc2626;
  
  /* Neutral Colors */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  /* Typography */
  --font-family-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */

  /* Spacing */
  --spacing-1: 0.25rem;   /* 4px */
  --spacing-2: 0.5rem;    /* 8px */
  --spacing-3: 0.75rem;   /* 12px */
  --spacing-4: 1rem;      /* 16px */
  --spacing-5: 1.25rem;   /* 20px */
  --spacing-6: 1.5rem;    /* 24px */
  --spacing-8: 2rem;      /* 32px */
  --spacing-10: 2.5rem;   /* 40px */
  --spacing-12: 3rem;     /* 48px */

  /* Border Radius */
  --radius-sm: 0.25rem;   /* 4px */
  --radius-base: 0.375rem; /* 6px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}
```

## Typography System

### Font Hierarchy

```css
/* Heading Styles */
.text-h1 {
  font-size: var(--font-size-4xl);
  font-weight: 700;
  line-height: 1.25;
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-6);
}

.text-h2 {
  font-size: var(--font-size-3xl);
  font-weight: 600;
  line-height: 1.25;
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-5);
}

.text-h3 {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-4);
}

.text-h4 {
  font-size: var(--font-size-xl);
  font-weight: 600;
  line-height: 1.4;
  color: var(--color-gray-800);
  margin-bottom: var(--spacing-3);
}

/* Body Text */
.text-body-lg {
  font-size: var(--font-size-lg);
  font-weight: 400;
  line-height: 1.6;
  color: var(--color-gray-700);
}

.text-body {
  font-size: var(--font-size-base);
  font-weight: 400;
  line-height: 1.5;
  color: var(--color-gray-700);
}

.text-body-sm {
  font-size: var(--font-size-sm);
  font-weight: 400;
  line-height: 1.4;
  color: var(--color-gray-600);
}

/* Utility Text */
.text-caption {
  font-size: var(--font-size-xs);
  font-weight: 400;
  line-height: 1.3;
  color: var(--color-gray-500);
}

.text-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  line-height: 1.4;
  color: var(--color-gray-700);
}
```

## Component Library

### Button Components

```css
/* Base Button */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-base);
  font-weight: 500;
  transition: all 150ms ease-out;
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
  font-family: inherit;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Button Variants */
.btn-primary {
  background-color: var(--color-primary-500);
  color: white;
  border-color: var(--color-primary-500);
}

.btn-primary:hover {
  background-color: var(--color-primary-600);
  border-color: var(--color-primary-600);
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: transparent;
  color: var(--color-primary-500);
  border-color: var(--color-primary-500);
}

.btn-secondary:hover {
  background-color: var(--color-primary-50);
}

.btn-ghost {
  background-color: transparent;
  color: var(--color-gray-600);
  border-color: transparent;
}

.btn-ghost:hover {
  background-color: var(--color-gray-100);
  color: var(--color-gray-700);
}

/* Button Sizes */
.btn-sm {
  height: 32px;
  padding: 0 var(--spacing-4);
  font-size: var(--font-size-sm);
}

.btn-md {
  height: 40px;
  padding: 0 var(--spacing-6);
  font-size: var(--font-size-base);
}

.btn-lg {
  height: 48px;
  padding: 0 var(--spacing-8);
  font-size: var(--font-size-lg);
}
```

### Form Components

```css
/* Input Fields */
.input {
  width: 100%;
  height: 40px;
  padding: 0 var(--spacing-4);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-base);
  font-size: var(--font-size-base);
  font-family: inherit;
  transition: all 150ms ease-out;
  background-color: white;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.input:disabled {
  background-color: var(--color-gray-100);
  color: var(--color-gray-400);
  cursor: not-allowed;
}

.input.error {
  border-color: var(--color-error-500);
}

.input.error:focus {
  box-shadow: 0 0 0 3px var(--color-error-50);
}

/* Labels */
.label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-gray-700);
}

.label.required::after {
  content: '*';
  color: var(--color-error-500);
  margin-left: var(--spacing-1);
}

/* Form Groups */
.form-group {
  margin-bottom: var(--spacing-5);
}

.form-error {
  margin-top: var(--spacing-1);
  font-size: var(--font-size-xs);
  color: var(--color-error-500);
}

.form-help {
  margin-top: var(--spacing-1);
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
}
```

### Card Components

```css
.card {
  background-color: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-base);
  border: 1px solid var(--color-gray-200);
  overflow: hidden;
}

.card-header {
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--color-gray-200);
  background-color: var(--color-gray-50);
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0;
}

.card-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
  margin: var(--spacing-1) 0 0 0;
}

.card-body {
  padding: var(--spacing-6);
}

.card-footer {
  padding: var(--spacing-4) var(--spacing-6);
  background-color: var(--color-gray-50);
  border-top: 1px solid var(--color-gray-200);
}

/* Card Variants */
.card-interactive {
  cursor: pointer;
  transition: all 150ms ease-out;
}

.card-interactive:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Navigation Components

```css
/* Sidebar Navigation */
.sidebar {
  width: 280px;
  height: 100vh;
  background-color: var(--color-gray-50);
  border-right: 1px solid var(--color-gray-200);
  padding: var(--spacing-4);
}

.sidebar-logo {
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-6);
  border-bottom: 1px solid var(--color-gray-200);
}

.nav-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin-bottom: var(--spacing-1);
}

.nav-link {
  display: flex;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-4);
  color: var(--color-gray-600);
  text-decoration: none;
  border-radius: var(--radius-base);
  transition: all 150ms ease-out;
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.nav-link:hover {
  background-color: var(--color-gray-100);
  color: var(--color-gray-700);
}

.nav-link.active {
  background-color: var(--color-primary-500);
  color: white;
}

.nav-icon {
  width: 20px;
  height: 20px;
  margin-right: var(--spacing-3);
}

/* Breadcrumbs */
.breadcrumb {
  display: flex;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0 0 var(--spacing-6) 0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
}

.breadcrumb-item:not(:last-child)::after {
  content: '/';
  margin: 0 var(--spacing-2);
  color: var(--color-gray-400);
}

.breadcrumb-link {
  color: var(--color-gray-500);
  text-decoration: none;
  font-size: var(--font-size-sm);
}

.breadcrumb-link:hover {
  color: var(--color-primary-500);
}

.breadcrumb-current {
  color: var(--color-gray-900);
  font-weight: 500;
  font-size: var(--font-size-sm);
}
```

### Data Display Components

```css
/* Tables */
.table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-base);
}

.table-header {
  background-color: var(--color-gray-50);
}

.table-header th {
  padding: var(--spacing-4);
  text-align: left;
  font-weight: 600;
  color: var(--color-gray-700);
  font-size: var(--font-size-sm);
  border-bottom: 2px solid var(--color-gray-200);
}

.table-body tr {
  border-bottom: 1px solid var(--color-gray-100);
  transition: background-color 150ms ease-out;
}

.table-body tr:hover {
  background-color: var(--color-gray-50);
}

.table-body td {
  padding: var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
}

/* Badges/Tags */
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.badge-success {
  background-color: var(--color-success-50);
  color: var(--color-success-600);
}

.badge-warning {
  background-color: var(--color-warning-50);
  color: var(--color-warning-600);
}

.badge-error {
  background-color: var(--color-error-50);
  color: var(--color-error-600);
}

.badge-neutral {
  background-color: var(--color-gray-100);
  color: var(--color-gray-600);
}
```

### Modal Components

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-4);
}

.modal-container {
  background-color: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--color-gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  padding: var(--spacing-2);
  cursor: pointer;
  color: var(--color-gray-400);
  border-radius: var(--radius-base);
}

.modal-close:hover {
  background-color: var(--color-gray-100);
  color: var(--color-gray-600);
}

.modal-body {
  padding: var(--spacing-6);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--color-gray-200);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
}
```

## Layout System

### Grid System

```css
.container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

.grid {
  display: grid;
  gap: var(--spacing-6);
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
.grid-cols-6 { grid-template-columns: repeat(6, 1fr); }
.grid-cols-12 { grid-template-columns: repeat(12, 1fr); }

/* Column Spans */
.col-span-1 { grid-column: span 1; }
.col-span-2 { grid-column: span 2; }
.col-span-3 { grid-column: span 3; }
.col-span-4 { grid-column: span 4; }
.col-span-6 { grid-column: span 6; }
.col-span-12 { grid-column: span 12; }

/* Responsive Grid */
@media (max-width: 768px) {
  .grid-cols-2,
  .grid-cols-3,
  .grid-cols-4,
  .grid-cols-6,
  .grid-cols-12 {
    grid-template-columns: 1fr;
  }
  
  .col-span-2,
  .col-span-3,
  .col-span-4,
  .col-span-6,
  .col-span-12 {
    grid-column: span 1;
  }
}
```

### Dashboard Layout

```css
.dashboard-layout {
  display: grid;
  grid-template-areas: 
    "sidebar header"
    "sidebar main";
  grid-template-columns: 280px 1fr;
  grid-template-rows: 64px 1fr;
  height: 100vh;
}

.dashboard-header {
  grid-area: header;
  background-color: white;
  border-bottom: 1px solid var(--color-gray-200);
  padding: 0 var(--spacing-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dashboard-sidebar {
  grid-area: sidebar;
  background-color: var(--color-gray-50);
  border-right: 1px solid var(--color-gray-200);
}

.dashboard-main {
  grid-area: main;
  padding: var(--spacing-6);
  background-color: var(--color-gray-50);
  overflow-y: auto;
}

/* Mobile Layout */
@media (max-width: 768px) {
  .dashboard-layout {
    grid-template-areas: 
      "header"
      "main";
    grid-template-columns: 1fr;
    grid-template-rows: 64px 1fr;
  }
  
  .dashboard-sidebar {
    display: none;
  }
}
```

## Responsive Utilities

```css
/* Responsive Display */
.hidden { display: none; }
.block { display: block; }
.inline-block { display: inline-block; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }

@media (max-width: 640px) {
  .sm\:hidden { display: none; }
  .sm\:block { display: block; }
  .sm\:flex { display: flex; }
  .sm\:grid { display: grid; }
}

@media (min-width: 768px) {
  .md\:hidden { display: none; }
  .md\:block { display: block; }
  .md\:flex { display: flex; }
  .md\:grid { display: grid; }
}

@media (min-width: 1024px) {
  .lg\:hidden { display: none; }
  .lg\:block { display: block; }
  .lg\:flex { display: flex; }
  .lg\:grid { display: grid; }
}

/* Responsive Spacing */
@media (max-width: 640px) {
  .sm\:p-2 { padding: var(--spacing-2); }
  .sm\:p-4 { padding: var(--spacing-4); }
  .sm\:m-2 { margin: var(--spacing-2); }
  .sm\:m-4 { margin: var(--spacing-4); }
}
```

## Accessibility Features

```css
/* Focus States */
.focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* Skip Links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--color-primary-500);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}

/* Screen Reader Only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High Contrast */
@media (prefers-contrast: high) {
  .btn {
    border-width: 2px;
  }
  
  .input {
    border-width: 2px;
  }
  
  .card {
    border-width: 2px;
  }
}
```

## Animation Library

```css
/* Fade Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* Slide Animations */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Loading Spinner */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-gray-200);
  border-top: 2px solid var(--color-primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Utility Classes */
.animate-fadeIn { animation: fadeIn 300ms ease-out; }
.animate-slideInUp { animation: slideInUp 300ms ease-out; }
.animate-slideInDown { animation: slideInDown 300ms ease-out; }
.animate-spin { animation: spin 1s linear infinite; }
```

## Usage Guidelines

### Component Composition

```html
<!-- Example: Dashboard Card -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Revenue Today</h3>
    <p class="card-subtitle">Last updated 2 minutes ago</p>
  </div>
  <div class="card-body">
    <div class="text-h2">$12,450</div>
    <div class="text-body-sm text-success">
      +12% from yesterday
    </div>
  </div>
</div>

<!-- Example: Form -->
<form class="space-y-4">
  <div class="form-group">
    <label class="label required" for="storeName">Store Name</label>
    <input 
      type="text" 
      id="storeName" 
      class="input" 
      placeholder="Enter store name"
      required
    >
    <div class="form-help">This will be displayed in reports</div>
  </div>
  
  <div class="flex gap-3">
    <button type="submit" class="btn btn-primary btn-md">Save Store</button>
    <button type="button" class="btn btn-ghost btn-md">Cancel</button>
  </div>
</form>
```

### Design Token Usage

```css
/* Good: Using design tokens */
.custom-component {
  padding: var(--spacing-4);
  background-color: var(--color-gray-50);
  border-radius: var(--radius-base);
  font-size: var(--font-size-sm);
}

/* Bad: Hard-coded values */
.custom-component {
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 6px;
  font-size: 14px;
}
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-07-16  
**Next Review**: 2025-10-16  
**Owner**: Head of Design
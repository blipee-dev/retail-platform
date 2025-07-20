# blipee OS UI/UX Design System Specification

## Overview

blipee OS uses a sophisticated glass morphism design system with a dark-first theme, creating a premium, futuristic experience for our autonomous sustainability intelligence platform. This document provides comprehensive guidelines for maintaining design consistency across all interfaces.

## Core Design Principles

1. **Glass Morphism First**: Every surface uses translucent backgrounds with backdrop blur
2. **Gradient Accents**: Purple-to-blue gradients define our brand identity
3. **Subtle Animations**: Smooth, professional transitions enhance user experience
4. **Dark Mode Primary**: Optimized for reduced eye strain during extended use
5. **Premium Feel**: Glow effects, shimmer overlays, and ambient animations
6. **Conversational UI**: Chat-first interface with dynamic component rendering
7. **Accessibility**: High contrast ratios and clear visual hierarchy

## Color System

### Primary Palette

```css
/* Core Colors */
--primary: #0EA5E9;      /* Sky blue */
--secondary: #8B5CF6;    /* Purple */
--success: #10B981;      /* Green */
--background: #0A0A0A;   /* Near black */
--surface: #1A1A1A;      /* Dark gray */
```

### Brand Colors

```css
/* Extended Palette */
--purple: #8B5CF6;
--blue: #0EA5E9;
--green: #10B981;
--orange: #F59E0B;
--pink: #EC4899;
--red: #EF4444;
```

### Gradient Definitions

```css
/* Brand Gradients */
--gradient-primary: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
--gradient-blue: linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%);
--gradient-brand: linear-gradient(135deg, #8B5CF6 0%, #0EA5E9 100%);
```

## Glass Morphism Components

### Standard Glass Card

The foundation of our design system - translucent cards with backdrop blur:

```tsx
// Basic glass card
<div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-lg">
  {/* Content */}
</div>

// With shadow for elevation
<div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-lg">
  {/* Content */}
</div>
```

### Glass Morphism Utility Function

For JavaScript-based styling:

```typescript
export const glassmorphism = {
  background: "rgba(255, 255, 255, 0.02)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)"
}
```

## Layout Patterns

### Main Application Layout

Our application uses layered gradient backgrounds for depth:

```tsx
<div className="relative min-h-screen">
  {/* Background Layers */}
  <div className="fixed inset-0 bg-gradient-to-br from-purple-900/10 via-black to-blue-900/10" />
  <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
  
  {/* Content */}
  <div className="relative z-10">
    {children}
  </div>
</div>
```

### Container Patterns

```tsx
// Full width container with padding
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>

// Centered content container
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>

// Conversation container
<div className="max-w-4xl mx-auto px-4 py-8">
  {/* Chat interface */}
</div>
```

## Component Library

### Buttons

#### Primary Button
```tsx
<button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors">
  Click me
</button>
```

#### Ghost Button
```tsx
<button className="bg-transparent hover:bg-white/[0.05] text-white/80 hover:text-white px-4 py-2 rounded-lg transition-all">
  Ghost Button
</button>
```

#### Gradient Button
```tsx
<button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105">
  Premium Action
</button>
```

### Form Elements

#### Input Field
```tsx
<input 
  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-white/[0.3] focus:bg-white/[0.08] transition-all"
  placeholder="Enter text..."
/>
```

#### Select Dropdown
```tsx
<select className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/[0.3]">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

### Message Components

#### User Message
```tsx
<div className="flex justify-end mb-4">
  <div className="max-w-[80%] bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 rounded-lg px-4 py-2">
    <p className="text-white">{message}</p>
  </div>
</div>
```

#### Assistant Message
```tsx
<div className="flex justify-start mb-4">
  <div className="max-w-[80%] bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-sm border border-white/[0.05] rounded-lg px-4 py-2 transition-all">
    <p className="text-white/90">{message}</p>
  </div>
</div>
```

### Cards

#### Basic Card
```tsx
<Card className="rounded-lg border border-white/[0.05] bg-white/[0.03] backdrop-blur-xl p-6">
  <h3 className="text-lg font-semibold text-white mb-2">Card Title</h3>
  <p className="text-white/70">Card content goes here...</p>
</Card>
```

#### Metric Card
```tsx
<div className="rounded-lg border border-white/[0.05] bg-white/[0.03] backdrop-blur-xl p-6 hover:bg-white/[0.05] transition-all">
  <div className="flex items-center justify-between mb-2">
    <span className="text-white/60 text-sm">Total Emissions</span>
    <TrendingDown className="w-4 h-4 text-green-500" />
  </div>
  <div className="text-2xl font-bold text-white">1,234 tCO2e</div>
  <div className="text-sm text-green-500 mt-1">-12% from last month</div>
</div>
```

## Animation Patterns

### Framer Motion Animations

#### Fade In Up
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  {/* Content */}
</motion.div>
```

#### Stagger Children
```tsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
>
  {items.map((item) => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### CSS Animations

```css
/* Shimmer effect for loading states */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.shimmer {
  position: relative;
  overflow: hidden;
}

.shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  animation: shimmer 2s infinite;
}

/* Pulse glow for important elements */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
  50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.5); }
}

.pulse-glow {
  animation: pulse-glow 2s infinite;
}
```

## Special Effects

### Glow Effects

```css
/* Element glows */
.glow-purple { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
.glow-blue { box-shadow: 0 0 20px rgba(14, 165, 233, 0.3); }
.glow-green { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }

/* Text glows */
.text-glow-purple { text-shadow: 0 0 20px rgba(139, 92, 246, 0.5); }
.text-glow-blue { text-shadow: 0 0 20px rgba(14, 165, 233, 0.5); }
```

### Gradient Text

```tsx
<h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
  Gradient Heading
</h1>
```

### Ambient Background Particles

```tsx
<div className="fixed inset-0 overflow-hidden pointer-events-none">
  <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
  <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
</div>
```

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Type Scale

```css
/* Display */
.text-display-lg { font-size: 3.5rem; font-weight: 700; line-height: 1.1; }
.text-display-md { font-size: 2.5rem; font-weight: 700; line-height: 1.2; }

/* Headings */
.text-h1 { font-size: 2rem; font-weight: 600; line-height: 1.3; }
.text-h2 { font-size: 1.5rem; font-weight: 600; line-height: 1.4; }
.text-h3 { font-size: 1.25rem; font-weight: 500; line-height: 1.5; }

/* Body */
.text-body { font-size: 1rem; font-weight: 400; line-height: 1.6; }
.text-body-sm { font-size: 0.875rem; font-weight: 400; line-height: 1.5; }

/* Caption */
.text-caption { font-size: 0.75rem; font-weight: 400; line-height: 1.4; }
```

## Responsive Design

### Breakpoints

```css
/* Tailwind default breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

### Mobile-First Patterns

```tsx
<div className="
  px-4 py-2          /* Mobile */
  sm:px-6 sm:py-3    /* Small screens and up */
  lg:px-8 lg:py-4    /* Large screens and up */
">
  {/* Content */}
</div>
```

## Light Mode

### Implementation

```css
/* Light mode color overrides */
.light-mode {
  --foreground: rgb(26, 26, 26);
  --background: rgb(250, 250, 250);
}

/* Light mode glass effect */
.light-mode .glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
```

### Toggle Implementation

```tsx
<button
  onClick={toggleTheme}
  className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
>
  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
</button>
```

## Accessibility Guidelines

1. **Color Contrast**: Maintain WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
2. **Focus States**: Clear visible focus indicators on all interactive elements
3. **Keyboard Navigation**: All functionality accessible via keyboard
4. **Screen Readers**: Proper ARIA labels and semantic HTML
5. **Motion**: Respect prefers-reduced-motion preference

### Focus State Example

```css
.focus-visible:focus {
  outline: 2px solid #0EA5E9;
  outline-offset: 2px;
}
```

## Implementation Examples

### Complete Page Layout

```tsx
export default function DashboardPage() {
  return (
    <div className="min-h-screen relative">
      {/* Background layers */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/10 via-black to-blue-900/10" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/[0.05] backdrop-blur-xl bg-white/[0.02]">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          </div>
        </header>
        
        {/* Main content */}
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Metric cards */}
            <Card className="rounded-lg border border-white/[0.05] bg-white/[0.03] backdrop-blur-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Total Emissions</h3>
              <div className="text-3xl font-bold text-white">1,234 tCO2e</div>
              <div className="text-sm text-green-500 mt-2">-12% from last month</div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
```

### Dynamic Component Rendering

```tsx
// Render different components based on AI response
function DynamicContent({ type, data }) {
  switch (type) {
    case 'chart':
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg border border-white/[0.05] bg-white/[0.03] backdrop-blur-xl p-6"
        >
          <Chart data={data} />
        </motion.div>
      );
      
    case 'alert':
      return (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-lg border border-red-500/20 bg-red-500/10 backdrop-blur-xl p-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-white">{data.message}</p>
          </div>
        </motion.div>
      );
      
    default:
      return null;
  }
}
```

## Best Practices

1. **Consistency**: Always use the established color palette and component patterns
2. **Performance**: Minimize backdrop-filter usage on mobile for better performance
3. **Accessibility**: Test with screen readers and keyboard navigation
4. **Responsiveness**: Design mobile-first and enhance for larger screens
5. **Animation**: Keep animations subtle and purposeful
6. **Glass Effects**: Ensure sufficient contrast when using translucent backgrounds
7. **Loading States**: Use shimmer effects for skeleton screens
8. **Error States**: Clearly communicate errors with appropriate colors and icons

## Resources

- Tailwind CSS Documentation: https://tailwindcss.com/docs
- Framer Motion: https://www.framer.com/motion/
- shadcn/ui Components: https://ui.shadcn.com/
- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/

---

This specification should be treated as a living document and updated as the design system evolves. For questions or clarifications, refer to the implemented components in the codebase as the source of truth.
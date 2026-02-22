# 📱 Mobile Responsive Layout - Technical Reference Guide

## Quick Reference

### State Variable
```tsx
const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
```

### Mobile Menu Button (Position: Top-Right)
```tsx
<div className="md:hidden fixed top-16 right-4 z-40">
  <button onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}>
    {isMobileSidebarOpen ? (
      <svg>{/* X Icon */}</svg>
    ) : (
      <svg>{/* Hamburger Icon */}</svg>
    )}
  </button>
</div>
```

### Mobile Overlay
```tsx
{isMobileSidebarOpen && (
  <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 top-16"
    onClick={() => setIsMobileSidebarOpen(false)}
  />
)}
```

### Desktop Sidebar (Hover-Expand)
```tsx
<div className={`hidden md:flex fixed right-0 top-16 h-[calc(100vh-4rem)] 
  transition-all duration-300 z-50 flex flex-col ${
  isSidebarExpanded ? 'w-80' : 'w-16'
}`}
  onMouseEnter={() => setIsSidebarExpanded(true)}
  onMouseLeave={() => setIsSidebarExpanded(false)}
>
  {/* Sidebar Content */}
</div>
```

### Mobile Sidebar Sheet
```tsx
<div className={`md:hidden fixed right-0 top-16 h-[calc(100vh-4rem)] 
  w-80 bg-white dark:bg-gray-800 shadow-lg border-l border-gray-200 
  dark:border-gray-700 transition-transform duration-300 z-40 flex flex-col ${
  isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'
}`}>
  {/* Mobile Navigation Content */}
</div>
```

### Main Content (Responsive Margin)
```tsx
<div className="flex-1 transition-all duration-300 mr-0 md:mr-16 ease-in-out">
  {children}
</div>
```

## Detailed Pattern Breakdown

### 1. Mobile Menu Button
**When**: Always visible on mobile, always hidden on desktop
**Where**: Fixed position at top-16 right-4
**What**: Hamburger icon (≡) / X (✕) toggle
**Z-Index**: 40 (above everything except modal dialogs)

```tsx
// Hidden on medium breakpoint and up
<div className="md:hidden fixed top-16 right-4 z-40">
  <button 
    onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
    className="inline-flex items-center justify-center p-2 rounded-lg 
      bg-[WORKSPACE_COLOR] hover:bg-[WORKSPACE_COLOR_DARK] text-white 
      shadow-lg transition-colors"
    aria-label="فتح/بستن منو" // Farsi label
  >
    {isMobileSidebarOpen ? (
      // X Icon
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M6 18L18 6M6 6l12 12" />
      </svg>
    ) : (
      // Hamburger Icon
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    )}
  </button>
</div>
```

### 2. Mobile Overlay
**When**: Only visible when mobile sidebar is open
**Where**: Full screen (inset-0)
**What**: Semi-transparent dark background
**Z-Index**: 30 (below sidebar)
**Action**: Click to close sidebar

```tsx
// Hidden on desktop (md:hidden)
{isMobileSidebarOpen && (
  <div 
    className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 top-16"
    onClick={() => setIsMobileSidebarOpen(false)}
    role="presentation"
  />
)}
```

### 3. Desktop Sidebar
**When**: Always visible on desktop, always hidden on mobile
**Where**: Fixed right-0 top-16
**What**: Hover-expand sidebar (collapsed w-16, expanded w-80)
**Animation**: 300ms smooth width change
**Z-Index**: 50 (above main content)

```tsx
<div 
  className={`hidden md:flex fixed right-0 top-16 
    h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 shadow-lg 
    border-l border-gray-200 dark:border-gray-700 
    transition-all duration-300 ease-in-out z-50 flex flex-col ${
    isSidebarExpanded ? 'w-80' : 'w-16'
  }`}
  onMouseEnter={() => setIsSidebarExpanded(true)}
  onMouseLeave={() => setIsSidebarExpanded(false)}
>
  {/* Content only shown when expanded */}
  {(isSidebarExpanded) && (
    <div>{/* Sidebar header, nav, user info */}</div>
  )}
  
  {/* Icons only shown when collapsed */}
  {(!isSidebarExpanded) && (
    <div>{/* Icon buttons */}</div>
  )}
</div>
```

### 4. Mobile Sidebar Sheet
**When**: Only visible on mobile when isMobileSidebarOpen is true
**Where**: Fixed right-0 top-16, slides from right
**What**: Full navigation drawer (always expanded)
**Animation**: 300ms slide from right (translate-x-full → translate-x-0)
**Z-Index**: 40 (above main content, below overlay)

```tsx
<div className={`md:hidden fixed right-0 top-16 
  h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 shadow-lg 
  border-l border-gray-200 dark:border-gray-700 
  transition-transform duration-300 ease-in-out z-40 
  flex flex-col w-80 ${
  isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'
}`}>
  {/* Header */}
  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
    <div className="flex items-center space-x-4 space-x-reverse mb-4">
      <button onClick={() => setIsMobileSidebarOpen(false)}>
        {/* Close button */}
      </button>
    </div>
    {/* Workspace info */}
  </div>

  {/* Navigation */}
  <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2">
    {navigationItems.map(item => (
      <Link 
        key={item.href} 
        href={item.href}
        onClick={() => setIsMobileSidebarOpen(false)}
      >
        {/* Navigation item */}
      </Link>
    ))}
  </nav>

  {/* User info footer */}
  {user && (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      {/* User section */}
    </div>
  )}
</div>
```

### 5. Main Content
**When**: Always visible
**Where**: Takes remaining space (flex-1)
**What**: The page content area
**Margin**: 0 on mobile, mr-16 (4rem) on desktop

```tsx
<div className="flex-1 transition-all duration-300 mr-0 md:mr-16 ease-in-out">
  <main className="p-4 sm:p-6">
    {children}
  </main>
</div>
```

## Color Scheme Configuration

### Per-Workspace Colors

| Workspace | Primary | Gradient | Icon | Usage |
|-----------|---------|----------|------|-------|
| BI | Purple-500 | from-purple-500 to-purple-600 | Chart | Menu button, sidebar header |
| Inventory | Blue-500 | from-blue-500 to-blue-600 | Box | Menu button, sidebar header |
| CRM | Pink-500 | from-pink-500 to-pink-600 | Users | Menu button, sidebar header |
| Accounting | Green-500 | from-green-500 to-green-600 | Money | Menu button, sidebar header |
| SMS | Green-500 | from-green-500 to-green-600 | Message | Menu button, sidebar header |
| Ordering | Amber-500 | from-amber-500 to-amber-600 | Cart | Menu button, sidebar header |
| PR | Purple-500 | from-purple-500 to-purple-600 | Broadcast | Menu button, sidebar header |

### Implementation
```tsx
// Mobile menu button
<button className="bg-gradient-to-br from-[WORKSPACE_COLOR-500] to-[WORKSPACE_COLOR-600]">

// Mobile overlay
<div className="bg-black bg-opacity-50">

// Active state colors
<div className={`${isActive ? 'bg-[WORKSPACE_COLOR-50] dark:bg-[WORKSPACE_COLOR-900/20] text-[WORKSPACE_COLOR-700] dark:text-[WORKSPACE_COLOR-300]' : ''}`}>
```

## Animation Properties

### Sidebar Slide Animation
```css
transition-transform duration-300 ease-in-out
transform: translateX(100%) → translateX(0)
```

### Menu Button Icon Change
```css
/* Handled via conditional rendering, not CSS animation */
```

### Hover Expand (Desktop Sidebar)
```css
transition-all duration-300 ease-in-out
width: w-16 → w-80 on hover
```

### Main Content Margin
```css
transition-all duration-300 ease-in-out
margin-right: mr-0 (mobile) → mr-16 (desktop)
```

## Z-Index Hierarchy

```
Modal Dialogs (999+) ─── For modals, alerts, etc.
    ↑
Menu Button (40) ─────── Fixed position button
Mobile Sidebar (40) ───── Fixed position drawer
Mobile Overlay (30) ───── Semi-transparent background
Desktop Sidebar (50) ──── Hover-expand sidebar
Main Content (default) ─ Page content (flex-1)
```

## Dark Mode Support

All components include dark mode variants using `dark:` prefix:

```tsx
// Light mode / Dark mode
<div className="bg-white dark:bg-gray-800">
<div className="border-gray-200 dark:border-gray-700">
<div className="text-gray-900 dark:text-white">
<div className="bg-gray-50 dark:bg-gray-900/20">
```

## RTL (Right-to-Left) Support

### Key RTL Properties
```tsx
dir="rtl" // Add to root container
space-x-reverse // Reverse flex spacing
ml-3 becomes ml-3 (icon margin-left in RTL = margin-right visually)
```

### Implementation Pattern
```tsx
<div className="flex items-center space-x-4 space-x-reverse">
  {/* First item appears on right, last item on left */}
  <Icon />
  <Text />
</div>
```

## Responsive Breakpoints Reference

```
Breakpoint  | px    | When to Use
------------|-------|--------------------------------------
xs          | 0     | Base styles (apply to all sizes)
sm          | 640   | Small phones in landscape
md          | 768   | Tablets and larger phones
lg          | 1024  | Small laptops
xl          | 1280  | Desktops
2xl         | 1536  | Large desktops

Used in this project:
- md:hidden = Hide on tablets and larger
- hidden md:flex = Hide by default, show on tablets
- mr-0 md:mr-16 = 0 margin on mobile, 4rem on tablets
```

## Performance Considerations

### CSS Classes Only
- No JavaScript animations
- GPU-accelerated transforms
- Minimal DOM manipulation

### React Optimization
- Single state variable: `isMobileSidebarOpen`
- Single state variable: `isSidebarExpanded` (desktop only)
- Minimal re-renders (state change only)
- Navigation items rendered once

### Best Practices Applied
- Semantic HTML (`nav`, `button`, `link`)
- ARIA labels for accessibility
- Smooth transitions (300ms)
- Proper z-index management
- Full dark mode support

## Common Issues & Solutions

### Issue: Sidebar overlaps content on mobile
**Solution**: Check for `md:hidden` on mobile sidebar, ensure main content has `mr-0 md:mr-16`

### Issue: Menu button hard to click
**Solution**: Ensure padding (p-2) and icon size (w-6 h-6) are adequate

### Issue: Sidebar doesn't close on link click
**Solution**: Add `onClick={() => setIsMobileSidebarOpen(false)}` to Link components

### Issue: Dark mode colors wrong
**Solution**: Ensure `dark:` prefix is added to all color classes

### Issue: RTL layout broken
**Solution**: Check for `space-x-reverse` on flex containers, `dir="rtl"` on root

### Issue: Animation stutters
**Solution**: Check for conflicting CSS, ensure `transition-all duration-300 ease-in-out` is present

## Implementation Checklist

When adding mobile responsive sidebar to new workspace:

- [ ] Add `const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);`
- [ ] Add mobile menu button (hidden on md+)
- [ ] Add mobile overlay (hidden on md+)
- [ ] Add desktop sidebar (hidden on mobile)
- [ ] Add mobile sidebar sheet (hidden on md+)
- [ ] Update main content margins to `mr-0 md:mr-16`
- [ ] Add navigation items to mobile sheet
- [ ] Add user info to mobile sheet
- [ ] Apply workspace color scheme
- [ ] Test on mobile device
- [ ] Test on desktop
- [ ] Test dark mode
- [ ] Test RTL layout
- [ ] Verify accessibility (aria labels, keyboard nav)

## Debugging Tips

### Check Mobile State
```tsx
{/* Render mobile info for debugging */}
<div className="fixed bottom-0 left-0 z-50 text-xs">
  Mobile: {isMobileSidebarOpen ? 'Open' : 'Closed'}
</div>
```

### Check Current Breakpoint
```tsx
{/* Add to page to see current breakpoint */}
<div className="fixed bottom-0 right-0 z-50 text-xs bg-black text-white p-2">
  <span className="block sm:hidden">xs</span>
  <span className="hidden sm:block md:hidden">sm</span>
  <span className="hidden md:block lg:hidden">md</span>
  <span className="hidden lg:block xl:hidden">lg</span>
  <span className="hidden xl:block">xl</span>
</div>
```

### Test RTL
```tsx
{/* Add to body to toggle RTL */}
<button onClick={() => document.dir = document.dir === 'rtl' ? 'ltr' : 'rtl'}>
  Toggle RTL
</button>
```

## Browser DevTools Tips

1. **Mobile Testing**: Use Chrome DevTools responsive mode (F12)
2. **RTL Testing**: Inspect element, change `dir="rtl"` to `dir="ltr"` to test
3. **Dark Mode Testing**: Emulate CSS media features → prefers-color-scheme: dark
4. **Performance**: Check Lighthouse for Core Web Vitals
5. **Accessibility**: Run axe DevTools scan


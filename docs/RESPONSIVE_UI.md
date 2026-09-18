# BackupOps — Responsive Design & Mobile UI Architecture

## 1. Overview & Mobile First Philosophy

BackupOps is designed to run seamlessly as an operator console on mobile phones (320px–414px), tablets (768px–1024px), laptops (1280px), desktop monitors (1440px), and ultrawide displays (1920px+).

### Root Causes of Previous Mobile Bugs
1. **Fixed Desktop Sidebar**: The sidebar previously used a fixed layout (`w-60 shrink-0 h-screen`) side-by-side with the main content, squishing main content into an unreadable narrow strip on mobile.
2. **Fixed Pixel Widths & Rigid Grids**: Views utilized fixed pixel constraints (`min-w-[800px]` or rigid 4-column grids), forcing horizontal overflow and clipped cards.
3. **Competing Navigation State**: Components maintained internal `selectedTab` state rather than deriving active navigation strictly from the browser URL path, causing jarring back-and-forth redirects during viewport re-renders.

---

## 2. Layout Hierarchy & Responsive Breakpoints

| Viewport Category | Width Range | Sidebar Mode | Dashboard Grid | Header Mode |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile (Compact)** | 320px – 414px | Hidden Overlay Drawer | 1 Column | Hamburger + Title + Overflow Actions |
| **Tablet** | 768px – 1023px | Collapsible Drawer / Adaptive | 2 Columns | Compact Header + Full Quick Actions |
| **Desktop** | 1024px – 1439px| Persistent Left Sidebar | 4 Columns | Full Operational Header |
| **Ultrawide** | 1440px+ | Persistent Left Sidebar | 4 Columns / Dense | Full Operational Header |

---

## 3. Component Specifications

### 3.1 Collapsible Mobile Sidebar Drawer (`Sidebar.tsx`)
- **Desktop (`md:block`)**: Persistent left sidebar docked to the screen with a width of `w-60`.
- **Mobile (`< md`)**: Rendered inside an animated overlay drawer (`fixed inset-0 z-50 flex`).
  - **Backdrop**: Semi-transparent dark overlay (`bg-black/60 backdrop-blur-sm`). Tapping the backdrop automatically closes the drawer.
  - **Keyboard Navigation**: Pressing `Escape` dispatches the close event.
  - **Auto-Dismiss on Navigation**: Clicking any navigation link (`<NavLink>`) navigates to the target URL and immediately closes the drawer so the operator has immediate focus on the target content.

### 3.2 Responsive Header (`Header.tsx`)
- **Hamburger Button**: Displayed on `< md` (`md:hidden`) with an accessible `aria-label="Open menu"`.
- **Action Responsiveness**: On desktop, full quick action buttons are displayed ("Sync Coolify", "Add Server", "Quick Backup"). On mobile, actions collapse into a compact quick-action dropdown menu to eliminate horizontal overflow.
- **Session & Status Indicators**: Dynamic environment indicator and user avatar with logout trigger.

### 3.3 Main Content Shell (`AppLayout.tsx`)
- Configured with `min-w-0 max-w-full overflow-x-hidden flex-1 flex flex-col h-screen`.
- Eliminates horizontal window scrolling entirely across all tested viewports.
- Uses dynamic viewport height units (`h-screen` / `min-h-[100dvh]`) to account for mobile browser URL bars and navigation controls.

### 3.4 Responsive Metrics Grid
- Metrics cards adapt dynamically:
  ```html
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  ```
- No card is squished or clipped; numbers and badges maintain clear typographic hierarchy.

### 3.5 Responsive Tables & Visualizers
- Tables are wrapped in bounded horizontal scroll containers:
  ```html
  <div class="w-full overflow-x-auto rounded-lg border border-border">
    <table class="w-full min-w-[640px] text-sm">
  ```
- Typography stays readable, actions remain reachable, and cards gracefully stack.
- The Backup Chain Visualizer (`BackupChainVisualizer.tsx`) dynamically handles tree nodes and indentation, stacking backup details cleanly on mobile screens.

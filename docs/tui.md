# Terminal UI API Documentation

## Overview

BackupOps provides a comprehensive Terminal UI (TUI) system for users who prefer command-line interfaces or need to perform operations in environments without graphical displays. The TUI system provides full functionality equivalent to the web UI, including resource management, job monitoring, policy management, and workflow execution.

## TUI Architecture

### Core Principles

1. **Full Feature Parity**: TUI provides the same features as the web UI
2. **Keyboard-First**: Navigation and interaction primarily through keyboard shortcuts
3. **Rich Output**: Detailed status information, progress bars, and logs
4. **Session Management**: Persistent sessions with state restoration
5. **Multi-pane Layout**: Organized display of different information types

### Technical Architecture

```text
tui/
├── components/                    # UI components
│   ├── layout/                   # Window and pane management
│   ├── widgets/                  # Interactive widgets
│   ├── navigation/               # Navigation components
│   └── widgets/                  # Data display widgets
├── services/                      # Business logic services
│   ├── api/                      # API integration
│   ├── auth/                     # Authentication
│   ├── navigation/               # Navigation state
│   └── resources/                # Resource management
├── themes/                        # TUI styling
│   ├── default/                  # Default theme
│   ├── high-contrast/            # High contrast theme
│   └── custom/                   # User-defined themes
├── keybindings/                   # Keyboard shortcut configuration
├── plugins/                       # Extensible plugin system
└── state/                         # Application state management
```

## Key Features

### 1. Resource Management

#### View Resources
- List all resources with status indicators
- Filter by type, status, or organization
- Sort by various criteria (name, last used, status)

#### Add Resources
- Interactive resource type selection
- Step-by-step configuration
- Connection testing with real-time feedback

#### Edit Resources
- Modify resource properties
- Update authentication credentials
- Test connections without saving

#### Delete Resources
- Safe deletion with confirmation
- Dependency checking
- Force deletion with warnings

### 2. Job Management

#### Job List
- View all jobs with status badges
- Filter by resource, status, or time range
- Sort by creation time, progress, or duration

#### Job Details
- Comprehensive job information display
- Real-time progress updates
- Full log viewing with pagination
- Step-by-step execution details

#### Job Controls
- Start, pause, resume, cancel jobs
- Force kill if necessary
- Export logs and results

### 3. Policy Management

#### Policy List
- View all policies with next execution times
- Filter by type, status, or schedule
- Quick action buttons for enable/disable

#### Policy Editor
- Create new policies with guided setup
- Edit existing policies
- Policy validation with real-time feedback

#### Schedule Management
- View upcoming scheduled executions
- Edit schedule parameters
- Test schedule with dry runs

### 4. Workflow Management

#### Workflow Builder
- Visual workflow editor in terminal
- Node and edge management
- Validation and error highlighting

#### Workflow Execution
- Manual workflow execution
- Step-by-step progress display
- Real-time logs and output

### 5. System Management

#### Authentication
- Login and logout
- Session management
- Two-factor authentication support

#### Organization Management
- Switch between organizations
- Create new organizations
- Organization settings

## UI Components

### Layout Components

#### Main Layout
```text
+---------------------------------------------------------+
| Navigation Panel          | Content Area                |
| [Resources]              | [Job Details]               |
| [Jobs]                   | [Logs]                      |
| [Policies]               | [Settings]                  |
| [Workflows]              |                             |
| [Organizations]          |                             |
| [Help]                   |                             |
+---------------------------------------------------------+
| Status Bar                                               |
+---------------------------------------------------------+
```

#### Split Panes
- Vertical and horizontal splits
- Resizable panes
- Multiple views simultaneously
- Focus management

### Widget Components

#### Status Indicators
- Colored status badges (pending, running, completed, failed)
- Progress bars with percentage
- Animated loading indicators
- Health status indicators

#### Tables
- Data tables with sorting and filtering
- Column resizing and reordering
- Row selection and actions
- Pagination support

#### Forms
- Input validation with real-time feedback
- Dropdown selections
- Checkbox groups
- Radio button groups

#### Navigation
- Breadcrumb navigation
- Tab navigation
- Command palette
- Context-sensitive menus

## Keyboard Shortcuts

### Global Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+C` | Cancel current operation |
| `Ctrl+S` | Save changes |
| `Ctrl+R` | Refresh data |
| `Ctrl+F` | Search/filter |
| `Ctrl+G` | Go to specific item |
| `Ctrl+L` | Clear filters |
| `Ctrl+D` | Delete selected item |
| `Ctrl+E` | Edit selected item |
| `Ctrl+N` | Create new item |
| `F1` | Show help |
| `Esc` | Cancel dialog/close menu |

### Context-Specific Shortcuts

#### Resource List
- `Enter` - View resource details
- `a` - Add new resource
- `e` - Edit selected resource
- `d` - Delete selected resource
- `/` - Filter resources

#### Job List
- `Enter` - View job details
- `c` - Cancel selected job
- `r` - Refresh jobs
- `f` - Filter by status
- `s` - Start selected job

#### Policy Editor
- `Ctrl+S` - Save policy
- `Ctrl+R` - Validate policy
- `Ctrl+P` - Preview next execution

## API Integration

### TUI Service Layer

```typescript
import { TUIView, TUIComponent, TUIEvent } from './tui-base';

class BackupOpsTUI extends TUIView {
    private apiService: ApiService;
    private authService: AuthService;
    private resourceService: ResourceService;
    private jobService: JobService;
    
    constructor() {
        super({
            title: 'BackupOps',
            theme: 'default',
            layout: 'main',
        });
        
        this.initializeServices();
        this.setupComponents();
        this.setupEventHandlers();
    }
}
```

### Component Examples

#### Resource List Component

```typescript
class ResourceList extends TUIComponent {
    private resources: Resource[] = [];
    private filteredResources: Resource[] = [];
    private selectedResource?: Resource;
    
    constructor() {
        super({
            id: 'resource-list',
            title: 'Resources',
            width: 30,
            height: 20,
        });
    }
    
    async onMount() {
        await this.loadResources();
        this.setupEventHandlers();
    }
    
    private async loadResources() {
        try {
            const response = await this.apiService.getResources();
            this.resources = response.data;
            this.filterResources();
            this.render();
        } catch (error) {
            this.showError('Failed to load resources');
        }
    }
    
    private filterResources() {
        // Implementation for filtering logic
    }
    
    protected render() {
        this.clear();
        this.drawHeader();
        this.drawResourceList();
        this.drawFooter();
    }
    
    private drawResourceList() {
        let y = 2;
        for (const resource of this.filteredResources) {
            const isSelected = resource === this.selectedResource;
            const statusColor = this.getStatusColor(resource.status);
            
            // Draw resource row
            this.ctx.write(`${isSelected ? '▶' : ' '} ${resource.name}`, 1, y);
            this.ctx.write(resource.type, 35, y);
            this.ctx.write(resource.status, 50, y);
            
            if (isSelected) {
                this.ctx.write(resource.health, 60, y);
            }
            
            y++;
        }
    }
}
```

#### Progress Bar Widget

```typescript
class ProgressBar extends TUIComponent {
    value: number = 0;
    total: number = 100;
    label: string = '';
    showPercentage: boolean = true;
    
    constructor(options: Partial<ProgressBarOptions>) {
        super({
            id: 'progress-bar',
            title: '',
            width: 50,
            height: 3,
            ...options,
        });
    }
    
    protected render() {
        const percentage = (this.value / this.total) * 100;
        const filledWidth = Math.round((percentage / 100) * (this.width - 2));
        
        // Draw border
        this.ctx.write('+', 0, 0);
        this.ctx.write('-', this.width - 1, 0);
        this.ctx.write('+', this.width - 1, 0);
        
        // Draw progress
        this.ctx.fillRect(1, 1, filledWidth, 1, this.getProgressColor());
        
        // Draw percentage
        if (this.showPercentage) {
            const percentageText = `${Math.round(percentage)}%`;
            this.ctx.write(percentageText, Math.max(1, this.width - 8), 1);
        }
        
        // Draw label
        if (this.label) {
            this.ctx.write(this.label, 1, 3);
        }
    }
    
    private getProgressColor(): string {
        if (this.value === this.total) {
            return 'green';
        } else if (this.value > 0) {
            return 'yellow';
        } else {
            return 'gray';
        }
    }
}
```

## Theme System

### TUI Themes

```typescript
interface TUITheme {
    name: string;
    colors: {
        primary: string;
        secondary: string;
        background: string;
        surface: string;
        text: string;
        textSecondary: string;
        border: string;
        success: string;
        warning: string;
        error: string;
        info: string;
    };
    styles: {
        panel: string;
        border: string;
        header: string;
        footer: string;
        active: string;
        inactive: string;
    };
}
```

### Default Theme

```typescript
const defaultTheme: TUITheme = {
    name: 'default',
    colors: {
        primary: 'cyan',
        secondary: 'magenta',
        background: 'black',
        surface: 'gray',
        text: 'white',
        textSecondary: 'brightBlack',
        border: 'brightCyan',
        success: 'green',
        warning: 'yellow',
        error: 'red',
        info: 'blue',
    },
    styles: {
        panel: 'bg-black',
        border: 'brightCyan',
        header: 'bg-brightCyan fg-black bold',
        footer: 'bg-surface fg-text',
        active: 'bg-brightCyan fg-black',
        inactive: 'bg-surface fg-textSecondary',
    },
};
```

### High Contrast Theme

```typescript
const highContrastTheme: TUITheme = {
    name: 'high-contrast',
    colors: {
        primary: 'brightWhite',
        secondary: 'brightYellow',
        background: 'black',
        surface: 'brightBlack',
        text: 'brightWhite',
        textSecondary: 'gray',
        border: 'brightWhite',
        success: 'brightGreen',
        warning: 'brightYellow',
        error: 'brightRed',
        info: 'brightBlue',
    },
    styles: {
        panel: 'bg-black',
        border: 'brightWhite',
        header: 'bg-brightWhite fg-black bold',
        footer: 'bg-surface fg-brightWhite',
        active: 'bg-brightWhite fg-black',
        inactive: 'bg-surface fg-gray',
    },
};
```

## Navigation System

### Navigation Manager

```typescript
class NavigationManager {
    private currentView: string = 'resources';
    private viewStack: string[] = [];
    private eventBus: EventBus;
    
    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
        this.setupEventListeners();
    }
    
    navigate(view: string, params?: NavigationParams) {
        // Save current view to stack
        if (this.currentView !== 'help') {
            this.viewStack.push(this.currentView);
        }
        
        // Navigate to new view
        this.currentView = view;
        this.eventBus.emit('navigation:changed', { view, params });
    }
    
    back() {
        if (this.viewStack.length > 0) {
            const previousView = this.viewStack.pop();
            this.currentView = previousView;
            this.eventBus.emit('navigation:changed', { view: previousView });
        }
    }
    
    canNavigateBack(): boolean {
        return this.viewStack.length > 0;
    }
}
```

## Event System

### Event Bus

```typescript
class EventBus {
    private listeners: Map<string, Function[]> = new Map();
    
    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }
    
    off(event: string, callback: Function) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    emit(event: string, data?: any) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }
}
```

## Plugin System

### Plugin Architecture

```typescript
interface TUIPlugin {
    name: string;
    version: string;
    author: string;
    description: string;
    
    initialize(tui: BackupOpsTUI): void;
    destroy(): void;
    getComponents(): TUIComponent[];
    getKeybindings(): KeyBinding[];
}
```

### Plugin Example

```typescript
class AuditLogPlugin implements TUIPlugin {
    name = 'audit-logs';
    version = '1.0.0';
    author = 'BackupOps Team';
    description = 'Shows audit logs in TUI';
    
    initialize(tui: BackupOpsTUI) {
        this.auditLogComponent = new AuditLogComponent();
        tui.addComponent(this.auditLogComponent);
    }
    
    destroy() {
        // Cleanup
    }
    
    getComponents(): TUIComponent[] {
        return [this.auditLogComponent];
    }
    
    getKeybindings(): KeyBinding[] {
        return [
            { key: 'a', action: 'show-audit-logs', description: 'Show audit logs' },
        ];
    }
}
```

## State Management

### Application State

```typescript
interface AppState {
    auth: AuthState;
    resources: ResourceState;
    jobs: JobState;
    policies: PolicyState;
    workflows: WorkflowState;
    ui: UIState;
}

interface AuthState {
    isAuthenticated: boolean;
    user?: User;
    organization?: Organization;
    session?: Session;
}

interface ResourceState {
    resources: Resource[];
    selectedResource?: Resource;
    filters: ResourceFilters;
    loading: boolean;
    error?: string;
}

interface JobState {
    jobs: Job[];
    selectedJob?: Job;
    filters: JobFilters;
    loading: boolean;
    error?: string;
}
```

## Performance Optimization

### Rendering Optimization

1. **Virtual Scrolling**: Only render visible rows in large lists
2. **Debounced Updates**: Throttle frequent updates
3. **Component Memoization**: Prevent unnecessary re-renders
4. **Efficient Diffing**: Minimize screen updates

### Memory Management

1. **Component Pooling**: Reuse components instead of creating new ones
2. **Cleanup Listeners**: Remove event listeners when components unmount
3. **Garbage Collection**: Ensure proper cleanup of resources

## Testing

### Unit Testing

```typescript
import { describe, it, expect } from 'vitest';
import { ProgressBar } from '../widgets/progress-bar';

describe('ProgressBar', () => {
    it('renders correctly at 0%', () => {
        const progressBar = new ProgressBar({ value: 0, total: 100 });
        const output = progressBar.render();
        expect(output).toContain('0%');
    });
    
    it('renders correctly at 100%', () => {
        const progressBar = new ProgressBar({ value: 100, total: 100 });
        const output = progressBar.render();
        expect(output).toContain('100%');
    });
});
```

### Integration Testing

```typescript
import { describe, it, expect } from 'vitest';
import { BackupOpsTUI } from '../tui';

describe('BackupOpsTUI', () => {
    it('navigates between views', async () => {
        const tui = new BackupOpsTUI();
        await tui.mount();
        
        tui.navigate('resources');
        expect(tui.getCurrentView()).toBe('resources');
        
        tui.navigate('jobs');
        expect(tui.getCurrentView()).toBe('jobs');
        
        tui.back();
        expect(tui.getCurrentView()).toBe('resources');
    });
});
```

## Development

### Running TUI

```bash
# Install dependencies
npm install

# Build TUI
npm run build:tui

# Run TUI
npm start:tui

# Run tests
npm test:tui
```

### Creating New Components

1. **Extend TUIComponent**
2. **Implement render method**
3. **Set up event handlers**
4. **Add to parent view**
5. **Test thoroughly**

### Extending TUI

```typescript
class CustomTUI extends BackupOpsTUI {
    constructor() {
        super({
            title: 'Custom BackupOps',
            theme: 'custom',
            layout: 'custom-layout',
        });
    }
    
    private setupCustomLayout() {
        // Custom layout configuration
    }
    
    private setupCustomTheme() {
        // Custom theme configuration
    }
}
```

## Conclusion

The BackupOps TUI provides a powerful terminal-based interface for managing backup operations. With its comprehensive feature set, responsive design, and extensible architecture, the TUI serves as a perfect alternative to the web UI, especially for users who prefer command-line interfaces or need to operate in terminal-only environments. The TUI maintains full feature parity with the web UI while providing the performance and usability benefits of a native terminal application.
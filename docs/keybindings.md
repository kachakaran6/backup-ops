# Keyboard Shortcut Configuration

## Overview

BackupOps provides a comprehensive keyboard shortcut system to enable efficient navigation and operation execution in both the web UI and TUI interfaces. The system is designed for accessibility, productivity, and consistency across different platforms and input devices.

## Keyboard Architecture

### Core Principles

1. **Contextual Awareness**: Shortcuts change based on current view and mode
2. **Customizable**: Users can modify shortcuts through settings
3. **Accessible**: All functionality available via keyboard
4. **Consistent**: Same shortcuts across web and TUI interfaces
5. **Discoverable**: Hints and help available throughout UI

### Shortcut Categories

1. **Global Shortcuts**: Available in all contexts
2. **View-Specific Shortcuts**: Context-dependent actions
3. **Form Shortcuts**: Input field navigation and actions
4. **Action Shortcuts**: Common operations
5. **Navigation Shortcuts**: Movement between elements
6. **Help Shortcuts**: Access documentation and hints

## Global Shortcuts

| Key | Action | Description |
|-----|--------|-------------|
| `Ctrl+Shift+/` | Show Keyboard Help | Display all available shortcuts in current context |
| `Ctrl+Shift+,` | Open Settings | Access keyboard and accessibility settings |
| `Ctrl+Shift+M` | Toggle Accessibility Mode | Enable high-contrast and simplified interface |
| `Ctrl+Shift+U` | Toggle UI Mode | Switch between web and TUI interfaces |
| `Ctrl+Shift+S` | Quick Save | Save current changes if applicable |
| `Ctrl+Shift+C` | Copy Current Item | Copy selected resource, job, or policy |
| `Ctrl+Shift+V` | Paste | Paste from clipboard if applicable |
| `Ctrl+Shift+Z` | Redo Action | Redo last undone operation |
| `Ctrl+Shift+X` | Cut | Cut selected item |
| `F1` | Context Help | Show help for current context |
| `F2` | Edit | Enter edit mode for selected item |
| `F3` | Search | Focus search input |
| `F4` | Filters | Show filter options |
| `F5` | Refresh | Reload current data |
| `F6` | Next Tab | Navigate to next tab or pane |
| `F7` | Previous Tab | Navigate to previous tab or pane |
| `F8` | Help Center | Open comprehensive help documentation |
| `F9` | Quick Actions | Show quick action menu |
| `F10` | Exit | Exit current operation or application |

## View-Specific Shortcuts

### Resource List View

| Key | Action | Description |
|-----|--------|-------------|
| `Enter` | View Details | Open detailed view of selected resource |
| `Space` | Select Toggle | Toggle selection of resource |
| `a` | Add Resource | Open resource creation dialog |
| `e` | Edit Resource | Enter edit mode for selected resource |
| `d` | Delete Resource | Delete selected resource (with confirmation) |
| `t` | Test Connection | Test connectivity of selected resource |
| `s` | Sort Toggle | Toggle sorting of resources |
| `f` | Filter Toggle | Toggle filter panel |
| `/` | Quick Search | Focus search within resources |
| `\` | View Options | Show view customization options |

### Job List View

| Key | Action | Description |
|-----|--------|-------------|
| `Enter` | View Details | Open detailed job view |
| `Space` | Select Toggle | Toggle selection of job |
| `c` | Cancel Job | Cancel selected job (with confirmation) |
| `r` | Refresh Jobs | Refresh job list and status |
| `f` | Filter Toggle | Toggle job status filters |
| `/` | Quick Search | Focus search within jobs |
| `p` | Pause Job | Pause selected running job |
| `r` | Resume Job | Resume paused job |
| `x` | Execute Job | Run selected job again |

### Policy Editor View

| Key | Action | Description |
|-----|--------|-------------|
| `Ctrl+S` | Save Policy | Save current policy changes |
| `Ctrl+R` | Validate Policy | Validate policy syntax and requirements |
| `Ctrl+P` | Preview Schedule | Show next execution preview |
| `Ctrl+U` | Duplicate Policy | Create copy of current policy |
| `Ctrl+W` | Close Editor | Close policy editor without saving |
| `F9` | Policy Templates | Show available policy templates |
| `F10` | Policy Wizard | Open guided policy creation |

### Workflow Builder View

| Key | Action | Description |
|-----|--------|-------------|
| `Enter` | Select Node | Select clicked node or connection |
| `Delete` | Delete Selected | Delete selected node or edge |
| `Ctrl+A` | Select All | Select all nodes and edges |
| `Ctrl+D` | Duplicate Selected | Create copy of selected elements |
| `Arrow Keys` | Move Selection | Move selected elements with arrow keys |
| `+` | Add Node | Add new node of selected type |
| `-` | Remove Connection | Remove selected connection |
| `Ctrl+Z` | Undo Action | Undo last action |
| `Ctrl+Y` | Redo Action | Redo last undone action |

## Form Input Shortcuts

### Text Inputs

| Key | Action | Description |
|-----|--------|-------------|
| `Tab` | Next Field | Move to next input field |
| `Shift+Tab` | Previous Field | Move to previous input field |
| `Enter` | Submit Form | Submit current form |
| `Escape` | Cancel Form | Cancel form input or close modal |

### Dropdown Selections

| Key | Action | Description |
|-----|--------|-------------|
| `Down Arrow` | Next Option | Navigate to next option |
| `Up Arrow` | Previous Option | Navigate to previous option |
| `Enter` | Select Option | Select highlighted option |
| `Escape` | Close Dropdown | Close dropdown without selection |

### Checkbox Groups

| Key | Action | Description |
|-----|--------|-------------|
| `Space` | Toggle Checkbox | Toggle selected checkbox |
| `Enter` | Confirm All | Check all checkboxes |
| `Shift+A` | Invert Selection | Invert all checkbox selections |

## Action Shortcuts

### Resource Actions

| Key | Action | Description |
|-----|--------|-------------|
| `Ctrl+N` | New Resource | Create new resource |
| `Ctrl+F` | Find Resource | Search for specific resource |
| `Ctrl+G` | Go to Resource | Jump to specific resource by ID |
| `Ctrl+L` | Clear Filters | Clear all active filters |
| `Ctrl+H` | Help Resources | Show resource-specific help |

### Job Actions

| Key | Action | Description |
|-----|--------|-------------|
| `Ctrl+J` | New Job | Create new job |
| `Ctrl+E` | Execute Job | Start selected job |
| `Ctrl+P` | Pause Job | Pause running job |
| `Ctrl+R` | Retry Job | Retry failed job |
| `Ctrl+K` | Kill Job | Force terminate job |
| `Ctrl+D` | Delete Job | Remove job from history |

### Policy Actions

| Key | Action | Description |
|-----|--------|-------------|
| `Ctrl+B` | Backup Policy | Create backup policy |
| `Ctrl+C` | Copy Policy | Duplicate existing policy |
| `Ctrl+M` | Move Policy | Move policy to different folder |
| `Ctrl+W` | Write Policy | Save current policy |
| `Ctrl+Q` | Quit Editor | Exit policy editor |

## Navigation Shortcuts

### Pane Navigation

| Key | Action | Description |
|-----|--------|-------------|
| `Ctrl+PageUp` | Previous Pane | Navigate to previous pane |
| `Ctrl+PageDown` | Next Pane | Navigate to next pane |
| `Home` | Top of Page | Navigate to top of current view |
| `End` | Bottom of Page | Navigate to bottom of current view |
| `Ctrl+Home` | Start of List | Navigate to first item in list |
| `Ctrl+End` | End of List | Navigate to last item in list |

### Sidebar Navigation

| Key | Action | Description |
|-----|--------|-------------|
| `Alt+1` | Resources | Navigate to Resources tab |
| `Alt+2` | Jobs | Navigate to Jobs tab |
| `Alt+3` | Policies | Navigate to Policies tab |
| `Alt+4` | Workflows | Navigate to Workflows tab |
| `Alt+5` | Storage | Navigate to Storage tab |
| `Alt+6` | Schedules | Navigate to Schedules tab |
| `Alt+7` | Notifications | Navigate to Notifications tab |
| `Alt+8` | Audit Log | Navigate to Audit Log tab |
| `Alt+9` | Settings | Navigate to Settings tab |

## Help Shortcuts

### Context Help

| Key | Action | Description |
|-----|--------|-------------|
| `F1` | Context Help | Show help for current context |
| `Ctrl+Shift+F1` | Global Help | Show all keyboard shortcuts |
| `Shift+F1` | Tooltips | Show tooltips for UI elements |
| `Ctrl+F1` | Shortcuts Search | Search for specific shortcut |

### Documentation Access

| Key | Action | Description |
|-----|--------|-------------|
| `F8` | Help Center | Open comprehensive help documentation |
| `Ctrl+F8` | Quick Start | Show quick start guide |
| `Shift+F8` | Tutorials | Open tutorial videos |
| `Ctrl+Shift+F8` | API Reference | Show API documentation |

## Custom Shortcut Configuration

### Settings Interface

```html
<div class="shortcut-settings">
  <h3>Keyboard Shortcuts</h3>
  
  <div class="shortcut-category">
    <h4>Global Shortcuts</h4>
    <div class="shortcut-row">
      <span class="key">Ctrl+Shift+/</span>
      <span class="action">Show Keyboard Help</span>
      <button class="edit-btn">Edit</button>
    </div>
    <!-- More shortcuts... -->
  </div>
  
  <div class="shortcut-category">
    <h4>View-Specific Shortcuts</h4>
    <div class="shortcut-row">
      <select class="view-selector">
        <option value="resources">Resource List</option>
        <option value="jobs">Job List</option>
        <option value="policies">Policy Editor</option>
        <!-- More views... -->
      </select>
    </div>
    <!-- Dynamic shortcuts based on selection... -->
  </div>
</div>
```

### Configuration Schema

```json
{
  "shortcuts": {
    "global": {
      "Ctrl+Shift+/": "show-keyboard-help",
      "Ctrl+Shift+,": "open-settings",
      "Ctrl+Shift+M": "toggle-accessibility-mode"
    },
    "views": {
      "resources": {
        "Enter": "view-details",
        "a": "add-resource",
        "e": "edit-resource",
        "d": "delete-resource"
      },
      "jobs": {
        "Enter": "view-details",
        "c": "cancel-job",
        "r": "refresh-jobs",
        "p": "pause-job",
        "\": "resume-job"
      }
    },
    "forms": {
      "text-input": {
        "Tab": "next-field",
        "Enter": "submit-form",
        "Escape": "cancel-form"
      }
    }
  }
}
```

### Customization API

#### Get Current Shortcut

```typescript
import { KeyboardService } from '@backup-ops/sdk';

const keyboardService = KeyboardService.getInstance();

const shortcut = keyboardService.getShortcut('resources', 'Enter');
console.log(shortcut); // { key: 'Enter', action: 'view-details', description: 'Open detailed view of selected resource' }
```

#### Set Custom Shortcut

```typescript
keyboardService.setShortcut('resources', 'Enter', 'custom-action', 'Custom description');
```

#### Get All Shortcuts for View

```typescript
const shortcuts = keyboardService.getShortcutsForView('resources');
console.log(shortcuts);
```

#### Reset Shortcuts

```typescript
keyboardService.resetShortcuts('resources');
keyboardService.resetAllShortcuts();
```

## Accessibility Features

### High Contrast Mode

In high contrast mode, all keyboard shortcuts remain the same, but:

- **Visual Feedback**: Enhanced contrast for shortcut key highlights
- **Screen Reader Support**: All shortcuts announced with clear labels
- **Focus Indicators**: More prominent focus indicators for keyboard navigation

### Screen Reader Integration

```typescript
// Screen reader announces shortcuts
const announceShortcut = (shortcut: Shortcut) => {
  const announcement = `${shortcut.description}. Press ${formatShortcutKeys(shortcut.keys)}`;
  screenReader.speak(announcement);
};
```

### Accessibility Validation

#### Keyboard Navigation

- **Tab Order**: Follows logical HTML structure
- **Focus Management**: Proper focus restoration after modals
- **Skip Links**: Direct access to main content
- **ARIA Labels**: Descriptive labels for all interactive elements

#### Color and Contrast

- **Minimum Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Color Blind Support**: Alternative color schemes
- **Reduced Motion**: Respect user preference for reduced motion

## TUI Keyboard Support

### TUI-Specific Shortcuts

| Key | Action | Description |
|-----|--------|-------------|
| `Ctrl+A` | Home | Move to top of current pane |
| `Ctrl+E` | End | Move to bottom of current pane |
| `Ctrl+F` | Page Down | Page down in current pane |
| `Ctrl+B` | Page Up | Page up in current pane |
| `Ctrl+G` | Go To Line | Jump to specific line number |
| `Ctrl+L` | Clear Screen | Clear current screen |
| `Ctrl+M` | Select All | Select all items in current view |
| `Ctrl+N` | Next Pane | Navigate to next pane |
| `Ctrl+O` | Previous Pane | Navigate to previous pane |
| `Ctrl+P` | Print | Print current view |
| `Ctrl+Q` | Quit | Exit TUI |

### TUI Navigation

| Key | Action | Description |
|-----|--------|-------------|
| `Up Arrow` | Move Up | Move cursor up in list |
| `Down Arrow` | Move Down | Move cursor down in list |
| `Ctrl+Up Arrow` | Page Up | Page up in list |
| `Ctrl+Down Arrow` | Page Down | Page down in list |
| `Home` | First Item | Go to first item |
| `End` | Last Item | Go to last item |
| `Tab` | Next Field | Move to next input field |
| `Shift+Tab` | Previous Field | Move to previous input field |

## Shortcut Validation

### Syntax Validation

```typescript
interface ShortcutValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateShortcut(shortcut: KeyboardShortcut): ShortcutValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for conflicting shortcuts
  if (isConflictingWithExisting(shortcut)) {
    errors.push(`Shortcut ${formatShortcut(shortcut.keys)} is already in use`);
  }
  
  // Check for reserved keys
  if (isReservedKey(shortcut.keys)) {
    warnings.push(`Key ${formatShortcut(shortcut.keys)} is reserved for system use`);
  }
  
  return { valid: errors.length === 0, errors, warnings };
}
```

### Accessibility Validation

```typescript
function validateAccessibility(shortcut: KeyboardShortcut): boolean {
  // Check if shortcut can be discovered without visual cues
  const hasAlternativeInput = shortcut.keys.some(key => 
    key.startsWith('Ctrl') || key.startsWith('Alt') || key.startsWith('Shift')
  );
  
  if (!hasAlternativeInput) {
    return false; // Pure key shortcuts are not accessible
  }
  
  return true;
}
```

## Performance Considerations

### Shortcut Processing

- **Debounce**: Prevent accidental multiple executions
- **Throttling**: Limit shortcut processing frequency
- **Caching**: Cache frequently used shortcuts
- **Lazy Loading**: Load view-specific shortcuts on demand

### Memory Usage

```typescript
// Efficient shortcut storage
const shortcutStore = {
  global: new Map<string, Shortcut>(),
  view: new Map<string, Map<string, Shortcut>>(),
  
  getShortcut(view: string, keyCombination: string): Shortcut | undefined {
    return this.view.get(view)?.get(keyCombination);
  },
  
  // Automatically clean up unused shortcuts
  cleanup() {
    // Implementation for memory management
  }
};
```

## Testing Keyboard Features

### Unit Testing

```typescript
import { describe, it, expect } from '@jest/globals';
import { KeyboardService } from '../services/keyboard-service';

describe('KeyboardService', () => {
  let keyboardService: KeyboardService;
  
  beforeEach(() => {
    keyboardService = new KeyboardService();
  });
  
  it('should execute global shortcuts', async () => {
    const handler = jest.fn();
    keyboardService.registerShortcut('global', 'Ctrl+S', handler);
    
    await keyboardService.handleKeyPress('Ctrl+S');
    
    expect(handler).toHaveBeenCalled();
  });
  
  it('should execute view-specific shortcuts', async () => {
    const handler = jest.fn();
    keyboardService.registerShortcut('resources', 'Enter', handler);
    
    await keyboardService.handleKeyPress('Enter', 'resources');
    
    expect(handler).toHaveBeenCalled();
  });
});
```

### Integration Testing

```typescript
import { KeyboardAccessibilityTest } from '../accessibility/keyboard-accessibility';

describe('Keyboard Accessibility', () => {
  it('should have all shortcuts accessible via keyboard', () => {
    const accessibilityTest = new KeyboardAccessibilityTest();
    const results = accessibilityTest.runAccessibilityTests();
    
    expect(results.allAccessible).toBe(true);
    expect(results.violations).toHaveLength(0);
  });
});
```

## Development Guidelines

### Adding New Shortcuts

1. **Identify Use Case**: Clearly define the shortcut's purpose
2. **Check Conflicts**: Ensure no conflicts with existing shortcuts
3. **Test Accessibility**: Verify the shortcut is accessible
4. **Document**: Add documentation to shortcut guide
5. **Update Tests**: Add tests for the new shortcut
6. **Performance Test**: Ensure shortcut processing is efficient

### Best Practices

- **Logical Grouping**: Group related shortcuts together
- **Consistent Naming**: Use consistent action names
- **Clear Descriptions**: Provide clear, actionable descriptions
- **Context Awareness**: Shortcuts should adapt to current context
- **Performance Optimized**: Minimize processing overhead

## Future Enhancements

### Advanced Features

1. **Custom Shortcut Editor**: Full shortcut customization interface
2. **Shortcut Macros**: Support for shortcut combinations
3. **Contextual Smart Suggestions**: AI-powered shortcut recommendations
4. **Multi-Device Sync**: Synchronize shortcuts across devices
5. **Shortcut Analytics**: Track shortcut usage patterns

### Accessibility Improvements

1. **Voice Control Integration**: Support for voice-controlled shortcuts
2. **Eye Tracking Support**: Integration with eye-tracking systems
3. **Adaptive Interfaces**: Shortcuts adapt to user abilities
4. **Enhanced Screen Reader Support**: More detailed shortcut announcements

## Conclusion

The keyboard shortcut system in BackupOps provides a powerful, accessible way to efficiently navigate and operate the system. By combining comprehensive shortcut coverage, customizable configuration, and robust accessibility features, the system ensures that all users can effectively interact with BackupOps regardless of their input preferences or abilities. The system is designed for performance, maintainability, and continuous improvement.
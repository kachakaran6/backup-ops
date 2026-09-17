# UI/UX Prompt Templates

## Overview

BackupOps uses a comprehensive system of prompt templates to provide users with consistent, helpful guidance throughout their operations. These templates are designed to improve user experience by:

- Providing clear instructions for complex operations
- Guiding users through multi-step workflows
- Offering contextual help based on current state
- Ensuring consistent messaging across the application
- Supporting accessibility through clear, structured language

## Template Architecture

### Core Principles

1. **Context-Aware**: Templates adapt based on user role, current operation, and system state
2. **Action-Oriented**: Focus on what users can do rather than system mechanics
3. **Progressive Disclosure**: Start simple, reveal complexity as needed
4. **Accessibility-Compliant**: Use clear, concise language and proper structure
5. **Multilingual-Ready**: Templates designed for translation

### Template Structure

```text
<project_name> <template_type> <context>

<primary_message>

<supporting_details>

<action_requirements>

<alternative_options>

<risk_assessment>

<confirmation_required>
```

### Template Categories

1. **Operation Templates**: For data operations (backup, restore, copy, etc.)
2. **Resource Templates**: For resource management (add, edit, test, etc.)
3. **Policy Templates**: For policy creation and management
4. **Workflow Templates**: For workflow composition
5. **Help Templates**: For guidance and support
6. **Error Templates**: For error messaging and recovery

## Operation Templates

### Backup Operation Template

**Primary Message**: Create a retained snapshot of your data without removing the source.

**Supporting Details**:
- Choose your backup type: Full (complete data copy) or Incremental (only changed data since last backup)
- Select source: Database, server, or storage resource
- Choose destination: Where backups will be stored
- Set retention: How long to keep backup versions

**Action Requirements**:
- Select source resource
- Configure backup policy
- Choose backup schedule
- Set retention period

**Alternative Options**:
- [Encryption] Add encryption to backup
- [Compression] Compress backup to save space
- [Verification] Enable automatic backup verification
- [Cross-region] Store backup in different region

**Risk Assessment**:
- **Low**: Standard backup operation
- **Medium**: Incremental backup with encryption
- **High**: First-time large backup, cross-region transfer

**Confirmation Required**: ✅ Yes, create backup

**Template**: "backup-operation"

### Restore Operation Template

**Primary Message**: Recover data from backup to a target location.

**Supporting Details**:
- Select backup version: Choose from available backup history
- Select target: Where restored data will go
- Choose restore method: Point-in-time recovery or latest version
- Select databases/tables: Granular restore options where supported

**Action Requirements**:
- Select backup to restore
- Choose target location
- Configure restore options
- Verify restore completion

**Alternative Options**:
- [Dry-run] Test restore without affecting production
- [Validate] Verify restored data integrity
- [Test-restore] Create temporary test environment
- [Selective] Restore specific tables/databases

**Risk Assessment**:
- **Low**: Restore from recent backup to test environment
- **Medium**: Production restore with validation
- **High**: Point-in-time recovery, selective table restore

**Confirmation Required**: ✅ Yes, proceed with restore

**Template**: "restore-operation"

### Copy Operation Template

**Primary Message**: Transfer data from source to destination.

**Supporting Details**:
- Source: Where data comes from
- Destination: Where data goes
- Transfer mode: One-time, scheduled, or continuous
- Data filtering: Select specific files or entire systems

**Action Requirements**:
- Configure source connection
- Configure destination connection
- Set transfer options
- Schedule or start immediately

**Alternative Options**:
- [Resume] Continue interrupted transfer
- [Incremental] Copy only changed files
- [Checksum] Verify data integrity during transfer
- [Bandwidth] Limit transfer speed

**Risk Assessment**:
- **Low**: Small file copy between local systems
- **Medium**: Large backup copy with resume support
- **High**: Database copy, production system transfer

**Confirmation Required**: ✅ Yes, start copy

**Template**: "copy-operation"

### Sync Operation Template

**Primary Message**: Keep source and destination in sync.

**Supporting Details**:
- Source and destination locations
- Sync direction: One-way or two-way
- Conflict resolution: Which version wins
- Schedule: Real-time or scheduled

**Action Requirements**:
- Configure both source and destination
- Set sync direction
- Define conflict resolution policy
- Schedule sync frequency

**Alternative Options**:
- [Mirror] Make destination exact copy of source
- [Delta] Sync only changes
- [Bandwidth] Optimize for network conditions
- [Pause] Temporarily pause sync

**Risk Assessment**:
- **Low**: Local directory sync
- **Medium**: Database sync with conflict resolution
- **High**: Cross-region replication

**Confirmation Required**: ✅ Yes, configure sync

**Template**: "sync-operation"

## Resource Templates

### Add Resource Template

**Primary Message**: Connect BackupOps to a new infrastructure resource.

**Supporting Details**:
- **Type**: Choose resource type (Server, Database, Storage, Docker)
- **Connection**: How to connect to the resource
- **Authentication**: Credentials needed
- **Capabilities**: What operations can be performed

**Action Requirements**:
1. Select resource type
2. Provide connection details
3. Configure authentication
4. Test connection
5. Save configuration

**Alternative Options**:
- [SSH Key] Use SSH key authentication
- [Certificate] Use certificate-based authentication
- [Cloud Provider] Connect to cloud resource
- [Agent] Install agent for privileged operations

**Risk Assessment**:
- **Low**: Read-only connection to test environment
- **Medium**: Production database connection
- **High**: Remote server with admin privileges

**Confirmation Required**: ✅ Yes, add resource

**Template**: "add-resource"

### Test Connection Template

**Primary Message**: Verify that BackupOps can connect to your resource.

**Supporting Details**:
- This will attempt to establish a connection using configured credentials
- Tests basic connectivity and permissions
- Does not modify any data or configurations

**Action Requirements**:
- Provide valid credentials
- Confirm connection parameters
- Review connection test results

**Alternative Options**:
- [Credentials] Change authentication method
- [Network] Test network connectivity
- [Firewall] Check firewall rules
- [DNS] Verify hostname resolution

**Risk Assessment**: **Low** - Read-only test

**Confirmation Required**: ✅ Yes, test connection

**Template**: "test-connection"

### Edit Resource Template

**Primary Message**: Update your resource configuration.

**Supporting Details**:
- Connection details
- Authentication credentials
- Network settings
- Operational parameters

**Action Requirements**:
1. Select what to update
2. Provide new values
3. Test new configuration
4. Save changes

**Alternative Options**:
- [Revert] Restore original configuration
- [Test] Test changes before applying
- [Schedule] Apply changes at specific time
- [Validate] Validate configuration syntax

**Risk Assessment**:
- **Low**: Update non-critical settings
- **Medium**: Change authentication
- **High**: Modify connection endpoints

**Confirmation Required**: ✅ Yes, save resource changes

**Template**: "edit-resource"

## Policy Templates

### Create Policy Template

**Primary Message**: Define how and when BackupOps should protect your data.

**Supporting Details**:
- **Objective**: What you're backing up (data source)
- **Method**: How it should be done (backup type, compression)
- **Protection**: How long to protect it (retention, verification)
- **Timing**: When to execute (schedule, triggers)

**Action Requirements**:
1. Define objectives:
   - Select resources to protect
   - Choose backup frequency
   - Set retention period
2. Configure protection:
   - Choose encryption method
   - Select compression level
   - Configure verification
3. Set timing:
   - Choose schedule
   - Define triggers

**Alternative Options**:
- [Alerts] Send notifications on policy events
- [Logging] Enable detailed audit logging
- [Monitoring] Set up performance monitoring
- [Reporting] Generate compliance reports

**Risk Assessment**:
- **Low**: Simple daily backup of test database
- **Medium**: Production backup with encryption
- **High**: Multi-region disaster recovery policy

**Confirmation Required**: ✅ Yes, create backup policy

**Template**: "create-policy"

### Edit Policy Template

**Primary Message**: Modify existing backup policy.

**Supporting Details**:
- **Important**: Changes may affect existing backup schedules
- **Caution**: Consider impact on retention periods
- **Note**: Some changes require re-approval

**Action Requirements**:
1. Review current policy
2. Select changes to make
3. Validate new settings
4. Apply changes

**Alternative Options**:
- [Version] Create new policy version
- [Schedule] Modify execution schedule
- [Retention] Update retention rules
- [Protection] Add new security controls

**Risk Assessment**:
- **Low**: Update non-production policy
- **Medium**: Modify production backup schedule
- **High**: Change retention to shorter period

**Confirmation Required**: ✅ Yes, update policy

**Template**: "edit-policy"

## Workflow Templates

### Create Workflow Template

**Primary Message**: Compose multiple operations into a coordinated sequence.

**Supporting Details**:
- **Workflow Builder**: Visual editor for creating workflows
- **Step Composition**: Drag and drop operations
- **Validation**: Automatic validation of workflow logic
- **Testing**: Test workflow before production use

**Action Requirements**:
1. **Define Workflow Name**: Give your workflow a descriptive name
2. **Add Steps**: 
   - Drag operations from palette
   - Configure each step
   - Set dependencies between steps
3. **Configure Triggers**: Set when workflow should run
4. **Test Workflow**: Execute in safe environment
5. **Deploy**: Activate in production

**Alternative Options**:
- [Schedule] Configure automated execution
- [Manual] Require manual trigger
- [Retry] Set up automatic retry on failure
- [Monitor] Add monitoring and alerting

**Risk Assessment**:
- **Low**: Simple backup workflow
- **Medium**: Multi-step recovery workflow
- **High**: Complex disaster recovery workflow

**Confirmation Required**: ✅ Yes, create workflow

**Template**: "create-workflow"

## Help Templates

### Getting Started Template

**Primary Message**: Welcome to BackupOps! Let's get you started with the basics.

**Supporting Details**:
- **Quick Start**: 5-minute setup guide
- **Core Concepts**: Understanding resources, operations, and policies
- **First Operation**: Create your first backup

**Action Requirements**:
1. **Set Up Your First Resource**: Connect to your infrastructure
2. **Create Your First Backup**: Execute basic backup operation
3. **Configure Retention**: Set up backup retention
4. **Test Restore**: Verify your backups work

**Alternative Options**:
- [Video Tutorials]: Watch step-by-step video guides
- [Documentation]: Read comprehensive documentation
- [Support]: Get help from our support team
- [Community]: Join user community for tips

**Risk Assessment**: **Low** - Guided setup process

**Template**: "getting-started"

### Help Context Templates

**Operation Help**: "Need help with this operation? Learn about [operation type] or view examples."

**Resource Help**: "Learn more about [resource type] capabilities or view connection guides."

**Policy Help**: "Understand backup policies or view policy templates."

**Error Help**: "What does this error mean? Get help with [error type] or view troubleshooting guide."

## Error Templates

### Destructive Operation Warning Template

**Primary Message**: This action cannot be undone!

**Supporting Details**:
- **What will happen**: Clear explanation of the action
- **What you need**: List of requirements before proceeding
- **What comes next**: What will happen after completion

**Action Requirements**:
1. Review impact assessment
2. Complete all prerequisites
3. Confirm understanding of consequences
4. Provide final confirmation

**Alternative Options**:
- [Dry-run]: Test action without making changes
- [Preview]: See what will be affected
- [Cancel]: Abandon the operation
- [Defer]: Schedule for later

**Risk Assessment**: **High** - Data loss possible

**Confirmation Required**: ✅ Yes, proceed with destructive action

**Template**: "destructive-operation-warning"

### Permission Error Template

**Primary Message**: You don't have permission to perform this action.

**Supporting Details**:
- **Required Permission**: What permission is needed
- **Current Role**: Your current role and its limitations
- **Request Process**: How to get additional permissions

**Action Requirements**:
1. Request permission from administrator
2. Wait for approval
3. Retry operation

**Alternative Options**:
- [Contact Admin]: Request assistance
- [Alternative Action]: Use available permissions
- [Workaround]: Use different approach

**Risk Assessment**: **Medium** - Access control violation

**Confirmation Required**: N/A - requires admin approval

**Template**: "permission-error"

### Connection Error Template

**Primary Message**: Cannot connect to resource.

**Supporting Details**:
- **Error**: What went wrong (clear, technical but user-friendly)
- **Possible Causes**: Common reasons for the error
- **Solutions**: Step-by-step troubleshooting guide

**Action Requirements**:
1. Check connection details
2. Verify credentials
3. Test network connectivity
4. Retry after fixes

**Alternative Options**:
- [Test Connection]: Run diagnostic tests
- [Change Connection]: Use different method
- [Contact Support]: Get technical assistance

**Risk Assessment**: **Medium** - Service interruption

**Confirmation Required**: N/A - resolve connectivity issue

**Template**: "connection-error"

### Timeout Error Template

**Primary Message**: Operation timed out.

**Supporting Details**:
- **Time Elapsed**: How long it ran before timeout
- **Possible Causes**: Why it might have taken too long
- **Resolutions**: How to prevent future timeouts

**Action Requirements**:
1. Check system resources
2. Reduce operation scope
3. Increase timeout settings
4. Try again with optimizations

**Alternative Options**:
- [Resume]: Continue from where it left off
- [Retry]: Try again with adjustments
- [Cancel]: Stop the operation

**Risk Assessment**: **Medium** - Performance issue

**Confirmation Required**: N/A - requires retry

**Template**: "timeout-error"

## Template Management

### Template Library

Templates are organized in a library:

```text
templates/
├── operation/
│   ├── backup.md
│   ├── restore.md
│   ├── copy.md
│   ├── move.md
│   └── sync.md
├── resource/
│   ├── add-server.md
│   ├── add-database.md
│   ├── add-storage.md
│   └── add-docker.md
├── policy/
│   ├── create-backup-policy.md
│   ├── create-sync-policy.md
│   └── create-verification-policy.md
├── workflow/
│   ├── backup-recovery.md
│   ├── disaster-recovery.md
│   └── maintenance.md
├── help/
│   ├── getting-started.md
│   ├── basic-concepts.md
│   └── tutorials.md
└── error/
    ├── destructive-operation.md
    ├── permission-denied.md
    ├── connection-failed.md
    └── timeout.md
```

### Template Customization

Users can customize templates:

- **Personal Templates**: Create personalized versions
- **Organization Templates**: Define company-standard templates
- **Role-Based Templates**: Different templates for different roles
- **Language Templates**: Localized versions

### Template Testing

Templates are tested for:

- **Clarity**: Easy to understand
- **Completeness**: Cover all aspects
- **Consistency**: Follow naming conventions
- **Accessibility**: Meet WCAG standards
- **Internationalization**: Ready for translation

## Template Development Guidelines

### Writing Guidelines

1. **User Research**: Understand user needs and skill levels
2. **Copy Testing**: Test messages with real users
3. **Accessibility**: Follow WCAG 2.1 AA standards
4. **Localization**: Write in a way that's easily translatable
5. **Consistency**: Follow established tone and style

### Implementation Guidelines

1. **Template Structure**: Use consistent XML/HTML-like structure
2. **Variables**: Use {{variable}} syntax for dynamic content
3. **Conditional Sections**: Use <% if condition %> for conditional content
4. **Iterations**: Use <% each item in collection %> for lists
5. **Includes**: Use <% include "partial" %> for reusable sections

### Template Example

```xml
<template name="backup-operation">
  <primary_message>Creating a retained snapshot of your data without removing the source.</primary_message>
  
  <supporting_details>
    <p>Choose your backup type:</p>
    <ul>
      <li><strong>Full:</strong> Complete data copy</li>
      <li><strong>Incremental:</strong> Only changed data since last backup</li>
    </ul>
  </supporting_details>
  
  <action_requirements>
    <step>1>Select source: <%= sources.join(', ') %></step>
    <step>2>Choose destination: <%= destinations.join(', ') %></step>
    <step>3>Set retention: <%= retention_options.join(', ') %></step>
  </action_requirements>
  
  <alternative_options>
    <% if (user.role === 'admin') { %>
      <option value="encryption">Add encryption</option>
      <option value="compression">Enable compression</option>
    <% } %>
  </alternative_options>
  
  <risk_assessment>
    <level value="medium" reason="Involves data transfer and storage"/>
  </risk_assessment>
  
  <confirmation_required>Yes, create backup</confirmation_required>
</template>
```

## Template Metrics

Track template effectiveness:

- **Readability Score**: How easy templates are to understand
- **Task Completion Rate**: How often users complete operations after following template guidance
- **Help Desk Reduction**: How much template usage reduces support tickets
- **User Satisfaction**: Template usability scores
- **Localization Readiness**: Ease of translating templates

## Future Template Enhancements

1. **AI-Generated Templates**: Automatically generate templates based on user actions
2. **Dynamic Templates**: Templates that adapt based on system state
3. **Contextual Suggestions**: Real-time template suggestions
4. **Template Analytics**: Track which templates are most effective
5. **Template Marketplace**: Share templates across organizations

## Conclusion

Prompt templates are essential for providing a professional, user-friendly experience in BackupOps. By providing clear, context-aware guidance, templates help users successfully complete operations while maintaining system security and data integrity. The template system ensures consistency across the platform while allowing for customization and localization as needed.
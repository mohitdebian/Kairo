```markdown
# Kairo Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the Kairo TypeScript codebase. You'll learn about file naming, import/export styles, commit practices, and how to write and organize tests. This guide will help you contribute code that matches the established style and structure of the project.

## Coding Conventions

### File Naming
- Use **PascalCase** for all file names.
  - Example: `MyComponent.ts`, `UserService.ts`

### Imports
- Use **relative imports** for referencing other modules.
  - Example:
    ```typescript
    import { UserService } from './UserService';
    ```

### Exports
- Use **named exports** rather than default exports.
  - Example:
    ```typescript
    // UserService.ts
    export function getUser(id: string) { ... }
    ```

### Commit Messages
- Commit messages are generally freeform, with occasional use of the `chore` prefix.
- Keep commit messages concise (average ~23 characters).
  - Example:
    ```
    chore: update dependencies
    Fix login bug
    ```

## Workflows

### Adding a New Module
**Trigger:** When you need to add a new feature or service.
**Command:** `/add-module`

1. Create a new file using PascalCase, e.g., `NewFeature.ts`.
2. Use named exports for all functions, classes, or constants.
3. Use relative imports to include dependencies.
4. Write corresponding tests in a file named `NewFeature.test.ts`.

### Refactoring Code
**Trigger:** When you need to improve or restructure existing code.
**Command:** `/refactor`

1. Identify the target file(s) and ensure file names follow PascalCase.
2. Update imports/exports to use relative paths and named exports if needed.
3. Update or add tests as necessary.
4. Use a clear, concise commit message (optionally prefixed with `chore:`).

### Writing Tests
**Trigger:** When you add or modify functionality.
**Command:** `/write-test`

1. Create a test file named `<ModuleName>.test.ts` in the same directory as the module.
2. Write tests using the project's preferred (unknown) testing framework.
3. Use named imports for functions/classes under test.
   - Example:
     ```typescript
     import { getUser } from './UserService';

     test('gets user by id', () => {
       // test implementation
     });
     ```

## Testing Patterns

- Test files follow the pattern `*.test.ts`.
- Place test files alongside the module they test.
- Use named imports for the subject under test.
- The specific testing framework is not specified, but standard TypeScript testing practices apply.

## Commands
| Command        | Purpose                                      |
|----------------|----------------------------------------------|
| /add-module    | Scaffold a new module with proper conventions|
| /refactor      | Refactor code to match project standards     |
| /write-test    | Create or update a test file                 |
```

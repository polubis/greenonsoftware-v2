# Architectural Decision Record: Linux-Inspired Micro-Frontends Architecture

## Status

**Proposed** - This ADR documents the architectural decisions for the 4Focus application's micro-frontends architecture inspired by Linux system design.

## Context

The 4Focus application is being restructured to follow a Linux-inspired micro-frontends architecture. This approach provides clear separation of concerns, modularity, and scalability while maintaining a cohesive user experience.

## Decision

We will implement a Linux-inspired micro-frontends architecture with the following core components:

### 1. Shells (User Space Applications)

**Location**: `src/shells/`

Shells are isolated applications that represent complete user-facing modules. Each shell is a black box with its own:

- Internal routing and navigation
- State management
- Business logic
- UI components
- API communication layer

**Current Implementation**:

- `src/shells/main/` - Main application shell containing dashboard, tasks, and account features

**Characteristics**:

- Self-contained and independently deployable
- Communicate only through the kernel (shared modules)
- Have their own internal architecture and patterns
- Can be developed by different teams independently

### 2. Kernel (System Core)

**Location**: `src/shared/`

The kernel provides essential system services and cross-module communication infrastructure:

#### Core Services:

- **Routing**: `src/shared/routing/` - Centralized route definitions and navigation
- **Authentication**: `src/shared/client-auth/` - User authentication state and management
- **API Contracts**: `src/shared/contracts/` - Type-safe API definitions and schemas
- **Database**: `src/shared/db/` - Database connections and type definitions
- **Server Utilities**: `src/shared/server/` - Server-side utilities and response handling

#### Communication Layer:

- **Clean API**: `src/lib/clean-api-v2/` - Type-safe API client with validation
- **Contracts**: Centralized API contract definitions
- **Error Handling**: Standardized error parsing and handling

### 3. Libraries (System Libraries)

**Location**: `src/lib/` and `packages/`

Libraries are domain-agnostic, reusable code modules:

#### Current Libraries:

- **Clean API v2**: Type-safe API client with validation
- **UI Components**: `src/components/ui/` - Reusable UI primitives
- **Utilities**: `src/lib/utils.ts` - Common utility functions

#### Characteristics:

- Completely domain-agnostic
- Highly reusable across different shells
- Well-tested and stable
- Version-controlled independently

### 4. Shared Features (Kernel Extensions)

**Location**: `src/shared/`

For features that need to be shared between shells but are domain-specific:

#### Current Shared Features:

- **Focus Session**: `src/shared/focus-session/` - Focus session management
- **Navigation Components**: `src/shared/components/` - Shared UI components
- **Hooks**: `src/shared/hooks/` - Shared React hooks

#### Decision Framework for Shared Features:

**When to put in `src/shared/`:**

- ✅ Feature is used by multiple shells
- ✅ Feature contains domain-specific business logic
- ✅ Feature needs to maintain state consistency across shells
- ✅ Feature requires coordination between shells

**When to put in `src/lib/` or `packages/`:**

- ✅ Code is completely domain-agnostic
- ✅ Code can be used in any application context
- ✅ Code has no business logic dependencies
- ✅ Code is a pure utility or primitive

**When to duplicate in each shell:**

- ✅ Feature is shell-specific but similar to others
- ✅ Feature needs different implementations per shell
- ✅ Feature is experimental and may diverge

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    4Focus Application                       │
├─────────────────────────────────────────────────────────────┤
│  Shells (User Space Applications)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Main Shell  │  │ Admin Shell │  │ Mobile Shell│  ...     │
│  │             │  │             │  │             │         │
│  │ - Dashboard │  │ - Analytics │  │ - Mobile UI │         │
│  │ - Tasks     │  │ - Users     │  │ - Touch UX  │         │
│  │ - Account   │  │ - Settings  │  │ - Offline   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  Kernel (System Core) - src/shared/                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Routing   │  │    Auth     │  │  Contracts  │         │
│  │             │  │             │  │             │         │
│  │ - AppRouter │  │ - AuthState │  │ - API Defs  │         │
│  │ - APIRouter │  │ - User Hook │  │ - Schemas   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Database   │  │   Server    │  │   Shared    │         │
│  │             │  │             │  │  Features   │         │
│  │ - Supabase  │  │ - Response  │  │ - Focus     │         │
│  │ - Types     │  │ - Utils     │  │ - Hooks     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  Libraries (System Libraries) - src/lib/ & packages/       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Clean API   │  │ UI Components│  │  Utilities  │         │
│  │             │  │             │  │             │         │
│  │ - Type-safe │  │ - Primitives│  │ - Common    │         │
│  │ - Validation│  │ - Layouts   │  │ - Helpers   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Guidelines

### Shell Development

1. **Isolation**: Each shell should be completely self-contained
2. **Communication**: Use only kernel services for cross-shell communication
3. **State Management**: Each shell manages its own state independently
4. **Routing**: Use kernel routing definitions but implement shell-specific navigation

### Kernel Development

1. **Stability**: Kernel APIs should be stable and well-versioned
2. **Documentation**: All kernel services must be well-documented
3. **Testing**: Comprehensive testing for all kernel services
4. **Backward Compatibility**: Maintain backward compatibility when possible

### Library Development

1. **Domain Agnostic**: Libraries should have no business logic
2. **Reusability**: Design for maximum reusability
3. **Testing**: Extensive unit testing
4. **Documentation**: Clear API documentation

### Shared Feature Development

1. **Justification**: Document why a feature needs to be shared
2. **Interface Design**: Design clean, stable interfaces
3. **Versioning**: Use semantic versioning for shared features
4. **Migration Path**: Provide clear migration paths for breaking changes

## File Structure

```
src/
├── shells/                    # User Space Applications
│   ├── main/                 # Main application shell
│   │   ├── features/         # Shell-specific features
│   │   ├── shell-layout.tsx  # Shell layout component
│   │   ├── shell-router.tsx  # Shell routing
│   │   └── shell.tsx         # Shell entry point
│   └── admin/                # Future admin shell
├── shared/                   # Kernel (System Core)
│   ├── routing/              # Centralized routing
│   ├── client-auth/          # Authentication system
│   ├── contracts/            # API contracts
│   ├── db/                   # Database layer
│   ├── server/               # Server utilities
│   ├── components/           # Shared UI components
│   ├── hooks/                # Shared React hooks
│   └── focus-session/        # Shared domain features
├── lib/                      # System Libraries
│   ├── clean-api-v2/         # Type-safe API client
│   └── utils.ts              # Common utilities
└── components/               # UI Library
    └── ui/                   # UI primitives
```

## Benefits

1. **Modularity**: Clear separation of concerns and responsibilities
2. **Scalability**: Easy to add new shells and features
3. **Team Independence**: Different teams can work on different shells
4. **Maintainability**: Isolated codebases are easier to maintain
5. **Testing**: Each component can be tested independently
6. **Deployment**: Independent deployment of shells and kernel updates

## Risks and Mitigations

### Risks:

1. **Over-engineering**: Risk of creating unnecessary complexity
2. **Communication Overhead**: Coordination between teams
3. **Version Management**: Managing dependencies between components

### Mitigations:

1. **Clear Guidelines**: Well-defined architectural guidelines
2. **Documentation**: Comprehensive documentation and examples
3. **Tooling**: Automated dependency management and versioning
4. **Regular Reviews**: Regular architecture reviews and refactoring

## Future Considerations

1. **Micro-frontend Deployment**: Consider independent deployment of shells
2. **Cross-Shell Communication**: Implement event-driven communication
3. **Shared State Management**: Consider global state management for cross-shell features
4. **Performance**: Optimize bundle splitting and lazy loading
5. **Monitoring**: Implement comprehensive monitoring and observability

## Conclusion

This Linux-inspired architecture provides a solid foundation for scalable, maintainable micro-frontends while maintaining the benefits of a monolithic development experience. The clear separation between shells, kernel, and libraries ensures that the system remains flexible and extensible as it grows.

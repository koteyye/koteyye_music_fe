# CRUSH.md - Koteyye Music Frontend

## Build/Lint/Test Commands
- **Dev server**: `npm run dev` (runs on port 3000 with API proxy)
- **Build**: `npm run build` (production build without type checking)
- **Build with types**: `npm run build:check` (includes TypeScript compilation via vue-tsc)
- **Preview**: `npm run preview`
- **Type check**: `vue-tsc --noEmit`

## Tech Stack
- Vue 3 with Composition API + TypeScript
- Pinia for state management
- Vue Router for navigation
- Vite for build tooling
- TailwindCSS for styling
- Lucide Vue Next for icons

## Code Style Guidelines

### Imports & Structure
- Use `@/` alias for src imports
- Group imports: external libs → Vue composables → local stores/utils → types → components
- Use `<script setup lang="ts">` for all Vue components

### Naming Conventions
- Files: PascalCase for components, camelCase for utilities
- Variables: camelCase
- Types: PascalCase interfaces
- Stores: `use[Name]Store()` pattern
- API methods: camelCase with descriptive names

### Vue Best Practices
- Use `defineProps<Props>()` for typed props
- Prefer Composition API with `ref()`/`computed()`
- Use `v-if`/`v-else` for conditional rendering
- Include proper loading states and error handling

### TypeScript
- Strict mode enabled with `noUnusedLocals` and `noUnusedParameters`
- Define interfaces in `src/types/index.ts`
- Use proper typing for API responses and store state

### Styling
- TailwindCSS utility classes preferred
- Custom colors: `cream`, `kot-orange`, `kot-dark`
- Responsive design with mobile-first approach
- Use `group` classes for hover effects
# GalleryTemplate

A photo library application featuring an infinite random photostream and a persistent Favorites library. The app is built with Angular 22, Tailwind CSS, Angular Material and localization support.

## Key versions

- Angular packages: `22.0.1`
- Angular CLI: `~22.0.1`
- Angular Material: `22.0.1`
- RxJS: `~7.8.0`
- TypeScript: `~6.0.3`
- Tailwind CSS: `^4.3.1`
- PostCSS: `^8.5.15`
- UUID: `^14.0.0`
- Zone.js: `~0.15.1`

## Development tools

The project uses:

- Angular CLI for serving, building, and code generation
- ESLint and `angular-eslint` for linting
- Prettier for formatting
- Vitest for test coverage support
- `jsdom` to support DOM-based test environments

## Key features

- Infinite random photostream on the Photos screen at `/`
- Add photos to Favorites by clicking on them in the photostream
- Random image loading using a source like `https://picsum.photos/200/300`
- Infinite scroll that loads new photos and displays a loader with a simulated 200-300ms network delay
- Favorites page at `/favourites` showing all saved photos with persistence across refreshes
- Single photo page at `/photos/:id` displaying one full-screen photo and a remove-from-favorites action
- Persistent header with view switching buttons for Photos and Favorites, with active view highlighting
- Localization with `@ngx-translate` and translation assets
- Angular Material UI enhanced by Tailwind CSS styling
- Reusable shared components like photo cards, loading indicators, and page headers

## Getting started

This project requires Node.js `>= v22.22.3`.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run start
   ```

3. Open the application in your browser:

   ```text
   http://localhost:4200
   ```

The app reloads automatically when source files change.

## Build

Build the production bundle:

```bash
npm run build
```

The build artifacts are written to the `dist/` directory.

## Testing

Run the test suite once:

```bash
npm run test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Formatting and linting

Check formatting:

```bash
npm run prettier:check
```

Apply formatting:

```bash
npm run prettier:apply
```

Lint the project:

```bash
npm run lint
```

## Notes

This README is based on the current `package.json` dependency and dev dependency list.

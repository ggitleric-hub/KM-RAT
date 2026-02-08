# Grob Rat RAT - Electron Build Guide

## Requirements

- Node.js 18+
- Windows 10/11

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Production Build

```bash
npm run build:electron:win
```

The `.exe` file will be in the `release/` directory.

## Notes

- For development, Next.js runs on port 3000
- The app includes a local SQLite database
- Antivirus may flag the exe - this is normal for RAT tools

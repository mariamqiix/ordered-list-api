# Ordered List API

A REST API for managing ordered lists with automatic position handling.

## Requirements

- Node.js
- npm

## What it does

- Create and fetch lists
- Add, fetch, and delete items in lists
- Move items to different positions within a list
- Automatically manages item positions (no gaps, no duplicates)
- Uses SQLite for persistence

## Setup

```bash
npm install
node server.js
```

Server runs on http://localhost:3000

## API Endpoints

**Lists:**
- `POST /lists` - Create a new list
- `GET /lists` - Get all lists

**Items:**
- `POST /lists/:id/items` - Add item to a list
- `GET /lists/:id/items` - Get items in a list (sorted by position)
- `GET /items/:id` - Get a single item
- `PATCH /items/:id/position` - Move item to new position
- `DELETE /items/:id` - Delete an item

## Testing

```bash
node test.js
```

Validates all API endpoints and position logic.

## Note

A basic web UI is included for testing the API.



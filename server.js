const express = require('express');
const path = require('path');
const { db, run, get, all, initDb } = require('./database');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const PORT = 3000;

(async () => {
  await initDb();

// post > '/lists' > create a new list  
  app.post('/lists', async (req, res) => {
    try {
      const { name } = req.body;
      const result = await run('INSERT INTO lists (name) VALUES (?)', [name]);
      res.json({ id: result.lastID, name });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create list' });
    }
  });

  // get > '/lists' > gett all lists
  app.get('/lists', async (req, res) => {
    try {
      const lists = await all('SELECT id, name FROM lists');
      res.json(lists);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch lists' });
    }
  });

  // post > '/lists/:id/items' > create a new item , will return the id and hte position  
  app.post('/lists/:id/items', async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const maxPosition = await get(
        'SELECT MAX(position) as max_position FROM items WHERE list_id = ?',
        [id]
      );

      const nextPosition = (maxPosition?.max_position || 0) + 1;
      const result = await run(
        'INSERT INTO items (list_id, name, position) VALUES (?, ?, ?)',
        [id, name, nextPosition]
      );

      res.json({ id: result.lastID, position: nextPosition });
    } catch (err) {
      res.status(500).json({ error: 'Failed to add item' });
    }
  });

  // get > '/lists/:id/items' > will return all items in the list
  app.get('/lists/:id/items', async (req, res) => {
    try {
      const { id } = req.params;
      const items = await all(
        'SELECT id, name, position FROM items WHERE list_id = ? ORDER BY position ASC',
        [id]
      );
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch items' });
    }
  });

  // get > /items/:id - get item by id
  app.get('/items/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const item = await get(
        'SELECT id, list_id, name, position FROM items WHERE id = ?',
        [id]
      );

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      res.json(item);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch item' });
    }
  });

  // ptch > /items/:id/position - move the item and update its position
  app.patch('/items/:id/position', async (req, res) => {
    try {
      const { id } = req.params;
      const { position: newPosition } = req.body;
      const item = await get('SELECT id, list_id, position FROM items WHERE id = ?', [id]);

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      const oldPosition = item.position;
      const listId = item.list_id;

      if (newPosition < 1) {
        return res.status(400).json({ error: 'Invalid position' });
      }

      const maxPositionDB = await get(
        'SELECT MAX(position) as max_positoin FROM items WHERE list_id = ?',
        [listId]
      );
      const maxPos = maxPositionDB?.max_positoin || 0;
      await run('BEGIN TRANSACTION');

      if (newPosition > maxPos) {
        return res.status(400).json({ error: 'Invalid position' });
      }

      if (oldPosition === newPosition) {
        return res.json({ id, position: newPosition });
      }

      try {
        if (newPosition < oldPosition) {
          await run(
            'UPDATE items SET position = position + 1 WHERE position >= ? AND position < ? AND list_id = ?',
            [newPosition, oldPosition, listId]
          );
        } else {
          await run(
            'UPDATE items SET position = position - 1 WHERE position > ? AND position <= ? AND list_id = ?',
            [oldPosition, newPosition, listId]
          );
        }

        await run('UPDATE items SET position = ? WHERE id = ?', [newPosition, id]);
        
        await run("COMMIT");
        res.json({ id, position: newPosition });
      } catch (err) {
        await run('ROLLBACK');
        throw err;
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to move item' });
    }
  });

  // delete > /items/:id - delete an item and update other items positions
  app.delete('/items/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const item = await get('SELECT id, list_id, position FROM items WHERE id = ?', [id]);

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      const deletedPosition = item.position;
      const listId = item.list_id;

      try {
        await run('DELETE FROM items WHERE id = ?', [id]);
        await run(
          'UPDATE items SET position = position - 1 WHERE position > ? AND list_id = ?',
          [deletedPosition, listId]
        );
        await run("COMMIT");
        res.json({ message: 'Item deleted' });
      } catch (err) {
        await run('ROLLBACK');
        throw err;
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();

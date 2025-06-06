import { Router, Request, Response } from 'express';
import { BrainyData, NounType, VerbType } from '@soulcraft/brainy';

// Define a custom request type that includes the Brainy instance
interface BrainyRequest extends Request {
  brainy: BrainyData;
}

export function setupRoutes() {
  const router = Router();

  // Get database status
  router.get('/status', async (req: BrainyRequest, res: Response) => {
    try {
      const status = await req.brainy.status();
      res.status(200).json(status);
    } catch (error) {
      console.error('Error getting status:', error);
      res.status(500).json({ error: 'Failed to get database status' });
    }
  });

  // Add a noun (entity)
  router.post('/nouns', async (req: BrainyRequest, res: Response) => {
    try {
      const { text, metadata } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const id = await req.brainy.add(text, metadata || {});
      res.status(201).json({ id });
    } catch (error) {
      console.error('Error adding noun:', error);
      res.status(500).json({ error: 'Failed to add noun' });
    }
  });

  // Get a noun by ID
  router.get('/nouns/:id', async (req: BrainyRequest, res: Response) => {
    try {
      const { id } = req.params;
      const noun = await req.brainy.get(id);
      
      if (!noun) {
        return res.status(404).json({ error: 'Noun not found' });
      }
      
      res.status(200).json(noun);
    } catch (error) {
      console.error('Error getting noun:', error);
      res.status(500).json({ error: 'Failed to get noun' });
    }
  });

  // Update noun metadata
  router.put('/nouns/:id', async (req: BrainyRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { metadata } = req.body;
      
      if (!metadata) {
        return res.status(400).json({ error: 'Metadata is required' });
      }
      
      await req.brainy.updateMetadata(id, metadata);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating noun:', error);
      res.status(500).json({ error: 'Failed to update noun' });
    }
  });

  // Delete a noun
  router.delete('/nouns/:id', async (req: BrainyRequest, res: Response) => {
    try {
      const { id } = req.params;
      await req.brainy.delete(id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting noun:', error);
      res.status(500).json({ error: 'Failed to delete noun' });
    }
  });

  // Search for similar nouns
  router.post('/search', async (req: BrainyRequest, res: Response) => {
    try {
      const { query, limit = 10 } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }
      
      const results = await req.brainy.searchText(query, limit);
      res.status(200).json(results);
    } catch (error) {
      console.error('Error searching:', error);
      res.status(500).json({ error: 'Failed to search' });
    }
  });

  // Add a verb (relationship)
  router.post('/verbs', async (req: BrainyRequest, res: Response) => {
    try {
      const { sourceId, targetId, metadata } = req.body;
      
      if (!sourceId || !targetId) {
        return res.status(400).json({ error: 'Source ID and Target ID are required' });
      }
      
      await req.brainy.addVerb(sourceId, targetId, metadata || {});
      res.status(201).json({ success: true });
    } catch (error) {
      console.error('Error adding verb:', error);
      res.status(500).json({ error: 'Failed to add verb' });
    }
  });

  // Get all verbs
  router.get('/verbs', async (req: BrainyRequest, res: Response) => {
    try {
      const verbs = await req.brainy.getAllVerbs();
      res.status(200).json(verbs);
    } catch (error) {
      console.error('Error getting verbs:', error);
      res.status(500).json({ error: 'Failed to get verbs' });
    }
  });

  // Get verbs by source
  router.get('/verbs/source/:id', async (req: BrainyRequest, res: Response) => {
    try {
      const { id } = req.params;
      const verbs = await req.brainy.getVerbsBySource(id);
      res.status(200).json(verbs);
    } catch (error) {
      console.error('Error getting verbs by source:', error);
      res.status(500).json({ error: 'Failed to get verbs by source' });
    }
  });

  // Get verbs by target
  router.get('/verbs/target/:id', async (req: BrainyRequest, res: Response) => {
    try {
      const { id } = req.params;
      const verbs = await req.brainy.getVerbsByTarget(id);
      res.status(200).json(verbs);
    } catch (error) {
      console.error('Error getting verbs by target:', error);
      res.status(500).json({ error: 'Failed to get verbs by target' });
    }
  });

  // Delete a verb
  router.delete('/verbs/:id', async (req: BrainyRequest, res: Response) => {
    try {
      const { id } = req.params;
      await req.brainy.deleteVerb(id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting verb:', error);
      res.status(500).json({ error: 'Failed to delete verb' });
    }
  });

  // Clear all data
  router.delete('/clear', async (req: BrainyRequest, res: Response) => {
    try {
      await req.brainy.clear();
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error clearing data:', error);
      res.status(500).json({ error: 'Failed to clear data' });
    }
  });

  return router;
}

import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import { getAdminDb, COLLECTIONS } from '@techsprint/firebase';
import { createIssueInputSchema, respondToIssueInputSchema, issueFiltersSchema, paginationSchema } from '@techsprint/validation';
import { generateIssueId } from '@techsprint/utils';
import { authMiddleware, requireRole, requireMunicipality, AuthenticatedRequest } from '../middleware/auth';
import type { Issue, IssueStatus, GeoLocation } from '@techsprint/types';

const router: IRouter = Router();

// Get all issues (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getAdminDb();
    const { page, pageSize } = paginationSchema.parse(req.query);
    const filters = issueFiltersSchema.parse(req.query);

    let query = db.collection(COLLECTIONS.ISSUES).orderBy('createdAt', 'desc');

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      query = query.where('status', 'in', filters.status);
    }
    if (filters.type && filters.type.length > 0) {
      query = query.where('type', 'in', filters.type);
    }
    if (filters.municipalityId) {
      query = query.where('municipalityId', '==', filters.municipalityId);
    }

    // Pagination
    const offset = (page - 1) * pageSize;
    const snapshot = await query.limit(pageSize).offset(offset).get();

    const issues = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    // Get total count
    const countSnapshot = await db.collection(COLLECTIONS.ISSUES).count().get();
    const total = countSnapshot.data().count;

    res.json({
      success: true,
      data: {
        items: issues,
        total,
        page,
        pageSize,
        hasMore: offset + issues.length < total
      },
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to fetch issues',
      timestamp: new Date().toISOString()
    });
  }
});

// Get single issue (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getAdminDb();
    const doc = await db.collection(COLLECTIONS.ISSUES).doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Issue not found',
        timestamp: new Date().toISOString()
      });
    }

    const issue = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate(),
      updatedAt: doc.data()?.updatedAt?.toDate()
    };

    res.json({
      success: true,
      data: issue,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching issue:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to fetch issue',
      timestamp: new Date().toISOString()
    });
  }
});

// Get issues by bounds (for map)
router.get('/map/bounds', async (req: Request, res: Response) => {
  try {
    const db = getAdminDb();
    const { north, south, east, west } = req.query;

    if (!north || !south || !east || !west) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Missing bounds parameters',
        timestamp: new Date().toISOString()
      });
    }

    // Note: Firestore doesn't support compound geo queries
    // For production, use GeoFirestore or similar
    const snapshot = await db.collection(COLLECTIONS.ISSUES)
      .where('location.latitude', '>=', parseFloat(south as string))
      .where('location.latitude', '<=', parseFloat(north as string))
      .limit(500)
      .get();

    const issues = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(issue => {
        const lng = (issue as any).location?.longitude;
        return lng >= parseFloat(west as string) && lng <= parseFloat(east as string);
      });

    res.json({
      success: true,
      data: issues,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching map issues:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to fetch map issues',
      timestamp: new Date().toISOString()
    });
  }
});

// Create new issue (anonymous/public)
router.post('/', async (req: Request, res: Response) => {
  try {
    const input = createIssueInputSchema.parse(req.body);
    const db = getAdminDb();

    const issueId = generateIssueId();
    const now = new Date();

    // TODO: Call ML service to classify issue type
    const classifiedType = input.type || 'OTHER';

    // TODO: Reverse geocode to get municipality
    const municipalityId = 'MUN-DEFAULT'; // Placeholder

    const location: GeoLocation = {
      latitude: input.location.latitude,
      longitude: input.location.longitude
    };

    const issue: Omit<Issue, 'id'> = {
      type: classifiedType,
      description: input.description,
      imageUrl: input.imageUrl,
      location,
      region: {
        state: 'Unknown',
        district: 'Unknown',
        municipality: 'Unknown'
      },
      municipalityId,
      status: 'OPEN' as IssueStatus,
      createdAt: now,
      updatedAt: now,
      resolution: null
    };

    await db.collection(COLLECTIONS.ISSUES).doc(issueId).set({
      ...issue,
      createdAt: now,
      updatedAt: now
    });

    // Update municipality stats
    await db.collection(COLLECTIONS.MUNICIPALITIES).doc(municipalityId).update({
      totalIssues: require('firebase-admin').firestore.FieldValue.increment(1),
      updatedAt: now
    }).catch(() => {
      // Municipality might not exist yet
    });

    res.status(201).json({
      success: true,
      data: { id: issueId, ...issue },
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error creating issue:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Validation failed: ' + error.errors.map((e: any) => e.message).join(', '),
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to create issue',
      timestamp: new Date().toISOString()
    });
  }
});

// Respond to issue (municipality user only)
router.post('/:id/respond', authMiddleware, requireRole('MUNICIPALITY_USER'), requireMunicipality, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const input = respondToIssueInputSchema.parse({
      ...req.body,
      issueId: req.params.id
    });
    const db = getAdminDb();

    // Get the issue
    const issueDoc = await db.collection(COLLECTIONS.ISSUES).doc(input.issueId).get();
    
    if (!issueDoc.exists) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Issue not found',
        timestamp: new Date().toISOString()
      });
    }

    const issue = issueDoc.data() as Issue;

    // Check jurisdiction
    if (issue.municipalityId !== req.user?.municipalityId) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Issue not in your jurisdiction',
        timestamp: new Date().toISOString()
      });
    }

    // Check if already responded
    if (issue.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Issue already has a response',
        timestamp: new Date().toISOString()
      });
    }

    const now = new Date();

    // TODO: Call ML service to verify resolution
    // For now, set status to RESPONDED
    const verificationScore = null; // Will be set by ML service

    await db.collection(COLLECTIONS.ISSUES).doc(input.issueId).update({
      status: 'RESPONDED',
      resolution: {
        resolutionImageUrl: input.resolutionImageUrl,
        resolutionNote: input.resolutionNote,
        respondedAt: now,
        respondedBy: req.user?.uid,
        verificationScore,
        verifiedAt: null
      },
      updatedAt: now
    });

    res.json({
      success: true,
      data: { issueId: input.issueId, status: 'RESPONDED' },
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error responding to issue:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Validation failed: ' + error.errors.map((e: any) => e.message).join(', '),
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to respond to issue',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as issueRoutes };

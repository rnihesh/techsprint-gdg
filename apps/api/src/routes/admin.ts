import { Router, Response } from 'express';
import type { Router as IRouter } from 'express';
import { getAdminDb, COLLECTIONS } from '@techsprint/firebase';
import { 
  createMunicipalitySchema, 
  updateMunicipalitySchema,
  municipalityRegistrationSchema,
  paginationSchema 
} from '@techsprint/validation';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { getMunicipalityBounds, getCityBounds } from '../services/location';

const router: IRouter = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(requireRole('PLATFORM_MAINTAINER'));

// ============================================
// MUNICIPALITY MANAGEMENT
// ============================================

// Get all municipalities (with pagination and filters)
router.get('/municipalities', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getAdminDb();
    const { page, pageSize } = paginationSchema.parse(req.query);
    const { state, district, search } = req.query;

    let query = db.collection(COLLECTIONS.MUNICIPALITIES).orderBy('name');

    if (state) {
      query = query.where('state', '==', state);
    }
    if (district) {
      query = query.where('district', '==', district);
    }

    const snapshot = await query
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .get();

    const municipalities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    const countSnapshot = await db.collection(COLLECTIONS.MUNICIPALITIES).count().get();
    const total = countSnapshot.data().count;

    res.json({
      success: true,
      data: {
        items: municipalities,
        total,
        page,
        pageSize,
        hasMore: (page - 1) * pageSize + municipalities.length < total
      },
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching municipalities:', error?.message || String(error));
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to fetch municipalities',
      timestamp: new Date().toISOString()
    });
  }
});

// Create a new municipality
router.post('/municipalities', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getAdminDb();
    const input = createMunicipalitySchema.parse(req.body);
    const now = new Date();

    const municipalityData = {
      ...input,
      score: 100, // Start with perfect score
      totalIssues: 0,
      resolvedIssues: 0,
      avgResolutionTime: null,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await db.collection(COLLECTIONS.MUNICIPALITIES).add(municipalityData);

    res.status(201).json({
      success: true,
      data: { id: docRef.id, ...municipalityData },
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error creating municipality:', error?.message || String(error));
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        data: null,
        error: error.errors,
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to create municipality',
      timestamp: new Date().toISOString()
    });
  }
});

// Update a municipality
router.put('/municipalities/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getAdminDb();
    const { id } = req.params;
    const input = updateMunicipalitySchema.parse(req.body);

    const docRef = db.collection(COLLECTIONS.MUNICIPALITIES).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Municipality not found',
        timestamp: new Date().toISOString()
      });
    }

    await docRef.update({
      ...input,
      updatedAt: new Date()
    });

    const updated = await docRef.get();

    res.json({
      success: true,
      data: { id: updated.id, ...updated.data() },
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error updating municipality:', error?.message || String(error));

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        data: null,
        error: error.errors,
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to update municipality',
      timestamp: new Date().toISOString()
    });
  }
});

// Auto-regenerate bounds for a municipality
router.post('/municipalities/:id/regenerate-bounds', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getAdminDb();
    const { id } = req.params;

    const docRef = db.collection(COLLECTIONS.MUNICIPALITIES).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Municipality not found',
        timestamp: new Date().toISOString()
      });
    }

    const municipality = doc.data()!;
    
    // Get new bounds from Google Maps
    const newBounds = await getMunicipalityBounds(
      municipality.name,
      municipality.district,
      municipality.state
    );

    await docRef.update({
      bounds: newBounds,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      data: { 
        id, 
        name: municipality.name,
        bounds: newBounds,
        message: `Bounds updated: N:${newBounds.north.toFixed(4)} S:${newBounds.south.toFixed(4)} E:${newBounds.east.toFixed(4)} W:${newBounds.west.toFixed(4)}`
      },
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error regenerating bounds:', error?.message || String(error));
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to regenerate bounds',
      timestamp: new Date().toISOString()
    });
  }
});

// Delete a municipality
router.delete('/municipalities/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getAdminDb();
    const { id } = req.params;

    const docRef = db.collection(COLLECTIONS.MUNICIPALITIES).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Municipality not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if there are any linked issues
    const issuesSnapshot = await db.collection(COLLECTIONS.ISSUES)
      .where('municipalityId', '==', id)
      .limit(1)
      .get();

    if (!issuesSnapshot.empty) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Cannot delete municipality with existing issues. Reassign issues first.',
        timestamp: new Date().toISOString()
      });
    }

    await docRef.delete();

    res.json({
      success: true,
      data: { deleted: true },
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting municipality:', error?.message || String(error));
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to delete municipality',
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// MUNICIPALITY REGISTRATION REQUESTS
// ============================================

// Get pending registration requests
router.get('/registrations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getAdminDb();
    const { page, pageSize } = paginationSchema.parse(req.query);
    const { status = 'PENDING' } = req.query;

    // Get all registrations with the given status (no orderBy to avoid index requirement)
    const snapshot = await db.collection('municipality_registrations')
      .where('status', '==', status)
      .get();

    // Sort in memory by createdAt descending
    let registrations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    registrations.sort((a: any, b: any) => {
      const aTime = a.createdAt?.getTime() || 0;
      const bTime = b.createdAt?.getTime() || 0;
      return bTime - aTime; // descending
    });

    const total = registrations.length;
    
    // Apply pagination
    registrations = registrations.slice((page - 1) * pageSize, page * pageSize);

    res.json({
      success: true,
      data: {
        items: registrations,
        total,
        page,
        pageSize,
        hasMore: (page - 1) * pageSize + registrations.length < total
      },
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching registrations:', error?.message || String(error));
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to fetch registrations',
      timestamp: new Date().toISOString()
    });
  }
});

// Approve a registration request
router.post('/registrations/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getAdminDb();
    const { id } = req.params;
    const { bounds } = req.body; // Admin provides the jurisdiction bounds

    // Get the registration request
    const regRef = db.collection('municipality_registrations').doc(id);
    const regDoc = await regRef.get();

    if (!regDoc.exists) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Registration request not found',
        timestamp: new Date().toISOString()
      });
    }

    const registration = regDoc.data()!;

    if (registration.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Registration has already been processed',
        timestamp: new Date().toISOString()
      });
    }

    const now = new Date();

    // Auto-generate bounds if not provided
    let municipalityBounds = bounds || registration.bounds;
    
    if (!municipalityBounds || (municipalityBounds.north === 0 && municipalityBounds.south === 0)) {
      console.log(`Auto-generating bounds for ${registration.municipalityName}, ${registration.district}, ${registration.state}`);
      municipalityBounds = await getMunicipalityBounds(
        registration.municipalityName,
        registration.district,
        registration.state
      );
    }

    // Create the municipality
    const municipalityData = {
      name: registration.municipalityName,
      type: registration.municipalityType || 'MUNICIPALITY',
      state: registration.state,
      district: registration.district,
      bounds: municipalityBounds,
      score: 100,
      totalIssues: 0,
      resolvedIssues: 0,
      avgResolutionTime: null,
      createdAt: now,
      updatedAt: now
    };

    const municipalityRef = await db.collection(COLLECTIONS.MUNICIPALITIES).add(municipalityData);

    // Update the user to municipality role
    if (registration.userId) {
      await db.collection(COLLECTIONS.USERS).doc(registration.userId).update({
        role: 'municipality',
        municipalityId: municipalityRef.id,
        updatedAt: now
      });
    }

    // Update registration status
    await regRef.update({
      status: 'APPROVED',
      approvedBy: req.user!.uid,
      approvedAt: now,
      municipalityId: municipalityRef.id,
      updatedAt: now
    });

    res.json({
      success: true,
      data: {
        registration: { id, status: 'APPROVED' },
        municipality: { id: municipalityRef.id, ...municipalityData }
      },
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error approving registration:', error?.message || String(error));
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to approve registration',
      timestamp: new Date().toISOString()
    });
  }
});

// Reject a registration request
router.post('/registrations/:id/reject', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getAdminDb();
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Rejection reason is required',
        timestamp: new Date().toISOString()
      });
    }

    const regRef = db.collection('municipality_registrations').doc(id);
    const regDoc = await regRef.get();

    if (!regDoc.exists) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Registration request not found',
        timestamp: new Date().toISOString()
      });
    }

    const registration = regDoc.data()!;

    if (registration.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Registration has already been processed',
        timestamp: new Date().toISOString()
      });
    }

    const now = new Date();

    await regRef.update({
      status: 'REJECTED',
      rejectionReason: reason,
      rejectedBy: req.user!.uid,
      rejectedAt: now,
      updatedAt: now
    });

    res.json({
      success: true,
      data: { id, status: 'REJECTED', reason },
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error rejecting registration:', error?.message || String(error));
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to reject registration',
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// USER MANAGEMENT
// ============================================

// Get all users
router.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getAdminDb();
    const { page, pageSize } = paginationSchema.parse(req.query);
    const { role, search } = req.query;

    let query = db.collection(COLLECTIONS.USERS).orderBy('createdAt', 'desc');

    if (role) {
      query = query.where('role', '==', role);
    }

    const snapshot = await query
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .get();

    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      lastLogin: doc.data().lastLogin?.toDate()
    }));

    const countSnapshot = await db.collection(COLLECTIONS.USERS).count().get();
    const total = countSnapshot.data().count;

    res.json({
      success: true,
      data: {
        items: users,
        total,
        page,
        pageSize,
        hasMore: (page - 1) * pageSize + users.length < total
      },
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching users:', error?.message || String(error));
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to fetch users',
      timestamp: new Date().toISOString()
    });
  }
});

// Update user role
router.put('/users/:id/role', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getAdminDb();
    const { id } = req.params;
    const { role, municipalityId } = req.body;

    if (!['user', 'municipality', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid role',
        timestamp: new Date().toISOString()
      });
    }

    // If setting to municipality role, municipalityId is required
    if (role === 'municipality' && !municipalityId) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Municipality ID is required for municipality role',
        timestamp: new Date().toISOString()
      });
    }

    const userRef = db.collection(COLLECTIONS.USERS).doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    await userRef.update({
      role,
      municipalityId: role === 'municipality' ? municipalityId : null,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      data: { id, role, municipalityId: role === 'municipality' ? municipalityId : null },
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user role:', error?.message || String(error));
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to update user role',
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// DASHBOARD STATS
// ============================================

// Get admin dashboard stats
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getAdminDb();

    // Get counts in parallel
    const [usersCount, municipalitiesCount, issuesCount, pendingRegistrations] = await Promise.all([
      db.collection(COLLECTIONS.USERS).count().get(),
      db.collection(COLLECTIONS.MUNICIPALITIES).count().get(),
      db.collection(COLLECTIONS.ISSUES).count().get(),
      db.collection('municipality_registrations').where('status', '==', 'PENDING').count().get()
    ]);

    // Get issue status breakdown
    const issuesSnapshot = await db.collection(COLLECTIONS.ISSUES).get();
    const statusBreakdown = {
      OPEN: 0,
      RESPONDED: 0,
      VERIFIED: 0,
      NEEDS_MANUAL_REVIEW: 0
    };

    issuesSnapshot.docs.forEach(doc => {
      const status = doc.data().status;
      if (status in statusBreakdown) {
        statusBreakdown[status as keyof typeof statusBreakdown]++;
      }
    });

    res.json({
      success: true,
      data: {
        totalUsers: usersCount.data().count,
        totalMunicipalities: municipalitiesCount.data().count,
        totalIssues: issuesCount.data().count,
        pendingRegistrations: pendingRegistrations.data().count,
        issuesByStatus: statusBreakdown
      },
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error?.message || String(error));
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to fetch admin stats',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as adminRoutes };

import { Router, Request, Response } from 'express';
import type { Router as IRouter } from 'express';
import { getAdminDb, COLLECTIONS } from '@techsprint/firebase';
import { paginationSchema } from '@techsprint/validation';
import type { Municipality, MunicipalityStats, LeaderboardEntry } from '@techsprint/types';

const router: IRouter = Router();

// Get leaderboard (public)
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const db = getAdminDb();
    const { page, pageSize } = paginationSchema.parse(req.query);

    const snapshot = await db.collection(COLLECTIONS.MUNICIPALITIES)
      .orderBy('score', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .get();

    const entries: LeaderboardEntry[] = snapshot.docs.map((doc, index) => ({
      rank: (page - 1) * pageSize + index + 1,
      municipality: {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as Municipality,
      score: doc.data().score,
      trend: 'STABLE' as const, // TODO: Calculate from history
      previousRank: null
    }));

    const countSnapshot = await db.collection(COLLECTIONS.MUNICIPALITIES).count().get();
    const total = countSnapshot.data().count;

    res.json({
      success: true,
      data: {
        entries,
        lastUpdated: new Date(),
        totalMunicipalities: total
      },
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to fetch leaderboard',
      timestamp: new Date().toISOString()
    });
  }
});

// Get all municipalities (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getAdminDb();
    const { page, pageSize } = paginationSchema.parse(req.query);
    const { state, district } = req.query;

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
    console.error('Error fetching municipalities:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to fetch municipalities',
      timestamp: new Date().toISOString()
    });
  }
});

// Get single municipality (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getAdminDb();
    const doc = await db.collection(COLLECTIONS.MUNICIPALITIES).doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Municipality not found',
        timestamp: new Date().toISOString()
      });
    }

    const municipality = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate(),
      updatedAt: doc.data()?.updatedAt?.toDate()
    };

    res.json({
      success: true,
      data: municipality,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching municipality:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to fetch municipality',
      timestamp: new Date().toISOString()
    });
  }
});

// Get municipality stats (public)
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const db = getAdminDb();
    const municipalityId = req.params.id;

    // Get all issues for this municipality
    const issuesSnapshot = await db.collection(COLLECTIONS.ISSUES)
      .where('municipalityId', '==', municipalityId)
      .get();

    const issues = issuesSnapshot.docs.map(doc => doc.data());

    // Calculate stats
    const stats: MunicipalityStats = {
      municipalityId,
      totalIssues: issues.length,
      openIssues: issues.filter(i => i.status === 'OPEN').length,
      respondedIssues: issues.filter(i => i.status === 'RESPONDED').length,
      verifiedIssues: issues.filter(i => i.status === 'VERIFIED').length,
      manualReviewIssues: issues.filter(i => i.status === 'NEEDS_MANUAL_REVIEW').length,
      avgResolutionTimeHours: calculateAvgResolutionTime(issues),
      issuesByType: calculateIssuesByType(issues),
      monthlyTrend: calculateMonthlyTrend(issues)
    };

    res.json({
      success: true,
      data: stats,
      error: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching municipality stats:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to fetch municipality stats',
      timestamp: new Date().toISOString()
    });
  }
});

// Helper functions
function calculateAvgResolutionTime(issues: any[]): number | null {
  const resolvedIssues = issues.filter(i => 
    i.status === 'VERIFIED' && i.resolution?.verifiedAt && i.createdAt
  );

  if (resolvedIssues.length === 0) return null;

  const totalHours = resolvedIssues.reduce((sum, issue) => {
    const created = issue.createdAt?.toDate?.() || new Date(issue.createdAt);
    const verified = issue.resolution.verifiedAt?.toDate?.() || new Date(issue.resolution.verifiedAt);
    return sum + (verified.getTime() - created.getTime()) / (1000 * 60 * 60);
  }, 0);

  return Math.round(totalHours / resolvedIssues.length);
}

function calculateIssuesByType(issues: any[]): Record<string, number> {
  return issues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function calculateMonthlyTrend(issues: any[]): Array<{ month: string; issues: number; resolved: number }> {
  const monthlyData: Record<string, { issues: number; resolved: number }> = {};
  
  issues.forEach(issue => {
    const date = issue.createdAt?.toDate?.() || new Date(issue.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { issues: 0, resolved: 0 };
    }
    monthlyData[monthKey].issues++;
    
    if (issue.status === 'VERIFIED') {
      monthlyData[monthKey].resolved++;
    }
  });

  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, data]) => ({ month, ...data }));
}

export { router as municipalityRoutes };

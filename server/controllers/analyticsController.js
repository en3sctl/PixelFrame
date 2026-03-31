import Analytics from '../models/Analytics.js';

/**
 * Track a pageview or click event
 * POST /api/analytics/track
 */
export const trackEvent = async (req, res) => {
  try {
    const { type, page, referrer, target, sessionId } = req.body;

    if (!type || !page) {
      return res.status(400).json({ success: false, message: 'type and page required' });
    }

    // Validate page format (must start with /)
    const safePage = String(page).replace(/[<>"'&]/g, '').slice(0, 500);
    const safeReferrer = String(referrer || '').replace(/[<>"']/g, '').slice(0, 1000);
    const safeTarget = String(target || '').replace(/[<>"']/g, '').slice(0, 200);
    const safeSessionId = String(sessionId || '').replace(/[^a-z0-9]/gi, '').slice(0, 100);

    await Analytics.create({
      type: type === 'click' ? 'click' : 'pageview',
      page: safePage,
      referrer: safeReferrer,
      userAgent: String(req.headers['user-agent'] || '').slice(0, 500),
      ip: req.ip || req.connection?.remoteAddress || '',
      sessionId: safeSessionId,
      target: safeTarget
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.json({ success: true });
  }
};

/**
 * Get analytics summary (admin only)
 * GET /api/analytics/summary
 */
export const getSummary = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setDate(monthStart.getDate() - 30);

    // Run all aggregations in parallel
    const [
      todayViews,
      weekViews,
      monthViews,
      totalViews,
      todayUnique,
      weekUnique,
      monthUnique,
      totalUnique,
      topPages,
      topReferrers,
      dailyStats,
      recentClicks
    ] = await Promise.all([
      // Pageview counts
      Analytics.countDocuments({ type: 'pageview', createdAt: { $gte: todayStart } }),
      Analytics.countDocuments({ type: 'pageview', createdAt: { $gte: weekStart } }),
      Analytics.countDocuments({ type: 'pageview', createdAt: { $gte: monthStart } }),
      Analytics.countDocuments({ type: 'pageview' }),

      // Unique visitors (by sessionId)
      Analytics.distinct('sessionId', { type: 'pageview', createdAt: { $gte: todayStart }, sessionId: { $ne: '' } }).then(r => r.length),
      Analytics.distinct('sessionId', { type: 'pageview', createdAt: { $gte: weekStart }, sessionId: { $ne: '' } }).then(r => r.length),
      Analytics.distinct('sessionId', { type: 'pageview', createdAt: { $gte: monthStart }, sessionId: { $ne: '' } }).then(r => r.length),
      Analytics.distinct('sessionId', { type: 'pageview', sessionId: { $ne: '' } }).then(r => r.length),

      // Top pages (last 30 days)
      Analytics.aggregate([
        { $match: { type: 'pageview', createdAt: { $gte: monthStart } } },
        { $group: { _id: '$page', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Top referrers (last 30 days)
      Analytics.aggregate([
        { $match: { type: 'pageview', createdAt: { $gte: monthStart }, referrer: { $ne: '' } } },
        { $group: { _id: '$referrer', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Daily pageviews for the last 30 days
      Analytics.aggregate([
        { $match: { type: 'pageview', createdAt: { $gte: monthStart } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            views: { $sum: 1 },
            uniqueVisitors: { $addToSet: '$sessionId' }
          }
        },
        {
          $project: {
            _id: 1,
            views: 1,
            unique: { $size: '$uniqueVisitors' }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Recent clicks
      Analytics.find({ type: 'click' })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('page target createdAt')
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          today: { views: todayViews, unique: todayUnique },
          week: { views: weekViews, unique: weekUnique },
          month: { views: monthViews, unique: monthUnique },
          total: { views: totalViews, unique: totalUnique }
        },
        topPages,
        topReferrers,
        dailyStats,
        recentClicks
      }
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler alınırken hata oluştu'
    });
  }
};

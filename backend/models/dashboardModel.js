const db = require("../config/db");

const getDashboardStats = (orgId, callback) => {
  const statsSql = `
    SELECT
      (SELECT COUNT(*) FROM job_descriptions WHERE organization_id = ?) AS jobs,
      (SELECT COUNT(*) FROM applications WHERE organization_id = ?) AS candidates,
      (SELECT COUNT(*) FROM interviews WHERE organization_id = ?) AS interviews,
      (SELECT COUNT(*) FROM applications WHERE match_score >= 80 AND organization_id = ?) AS topCandidates
  `;

  const recentAppsSql = `
    SELECT a.id, a.candidate_name, a.email, a.match_score, a.status, a.created_at, j.title AS job_title
    FROM applications a
    LEFT JOIN job_descriptions j ON a.job_id = j.jd_id
    WHERE a.organization_id = ?
    ORDER BY a.created_at DESC
    LIMIT 5
  `;

  const interviewsSql = `
    SELECT id, candidate_name, email, interview_date, interview_time, mode, interviewer, status
    FROM interviews
    WHERE organization_id = ?
    ORDER BY interview_date ASC, interview_time ASC
    LIMIT 5
  `;

  const topMatchesSql = `
    SELECT a.id, a.candidate_name, a.email, a.match_score, a.status, j.title AS job_title
    FROM applications a
    LEFT JOIN job_descriptions j ON a.job_id = j.jd_id
    WHERE a.match_score IS NOT NULL AND a.organization_id = ?
    ORDER BY a.match_score DESC
    LIMIT 5
  `;

  const activeJobsSql = `
    SELECT j.jd_id AS id, j.title, j.location, j.experience, j.salary, j.status, j.created_at,
           (SELECT COUNT(*) FROM applications WHERE job_id = j.jd_id AND organization_id = ?) AS application_count
    FROM job_descriptions j
    WHERE j.organization_id = ?
    ORDER BY j.created_at DESC
    LIMIT 5
  `;

  const funnelSql = `
    SELECT status, COUNT(*) AS count
    FROM applications
    WHERE organization_id = ?
    GROUP BY status
  `;

  const trendSql = `
    SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS date, COUNT(*) AS count
    FROM applications
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND organization_id = ?
    GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
    ORDER BY date ASC
  `;

  const runQuery = (sql, params) => {
    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  };

  Promise.all([
    runQuery(statsSql, [orgId, orgId, orgId, orgId]),
    runQuery(recentAppsSql, [orgId]),
    runQuery(interviewsSql, [orgId]),
    runQuery(topMatchesSql, [orgId]),
    runQuery(activeJobsSql, [orgId, orgId]),
    runQuery(funnelSql, [orgId]),
    runQuery(trendSql, [orgId])
  ])
    .then(([statsRes, recentAppsRes, interviewsRes, topMatchesRes, activeJobsRes, funnelRes, trendRes]) => {
      const summary = {
        ...statsRes[0],
        recentApplications: recentAppsRes || [],
        upcomingInterviews: interviewsRes || [],
        topMatchedCandidates: topMatchesRes || [],
        activeJobsList: activeJobsRes || [],
        funnelStats: funnelRes || [],
        trendStats: trendRes || []
      };
      callback(null, [summary]);
    })
    .catch((err) => {
      callback(err, null);
    });
};

module.exports = {
  getDashboardStats
};
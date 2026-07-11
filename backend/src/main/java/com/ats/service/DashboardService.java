package com.ats.service;

import com.ats.entity.*;
import com.ats.repository.*;
import com.ats.security.CustomUserDetails;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    @Autowired
    private JobDescriptionRepository jobDescriptionRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private InterviewRepository interviewRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @SuppressWarnings("unchecked")
    public Map<String, Object> getDashboardStats(CustomUserDetails user) {
        Integer orgId = user.getOrganizationId();

        // 1. Core Counts
        long jobsCount = jobDescriptionRepository.countByOrganizationId(orgId);
        long candidatesCount = applicationRepository.countByOrganizationId(orgId);
        long interviewsCount = interviewRepository.countByOrganizationId(orgId);
        long topCandidatesCount = applicationRepository.countByOrganizationIdAndMatchScoreGreaterThanEqual(orgId, 80);

        // 2. Recent Applications (Limit 5)
        List<Map<String, Object>> recentApps = applicationRepository.findTop5ByOrganizationIdOrderByIdDesc(orgId).stream()
                .map(app -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", app.getId());
                    map.put("candidate_name", app.getCandidateName());
                    map.put("email", app.getEmail());
                    map.put("match_score", app.getMatchScore());
                    map.put("status", app.getStatus());
                    map.put("created_at", app.getCreatedAt());
                    map.put("job_title", app.getJobDescription() != null ? app.getJobDescription().getTitle() : null);
                    return map;
                })
                .collect(Collectors.toList());

        // 3. Upcoming Interviews (Limit 5)
        List<Map<String, Object>> upcomingIvs = interviewRepository.findTop5ByOrganizationIdOrderByInterviewDateAscInterviewTimeAsc(orgId).stream()
                .map(iv -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", iv.getId());
                    map.put("candidate_name", iv.getCandidateName());
                    map.put("email", iv.getEmail());
                    map.put("interview_date", iv.getInterviewDate());
                    map.put("interview_time", iv.getInterviewTime());
                    map.put("mode", iv.getMode());
                    map.put("interviewer", iv.getInterviewer());
                    map.put("status", iv.getStatus());
                    return map;
                })
                .collect(Collectors.toList());

        // 4. Top Matched Candidates (Limit 5)
        List<Map<String, Object>> topMatches = applicationRepository.findTop5ByOrganizationIdAndMatchScoreIsNotNullOrderByMatchScoreDesc(orgId).stream()
                .map(app -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", app.getId());
                    map.put("candidate_name", app.getCandidateName());
                    map.put("email", app.getEmail());
                    map.put("match_score", app.getMatchScore());
                    map.put("status", app.getStatus());
                    map.put("job_title", app.getJobDescription() != null ? app.getJobDescription().getTitle() : null);
                    return map;
                })
                .collect(Collectors.toList());

        // 5. Active Jobs List (Limit 5) - Only fetch status = "Open"
        List<Map<String, Object>> activeJobs = jobDescriptionRepository.findTop5ByOrganizationIdAndStatusOrderByJdIdDesc(orgId, "Open").stream()
                .map(jd -> {
                    long appCount = applicationRepository.countByJobDescriptionJdId(jd.getJdId());
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", jd.getJdId());
                    map.put("title", jd.getTitle());
                    map.put("location", jd.getLocation());
                    map.put("experience", jd.getExperience());
                    map.put("salary", jd.getSalary());
                    map.put("status", jd.getStatus());
                    map.put("created_at", jd.getCreatedAt());
                    map.put("application_count", appCount);
                    return map;
                })
                .collect(Collectors.toList());

        // 6. Funnel Stats
        String funnelSql = "SELECT status, COUNT(*) AS count FROM applications WHERE organization_id = :orgId GROUP BY status";
        Query funnelQuery = entityManager.createNativeQuery(funnelSql);
        funnelQuery.setParameter("orgId", orgId);
        List<Object[]> funnelRows = funnelQuery.getResultList();
        List<Map<String, Object>> funnel = new ArrayList<>();
        for (Object[] row : funnelRows) {
            Map<String, Object> map = new HashMap<>();
            map.put("status", row[0]);
            map.put("count", ((Number) row[1]).intValue());
            funnel.add(map);
        }

        // 7. Trend Stats (30 days)
        String trendSql = "SELECT DATE(created_at) AS date, COUNT(*) AS count " +
                "FROM applications WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND organization_id = :orgId " +
                "GROUP BY DATE(created_at) ORDER BY date ASC";
        Query trendQuery = entityManager.createNativeQuery(trendSql);
        trendQuery.setParameter("orgId", orgId);
        List<Object[]> trendRows = trendQuery.getResultList();
        List<Map<String, Object>> trend = new ArrayList<>();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (Object[] row : trendRows) {
            Map<String, Object> map = new HashMap<>();
            Object dateObj = row[0];
            String dateStr = dateObj != null ? dateObj.toString() : "";
            map.put("date", dateStr);
            map.put("count", ((Number) row[1]).intValue());
            trend.add(map);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("jobs", jobsCount);
        response.put("candidates", candidatesCount);
        response.put("interviews", interviewsCount);
        response.put("topCandidates", topCandidatesCount);
        response.put("recentApplications", recentApps);
        response.put("upcomingInterviews", upcomingIvs);
        response.put("topMatchedCandidates", topMatches);
        response.put("activeJobsList", activeJobs);
        response.put("funnelStats", funnel);
        response.put("trendStats", trend);

        return response;
    }
}

package com.ats.security;

import java.util.*;

public class Permissions {
    public static final String ADMIN = "Admin";
    public static final String HR = "HR";
    public static final String RECRUITER = "Recruiter";
    public static final String HIRING_MANAGER = "Hiring Manager";
    public static final String INTERVIEWER = "Interviewer";
    public static final String CANDIDATE = "Candidate";

    public static final String TEAM_VIEW = "TEAM_VIEW";
    public static final String TEAM_INVITE = "TEAM_INVITE";
    public static final String TEAM_UPDATE_ROLE = "TEAM_UPDATE_ROLE";
    public static final String TEAM_DEACTIVATE = "TEAM_DEACTIVATE";
    public static final String TEAM_REMOVE = "TEAM_REMOVE";

    public static final String JOB_VIEW = "JOB_VIEW";
    public static final String JOB_CREATE = "JOB_CREATE";
    public static final String JOB_UPDATE = "JOB_UPDATE";
    public static final String JOB_DELETE = "JOB_DELETE";
    public static final String JOB_PUBLISH = "JOB_PUBLISH";
    public static final String JOB_ASSIGN_TEAM = "JOB_ASSIGN_TEAM";

    public static final String CANDIDATE_VIEW = "CANDIDATE_VIEW";
    public static final String CANDIDATE_UPDATE = "CANDIDATE_UPDATE";

    public static final String APPLICATION_VIEW = "APPLICATION_VIEW";
    public static final String APPLICATION_UPDATE = "APPLICATION_UPDATE";
    public static final String APPLICATION_MOVE_PIPELINE = "APPLICATION_MOVE_PIPELINE";

    public static final String AI_ANALYSIS_VIEW = "AI_ANALYSIS_VIEW";
    public static final String AI_ANALYSIS_RUN = "AI_ANALYSIS_RUN";

    public static final String INTERVIEW_VIEW = "INTERVIEW_VIEW";
    public static final String INTERVIEW_CREATE = "INTERVIEW_CREATE";
    public static final String INTERVIEW_UPDATE = "INTERVIEW_UPDATE";
    public static final String INTERVIEW_CANCEL = "INTERVIEW_CANCEL";
    public static final String INTERVIEW_FEEDBACK_SUBMIT = "INTERVIEW_FEEDBACK_SUBMIT";

    public static final String ANALYTICS_VIEW = "ANALYTICS_VIEW";
    public static final String REPORT_GENERATE = "REPORT_GENERATE";
    public static final String DATA_EXPORT = "DATA_EXPORT";

    public static final String COMMUNICATION_VIEW = "COMMUNICATION_VIEW";
    public static final String COMMUNICATION_SEND = "COMMUNICATION_SEND";
    public static final String TEMPLATE_MANAGE = "TEMPLATE_MANAGE";

    public static final String ORGANIZATION_VIEW = "ORGANIZATION_VIEW";
    public static final String ORGANIZATION_UPDATE = "ORGANIZATION_UPDATE";

    public static final String AUDIT_LOG_VIEW = "AUDIT_LOG_VIEW";
    public static final String SYSTEM_INFO_VIEW = "SYSTEM_INFO_VIEW";

    private static final Map<String, Set<String>> ROLE_PERMISSIONS = new HashMap<>();

    static {
        Set<String> all = new HashSet<>(Arrays.asList(
            TEAM_VIEW, TEAM_INVITE, TEAM_UPDATE_ROLE, TEAM_DEACTIVATE, TEAM_REMOVE,
            JOB_VIEW, JOB_CREATE, JOB_UPDATE, JOB_DELETE, JOB_PUBLISH, JOB_ASSIGN_TEAM,
            CANDIDATE_VIEW, CANDIDATE_UPDATE,
            APPLICATION_VIEW, APPLICATION_UPDATE, APPLICATION_MOVE_PIPELINE,
            AI_ANALYSIS_VIEW, AI_ANALYSIS_RUN,
            INTERVIEW_VIEW, INTERVIEW_CREATE, INTERVIEW_UPDATE, INTERVIEW_CANCEL, INTERVIEW_FEEDBACK_SUBMIT,
            ANALYTICS_VIEW, REPORT_GENERATE, DATA_EXPORT,
            COMMUNICATION_VIEW, COMMUNICATION_SEND, TEMPLATE_MANAGE,
            ORGANIZATION_VIEW, ORGANIZATION_UPDATE,
            AUDIT_LOG_VIEW, SYSTEM_INFO_VIEW
        ));
        ROLE_PERMISSIONS.put(ADMIN, all);

        Set<String> hrRecruiter = new HashSet<>(Arrays.asList(
            TEAM_VIEW, JOB_VIEW, JOB_CREATE, JOB_UPDATE, JOB_PUBLISH, JOB_ASSIGN_TEAM,
            CANDIDATE_VIEW, CANDIDATE_UPDATE, APPLICATION_VIEW, APPLICATION_UPDATE, APPLICATION_MOVE_PIPELINE,
            AI_ANALYSIS_VIEW, AI_ANALYSIS_RUN, INTERVIEW_VIEW, INTERVIEW_CREATE, INTERVIEW_UPDATE, INTERVIEW_CANCEL, INTERVIEW_FEEDBACK_SUBMIT,
            ANALYTICS_VIEW, REPORT_GENERATE, DATA_EXPORT, COMMUNICATION_VIEW, COMMUNICATION_SEND, TEMPLATE_MANAGE, ORGANIZATION_VIEW
        ));
        ROLE_PERMISSIONS.put(HR, hrRecruiter);
        ROLE_PERMISSIONS.put(RECRUITER, hrRecruiter);

        Set<String> hiringManager = new HashSet<>(Arrays.asList(
            JOB_VIEW, CANDIDATE_VIEW, APPLICATION_VIEW, AI_ANALYSIS_VIEW, INTERVIEW_VIEW, INTERVIEW_FEEDBACK_SUBMIT, ANALYTICS_VIEW, COMMUNICATION_VIEW, ORGANIZATION_VIEW
        ));
        ROLE_PERMISSIONS.put(HIRING_MANAGER, hiringManager);

        Set<String> interviewer = new HashSet<>(Arrays.asList(
            INTERVIEW_VIEW, INTERVIEW_FEEDBACK_SUBMIT, ORGANIZATION_VIEW
        ));
        ROLE_PERMISSIONS.put(INTERVIEWER, interviewer);

        Set<String> candidate = new HashSet<>(Arrays.asList(
            JOB_VIEW
        ));
        ROLE_PERMISSIONS.put(CANDIDATE, candidate);
    }

    public static boolean hasPermission(String role, String permission) {
        Set<String> perms = ROLE_PERMISSIONS.get(role);
        return perms != null && perms.contains(permission);
    }
}

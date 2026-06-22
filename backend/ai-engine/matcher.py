def calculate_score(

        candidate_skills,

        job_skills

):

    matched_skills = []

    for skill in candidate_skills:

        if skill in job_skills:

            matched_skills.append(skill)

    score = (

        len(matched_skills)

        /

        len(job_skills)

    ) * 100

    return score
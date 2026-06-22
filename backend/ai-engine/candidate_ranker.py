
import json
import os

from resume_parser import (
    extract_text_from_pdf,
    get_latest_resume
)

from skill_extractor import extract_skills

from tfidf_matcher import calculate_match_score


BASE_DIR = os.path.dirname(

    os.path.abspath(__file__)

)


# Latest Resume

resume_path = get_latest_resume()


# Latest JD

jd_folder = os.path.join(

    BASE_DIR,

    "..",

    "uploads",

    "JD"

)

jd_files = [

    file

    for file in os.listdir(jd_folder)

    if file.endswith(".pdf")

]

jd_path = os.path.join(

    jd_folder,

    jd_files[-1]

)


# Extract Text

resume_text = extract_text_from_pdf(

    resume_path

)

jd_text = extract_text_from_pdf(

    jd_path

)


# Skills

resume_skills = extract_skills(

    resume_text

)

jd_skills = extract_skills(

    jd_text

)


# Match Score

match_score = calculate_match_score(

    resume_text,

    jd_text

)


candidate = {

    "resume_skills":

    resume_skills,

    "job_skills":

    jd_skills,

    "match_score":

    round(match_score,2)

}


with open(

    "ranked_candidates.json",

    "w"

) as file:

    json.dump(

        candidate,

        file,

        indent=4

    )


print(

    "\nCandidate Ranking Completed"

)

print(

    "Match Score =",

    match_score,

    "%"

)

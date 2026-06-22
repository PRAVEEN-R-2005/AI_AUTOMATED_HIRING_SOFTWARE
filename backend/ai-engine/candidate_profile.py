
import os
import re
import json

from resume_parser import (
    get_latest_resume,
    extract_text_from_pdf
)

from skill_extractor import extract_skills


# ==================================
# Latest Resume
# ==================================

resume_path = get_latest_resume()

resume_text = extract_text_from_pdf(

    resume_path

)


# ==================================
# Name
# ==================================

lines = resume_text.split("\n")

name = lines[0].strip()


# ==================================
# Email
# ==================================

email = re.findall(

    r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',

    resume_text

)


# ==================================
# Phone
# ==================================

phone = re.findall(

    r'\+91\s?\d{10}|\d{10}',

    resume_text

)


# ==================================
# Skills
# ==================================

skills = extract_skills(

    resume_text

)


# ==================================
# Candidate Dictionary
# ==================================

candidate = {

    "name":

    name,

    "email":

    email[0] if email else "",

    "phone":

    phone[0] if phone else "",

    "skills":

    skills

}


# ==================================
# Save JSON
# ==================================

with open(

    "candidate_profile.json",

    "w"

) as file:

    json.dump(

        candidate,

        file,

        indent=4

    )


print(

    "\nCandidate Profile JSON Created Successfully"

)

print(

    resume_text

)

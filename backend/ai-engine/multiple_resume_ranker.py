import os
import re
import json
import PyPDF2

from skill_extractor import extract_skills
from matcher import calculate_score


job_skills = [

    "Python",
    "SQL",
    "REST API",
    "Git",
    "Machine Learning"

]


BASE_DIR = os.path.dirname(

    os.path.abspath(__file__)

)

folder_path = os.path.join(

    BASE_DIR,

    "..",

    "uploads",

    "resumes"

)

folder_path = os.path.abspath(

    folder_path

)


pdf_files = [

    file

    for file in os.listdir(folder_path)

    if file.endswith(".pdf")

]


all_candidates = []


for pdf in pdf_files:

    pdf_path = os.path.join(

        folder_path,

        pdf

    )

    text = ""

    with open(

        pdf_path,

        "rb"

    ) as file:

        reader = PyPDF2.PdfReader(file)

        for page in reader.pages:

            extracted = page.extract_text()

            if extracted:

                text += extracted


    lines = text.split("\n")

    name = lines[0].strip()


    email = re.findall(

        r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',

        text

    )


    phone = re.findall(

        r'\+91\s?\d{10}|\d{10}',

        text

    )


    skills = extract_skills(

        text

    )


    score = calculate_score(

        skills,

        job_skills

    )


    candidate = {

        "name": name,

        "email": email[0] if email else "",

        "phone": phone[0] if phone else "",

        "skills": skills,

        "match_score": round(

            score,

            2

        )

    }


    all_candidates.append(

        candidate

    )


all_candidates.sort(

    key=lambda x: x["match_score"],

    reverse=True

)


print(

    "\n===== Ranked Candidates =====\n"

)


for candidate in all_candidates:

    print(

        candidate["name"],

        "→",

        candidate["match_score"],

        "%"

    )


with open(

    "ranked_candidates.json",

    "w"

) as file:

    json.dump(

        all_candidates,

        file,

        indent=4

    )
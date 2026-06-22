
def extract_skills(text):

    skills_list = [

        "Python",
        "Java",
        "SQL",
        "Spring Boot",
        "REST API",
        "MySQL",
        "Git",
        "GitHub",
        "Postman",
        "VS Code",
        "Jupyter Notebook",
        "OOP",
        "Data Structures",
        "DBMS",
        "API Integration",
        "Machine Learning",
        "Deep Learning",
        "NLP",
        "React",
        "Node.js",
        "Express.js",
        "MongoDB",
        "HTML",
        "CSS",
        "JavaScript"

    ]

    found_skills = []

    for skill in skills_list:

        if skill.lower() in text.lower():

            found_skills.append(

                skill

            )

    return list(

        set(found_skills)

    )

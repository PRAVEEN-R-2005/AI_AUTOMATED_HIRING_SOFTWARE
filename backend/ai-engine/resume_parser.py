
import os
import PyPDF2


def extract_text_from_pdf(file_path):

    text = ""

    with open(file_path, "rb") as file:

        reader = PyPDF2.PdfReader(file)

        for page in reader.pages:

            extracted = page.extract_text()

            if extracted:

                text += extracted

    return text


def get_latest_resume():

    BASE_DIR = os.path.dirname(

        os.path.abspath(__file__)

    )

    resume_folder = os.path.join(

        BASE_DIR,

        "..",

        "uploads",

        "resumes"

    )

    pdf_files = [

        file

        for file in os.listdir(resume_folder)

        if file.endswith(".pdf")

    ]

    latest_resume = os.path.join(

        resume_folder,

        pdf_files[-1]

    )

    return latest_resume


if __name__ == "__main__":

    resume_path = get_latest_resume()

    text = extract_text_from_pdf(

        resume_path

    )

    print(text)

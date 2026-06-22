
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def calculate_match_score(resume_text, jd_text):

    documents = [

        resume_text,

        jd_text

    ]

    vectorizer = TfidfVectorizer()

    tfidf_matrix = vectorizer.fit_transform(

        documents

    )

    similarity = cosine_similarity(

        tfidf_matrix[0:1],

        tfidf_matrix[1:2]

    )

    score = round(

        similarity[0][0] * 100,

        2

    )

    return score

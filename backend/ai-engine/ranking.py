candidates = [

    {

        "name": "Praveen",

        "score": 95

    },

    {

        "name": "Rahul",

        "score": 80

    },

    {

        "name": "Kumar",

        "score": 70

    }

]

candidates.sort(

    key=lambda x: x["score"],

    reverse=True

)

print(candidates)
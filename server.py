import pandas as pd
from flask import Flask, request
import json

from nltk.tokenize import RegexpTokenizer
from nltk.corpus import stopwords
tokenizer = RegexpTokenizer(r'\w+')

# Read the CSV file into a DataFrame
df = pd.read_csv('Dataset.csv')

# Setup flask server
app = Flask(__name__)

# @app.route('/generaterank', methods=['POST'])
# def rank_generator():
#     data = request.get_json()

#     job_description = data[0]
#     list1 = ['description', 'skills']
#     list2 = []
#     for key in job_description:
#         for i in key:
#             if i in list1:
#                 job_d = tokenizer.tokenize(key[i])
#                 for i in job_d:
#                     list2.append(i)

#     resumes = data[1]
#     list3 = ['skill', 'project', 'internship']
#     list5 = []
#     for key in resumes:
#         list4 = []
#         for i in key:
#             if i in list3:
#                 job_d = tokenizer.tokenize(key[i])
#                 for i in job_d:
#                     list4.append(i)
#         list5.append({key['userId']: list4})

#     score = []
#     for i in list5:
#         for j in i:
#             count = 0
#             for k in i[j]:
#                 if k in list2:
#                     count = count+1
#             print(count)
#             score.append({j: count})

#     print(score)

#     return score


@app.route('/generate-static-rank', methods=['POST'])
def static_rank_generator():
    # Define a function to split the Skills column into a list of skills
    def split_skills(row):
        return row.split(',')

    # Apply the split_skills function to the Skills column and concatenate the lists
    skills = df['Skills'].apply(split_skills).sum()

    data = request.get_json()
    resumes = data[0]
    list3 = ['skill', 'project', 'internship', 'certification']
    list5 = []
    for key in resumes:
        list4 = []
        for i in key:
            if i in list3:
                job_d = tokenizer.tokenize(key[i])
                for i in job_d:
                    list4.append(i)
        list5.append({key['userId']: list4})
    score = []

    for i in list5:
        count = 0
        list = []
        for j in i:
            for skill in i[j]:
                if skill in skills:
                    count = count+1
        list.append({j: count})
        if (count < 5):
            list.append({'feedback': 'need to work on skills'})
        else:
            list.append({'feedback': 'profile looks good'})
        score.append(list)

    print(score)
    return score


if __name__ == "__main__":
    app.run(port=5000)

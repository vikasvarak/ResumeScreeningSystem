from nltk.cluster import util
import pandas as pd
from flask import Flask, request
import json

from nltk.tokenize import RegexpTokenizer
from nltk.corpus import stopwords
tokenizer = RegexpTokenizer(r'\w+')


# Read the CSV file into a DataFrame
df = pd.read_csv('updated-dataset.csv')

# Setup flask server
app = Flask(__name__)


@app.route('/generate-dynamic-rank', methods=['POST'])
def rank_generator():
    data = request.get_json()
    job_description = data[0]
    jobd_vector = []
    skills = tokenizer.tokenize(job_description['skills'])
    jobd_vector = jobd_vector + skills
    description = tokenizer.tokenize(job_description['description'])
    jobd_vector = jobd_vector + description

    # resume vector
    resumes = data[1]
    resume_vector = []
    result = []
    for resume in resumes:
        skills = tokenizer.tokenize(resume['skill'])
        resume_vector = resume_vector + skills
        for project in resume['projects']:
            project_token = tokenizer.tokenize(project)
            resume_vector = resume_vector + project_token
        for certification in resume['certifications']:
            certification_token = tokenizer.tokenize(certification)
            resume_vector = resume_vector + certification_token
        for internship in resume['internships']:
            for intern in internship:
                internship_token = tokenizer.tokenize(intern)
                resume_vector = resume_vector + internship_token
        unique_tokens = set(resume_vector).union(set(jobd_vector))
        vec1 = [1 if token in resume_vector else 0 for token in unique_tokens]
        vec2 = [1 if token in jobd_vector else 0 for token in unique_tokens]

        similarity = 1 - util.cosine_distance(vec1, vec2)
        result.append({'userId': resume['userId'], 'similarity': similarity})
    print(result)
    return result


@app.route('/generate-static-rank', methods=['POST'])
def static_rank_generator():
    # Define a function to split the Skills column into a list of skills
    def split_skills(row):
        return row.split(',')

    # Apply the split_skills function to the Skills column and concatenate the lists
    skil = df['Skills'].apply(split_skills).sum()
    proj = df['Project'].apply(split_skills).sum()
    interns = df['Internship'].apply(split_skills).sum()
    certi = df['Certification'].apply(split_skills).sum()

    data = request.get_json()
    resumes = data[0]

    tokenized_resume = []
    for resume in resumes:
        skills = tokenizer.tokenize(resume['skill'])
        projects = []
        for project in resume['projects']:
            project_token = tokenizer.tokenize(project)
            projects = projects + project_token
        certifications = []
        for certification in resume['certifications']:
            certification_token = tokenizer.tokenize(certification)
            certifications = certifications + certification_token
        internships = []
        for internship in resume['internships']:
            for intern in internship:
                internship_token = tokenizer.tokenize(intern)
                internships = internships + internship_token
        result = {'userId': resume['userId'],
                  'skill': skills, 'project': projects, 'certification': certifications, 'internship': internships}
        tokenized_resume.append(result)

    score = []
    for resume in tokenized_resume:
        list = []
        count = 0
        for sk in resume['skill']:
            if sk.lower() in skil:
                count = count+1
        for pr in resume['project']:
            if pr.lower() in proj:
                count = count+1
        for cr in resume['certification']:
            if cr.lower() in certi:
                count = count+1
        for ip in resume['internship']:
            if ip.lower() in interns:
                count = count+1
        list.append({'id': resume['userId']})
        list.append({'skill_count': count})
        if (count < 5):
            list.append({'feedback': 'need to work on skills'})
        else:
            list.append({'feedback': 'profile looks good'})
        score.append(list)

    # print(score)
    return score


if __name__ == "__main__":
    app.run(port=5000)

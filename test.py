import requests

request = requests.get('https://www.xataka.com/ecologia-y-naturaleza/parecia-imposible-que-lluvias-marzo-fueran-mala-noticia-para-alguien-que-llegaron-sandias-melones')

#export request.text to txt file
with open('request.txt', 'w') as file:
    file.write(request.text)

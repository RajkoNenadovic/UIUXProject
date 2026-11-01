import os
from flask import Flask

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key')

@app.route('/')
def home():
    return "<h1>Plain Language Layer — Decoding Institutional Text</h1>"

if __name__ == '__main__':
    app.run(debug=True, port=5000)
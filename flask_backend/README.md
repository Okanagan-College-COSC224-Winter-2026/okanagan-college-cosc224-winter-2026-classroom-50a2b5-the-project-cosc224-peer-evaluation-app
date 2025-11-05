# Practice Implementing a Flask Application Using MVC

This project aims to implement a Flask application using the MVC architecture.

## How to Install the Project

Make sure that Python 3 is installed on your system. Create a Python virtual environment using the following command:

```
python3 -m venv venv
```
Then, activate the virtual environment using the following command:

```
source venv/bin/activate
```
After activating the virtual environment, install the project and its requirements:

```
pip install -e .
```

```
pip install -r requirements-dev.txt
```

Set the environment variable:

```
export FLASK_APP=api
```
execute the following commands to create the database and add some values to it

```
flask init_db
```
```
flask add_members
```
run the project:

```
flask run
```
## The structure of the project (In the following tree, only important entities are listed)
```
├── api
│   ├── cli
│   ├── controllers
│   ├── models
│   ├── __init__.py
│   ├── config.py
├── tests
├── .gitignore
├── setup.py
├── requirements-dev.txt

```
In the current directory, you can find the files required to install the project, such as `requirements-dev.txt`, `setup.py`, etc., as well as two directories: `tests` and `api`. The tests directory is a package designed to implement test-driven development. You can use the examples in this package to implement your own tests. The main Flask application is implemented inside the api package. The structure of the api package is as follows:
```
├── api
│   ├── cli
│   ├── controllers
│   ├── models
│   ├── __init__.py
│   ├── config.py
```
Inside the `__init__.py` file, the Flask application is configured. In this file, you need to import and register your controllers (routes).

## Let’s Add a New Controller to This Project

Inside the controllers package, create a new file, such as test.py, at api/controllers/test.py.

Now paste the following code into this file:


```python
from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for,
    jsonify
)


test = Blueprint('test', __name__)


@test.route('/test', methods=('POST', 'GET'))
def get_scanner():
    if request.method == 'GET':
        return jsonify(
            [
              {
                "test": True
              }
            ]
        ), 200
```
then, go to the `api/__init__.py` and import `test_api`.

```python
from .controllers import auth, member, fake_api, test_api
```
**Note: The import already exists; you only need to import test_api.**

Register the controller inside the create_app function after init_app(app).

```python
app.register_blueprint(test_api.test)
```
**Note: check the auth.py file inside the `controllers` package to see how we can implement authentication**


## Let’s Add a New model to This Project
Make a new file name `example_model.py` inside the `api/models` package. 
paste the following code inside this file:

```python
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship


from .db import Base, session, ma


class Example(Base):
    __tablename__ = 'examples'

    id = Column(Integer, primary_key=True)
    name = Column(String)

    def __init__(self, name):

        self.name = name

class ExampleSchema(ma.Schema):


    class Meta:
        fields = (
            "id",
            "name"
        )
```
Now, inside `models/__init__.py` import this new model.

```python
from .example_model import Example
```
Destroy the previous database (if you are using SQLite, then just remove the file) and run 

```
flaks init_db
```


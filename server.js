const http = require('http');
const fs = require('fs');
const url = require('url');
const uuid = require('uuid');

const DATABASE_FILE_PATH = '/tasks.json';

/** Read todos from file and returns it */
function readFromFile(pathname) {
  try {
    const todosFromFile = fs.readFileSync(
      pathname.substr(1),
      function (err, data) {
        if (err) console.log(err);
      }
    );
    return JSON.parse(todosFromFile.toString());
  } catch (error) {
    console.log(error);
    return;
  }
}

/** Read todos from file and returns it */
function writeOnFile(pathname, data) {
  try {
    const todosFromFile = fs.writeFileSync(pathname.substr(1), data);
  } catch (error) {
    console.log(error);
    return;
  }
}

/** handle GET request */
function getHandler(req, res, reqUrl) {
  const todos = readFromFile(DATABASE_FILE_PATH);

  res.writeHead(todos ? 200 : 404, {
    'Content-Type': 'text/html',
    'Access-Control-Allow-Origin': '*',
  });

  todos && res.write(JSON.stringify(todos));
  res.end();
}

/** handle POST request */
function postHandler(req, res, reqUrl) {
  req.setEncoding('utf8');

  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString(); // convert Buffer to string
  });

  req.on('end', () => {
    try {
      let todoToBeSaved = JSON.parse(body);
      todoToBeSaved = {
        ...todoToBeSaved,
        id: uuid.v4(),
      };

      const currentTodos = readFromFile(DATABASE_FILE_PATH);
      if (!currentTodos) throw new Error();

      writeOnFile(
        DATABASE_FILE_PATH,
        JSON.stringify([...currentTodos, todoToBeSaved])
      );

      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
      });
      res.write(JSON.stringify(todoToBeSaved));
    } catch (error) {
      res.writeHead(500, {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
      });
      res.write(JSON.stringify(error.toString()));
    }
    res.end();
  });
}

/** if there is no related function which handles the request, then show error message */
function noResponse(req, res) {
  res.writeHead(404);
  res.write('Sorry, but we have no response..\n');
  res.end();
}

http
  .createServer((req, res) => {
    // create an object for all redirection options
    const router = {
      'GET/todos': getHandler,
      'POST/todos': postHandler,
      'PUT/todos': getHandler,
      'PUT/todos': getHandler,
      'DELETE/todos': getHandler,
      default: noResponse,
    };
    // parse the url by using WHATWG URL API
    let reqUrl = new URL(req.url, 'http://127.0.0.1/');

    // find the related function by searching "method + pathname" and run it
    let redirectedFunc =
      router[req.method + reqUrl.pathname] || router['default'];
    redirectedFunc(req, res, reqUrl);
  })
  .listen(8080, () => {
    console.log('Server is running at http://127.0.0.1:8080/');
  });

const http = require('http');
const fs = require('fs');
const url = require('url');
const { v4: uuid } = require('uuid');

const DATABASE_FILE_PATH = '/tasks.json';

const headers = {
  'Content-Type': 'application/json, text/html, */*',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
  'Access-Control-Allow-Headers':
    'Content-Type,Authorization,Access-Control-Allow-Origin',
};

function validateUUID(id) {
  const pattern =
    /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
  return pattern.test(id);
}

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

function getIdFromPathname(pathname) {
  const [_, id] = pathname.split('/todos/');
  return id || '';
}

/** handle GET request */
function getHandler(req, res, reqUrl) {
  const todos = readFromFile(DATABASE_FILE_PATH);

  res.writeHead(todos ? 200 : 404, headers);

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
        id: uuid(),
      };

      const currentTodos = readFromFile(DATABASE_FILE_PATH);
      if (!currentTodos) throw new Error();

      writeOnFile(
        DATABASE_FILE_PATH,
        JSON.stringify([...currentTodos, todoToBeSaved])
      );

      res.writeHead(200, headers);
      res.write(JSON.stringify(todoToBeSaved));
    } catch (error) {
      res.writeHead(500, headers);
      res.write(JSON.stringify(error.toString()));
    }
    res.end();
  });
}

/** handle PUT request */
function putHandler(req, res, reqUrl) {
  req.setEncoding('utf8');

  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString(); // convert Buffer to string
  });

  req.on('end', () => {
    try {
      let todoToBeUpdated = JSON.parse(body);

      const currentTodos = readFromFile(DATABASE_FILE_PATH);
      if (!currentTodos) throw new Error();

      const foundTodoIndex = currentTodos.findIndex(
        (todo) => todo.id === todoToBeUpdated.id
      );

      if (foundTodoIndex === -1) {
        res.writeHead(404, headers);
        res.end();
        return;
      }

      const newTodos = currentTodos.map((todo) =>
        todo.id === todoToBeUpdated.id ? todoToBeUpdated : todo
      );

      writeOnFile(DATABASE_FILE_PATH, JSON.stringify(newTodos));

      res.writeHead(200, headers);

      res.write(JSON.stringify(todoToBeUpdated));
    } catch (error) {
      res.writeHead(500, headers);
      res.write(JSON.stringify(error.toString()));
    }
    res.end();
  });
}

/** handle PATCH request */
function patchHandler(req, res, reqUrl) {
  req.setEncoding('utf8');

  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString(); // convert Buffer to string
  });

  req.on('end', () => {
    try {
      let todoToBeUpdated = JSON.parse(body);

      const currentTodos = readFromFile(DATABASE_FILE_PATH);
      if (!currentTodos) throw new Error();

      const foundTodo = currentTodos.find(
        (todo) => todo.id === todoToBeUpdated.id
      );

      if (!foundTodo) {
        res.writeHead(404, headers);
        res.end();
        return;
      }

      todoToBeUpdated = {
        ...foundTodo,
        ...todoToBeUpdated,
      };

      const newTodos = currentTodos.map((todo) =>
        todo.id === todoToBeUpdated.id ? todoToBeUpdated : todo
      );

      writeOnFile(DATABASE_FILE_PATH, JSON.stringify(newTodos));

      res.writeHead(200, headers);

      res.write(JSON.stringify(todoToBeUpdated));
    } catch (error) {
      res.writeHead(500, headers);
      res.write(JSON.stringify(error.toString()));
    }
    res.end();
  });
}

/** handle DELETE request */
function deleteHandler(req, res, reqUrl) {
  const id = getIdFromPathname(reqUrl.pathname);

  const todos = readFromFile(DATABASE_FILE_PATH);

  const foundTodo = todos.findIndex((todo) => todo.id === id);
  if (foundTodo !== -1) {
    const newTodos = todos.filter((todo) => todo.id !== id);
    writeOnFile(DATABASE_FILE_PATH, JSON.stringify(newTodos));
  }

  res.writeHead(foundTodo !== -1 ? 200 : 404, headers);

  res.end();
}

/** handle OPTION request */
function optionsHandler(req, res, reqUrl) {
  const id = getIdFromPathname(reqUrl.pathname);
  res.writeHead(200, headers);
  res.end();
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
      GET: {
        validate: (pathname) => pathname.match(/\/todos/),
        handler: getHandler,
      },
      POST: {
        validate: (pathname) => pathname.match(/\/todos/),
        handler: postHandler,
      },
      PUT: {
        validate: (pathname) => pathname.match(/\/todos/),
        handler: putHandler,
      },
      PATCH: {
        validate: (pathname) => pathname.match(/\/todos/),
        handler: patchHandler,
      },
      DELETE: {
        validate: (pathname) => {
          if (!pathname.includes('/todos/')) return false;
          const id = getIdFromPathname(pathname);
          return validateUUID(id);
        },
        handler: deleteHandler,
      },
      OPTIONS: {
        validate: (pathname) => pathname.match(/\/todos/),
        handler: optionsHandler,
      },
    };
    // parse the url by using WHATWG URL API
    let reqUrl = new URL(req.url, 'http://127.0.0.1/');

    // find the related function by searching "method + pathname" and run it
    const reqMethod = router[req.method];

    if (reqMethod && reqMethod.validate(reqUrl.pathname)) {
      reqMethod.handler(req, res, reqUrl);
    } else {
      noResponse(req, res, reqUrl);
    }
  })
  .listen(8080, () => {
    console.log('Server is running at http://127.0.0.1:8080/');
  });

/* START -  Drag And Drop */
const cards = document.querySelectorAll(".card");
const dropzones = document.querySelectorAll(".dropzone");

// Cards
cards.forEach(addCardDragEvents);

function addCardDragEvents(card) {
  card.addEventListener("dragstart", handleDragStart);
  card.addEventListener("drag", handleDrag);
  card.addEventListener("dragend", handleDragEnd);
}

function handleDragStart() {
  this.classList.add("is-dragging");
}

function handleDrag() {}

function handleDragEnd() {
  this.classList.remove("is-dragging");
}

// Dropzones
dropzones.forEach(addDropzonesDragEvents);

function addDropzonesDragEvents(dropzone) {
  dropzone.addEventListener("dragenter", handleDragEnter);
  dropzone.addEventListener("dragover", handleDragOver);
  dropzone.addEventListener("dragleave", handleDragLeave);
  dropzone.addEventListener("drop", handleDrop);
}

function handleDragEnter() {}

function handleDragOver() {
  const cardBeingDragged = document.querySelector(".is-dragging");
  if (cardBeingDragged) this.appendChild(cardBeingDragged);
}

function handleDragLeave() {}

function handleDrop() {}

/* END -  Drag And Drop */

/* START -  Todo actions */

const newTodoForm = document.querySelector("form");
const formFields = ["id", "name", "description", "assignee", "deadline"];

function removeTodo(e) {
  const cardToRemove = e.target?.parentNode?.parentNode;
  if (cardToRemove) cardToRemove.remove();
}

function addNewTaskToTheDOM(task) {
  const todoBoard = document.querySelectorAll(".board")[0];
  const newTodoCard = document.createElement("div");

  newTodoCard.setAttribute("class", "card");
  newTodoCard.setAttribute("draggable", "true");
  newTodoCard.setAttribute("id", task.id);

  newTodoCard.innerHTML = `
  <header>
  <h4 class="name">${task.name}</h4>
  <span class="assignee">${task.assignee}</span>
  <span class="deadline">${task.deadline}</span>
  </header>
  
  <p class="description">${task.description}</p>
  
  <div>
  <button class="edit" type="button" onclick="editTodo(event)">Editar</button>
  <button class="remove" type="button" onclick="removeTodo(event)">Excluir</button>
  </div>
  `;

  addCardDragEvents(newTodoCard);
  todoBoard.querySelector(".dropzone").appendChild(newTodoCard);

  newTodoForm.reset();
}

function editTaskOnTheDOM(task) {
  const todoBoard = document.querySelectorAll(".board")[0];
  const todoCard = document.querySelector(`.card#${task.id}`);

  formFields.forEach((field) => {
    if (field === "id") return;
    todoCard.querySelector(`.${field}`).innerHTML = task[field];
  });

  newTodoForm.reset();
}

function editTodo(e) {
  const cardToEdit = e.target?.parentNode?.parentNode;

  // Put card to edit data into the form values
  const id = cardToEdit.getAttribute("id");
  const name = cardToEdit.querySelector(".name").innerHTML;
  const assignee = cardToEdit.querySelector(".assignee").innerHTML;
  const deadline = cardToEdit.querySelector(".deadline").innerHTML;
  const description = cardToEdit.querySelector(".description").innerHTML;

  const taskToEdit = { id, name, assignee, deadline, description };

  formFields.forEach((field) => {
    newTodoForm.querySelector(`#${field}`).value = taskToEdit[field];
  });

  // Disable card actions and add aditing class to the form
  cardToEdit.querySelector(".edit").setAttribute("disabled", "true");
  cardToEdit.querySelector(".remove").setAttribute("disabled", "true");
  cardToEdit.setAttribute("draggable", "false");
  newTodoForm.classList.add("editing");
}

function handleSubmit(e) {
  e.preventDefault();
  const isEditing = !!e.target[0].value;

  const id = e.target[0].value || `card-${Date.now()}`;
  const name = e.target[1].value.trim();
  const description = e.target[2].value.trim();
  const assignee = e.target[3].value.trim();
  const deadline = e.target[4].value;
  const task = { id, name, description, assignee, deadline };

  if (Object.values(task).filter((value) => !!value).length < 4) {
    alert("Preencha todos os campos");
    return;
  }

  if (new Date(task.deadline).getTime() < new Date().getTime()) {
    alert("Insira uma data posterior a data atual");
    return;
  }

  if (isEditing) {
    editTaskOnTheDOM(task);
  } else {
    addNewTaskToTheDOM(task);
  }
}

newTodoForm.addEventListener("submit", handleSubmit);

/* LOAD TASKS FROM SERVER */

function loadTaksFromServer() {
  const taskRequest = new XMLHttpRequest();

  taskRequest.open("GET", "http://localhost:8081/tasks.json");

  taskRequest.onload = function () {
    console.log("Conectou... Status: " + taskRequest.status);
    if (taskRequest.status >= 200 && taskRequest.status < 400) {
      const taskList = JSON.parse(taskRequest.responseText);
      taskList.forEach((task) => addNewTaskToTheDOM(task));
    } else {
      console.log("Servidor ativo, mas ocorreu um erro!");
    }
  };

  taskRequest.onerror = function () {
    console.log("Erro de conexão");
  };
  taskRequest.send();
}

window.onload = loadTaksFromServer;

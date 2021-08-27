/* START -  Drag And Drop */
const cards = document.querySelectorAll('.card');
const dropzones = document.querySelectorAll('.dropzone');

// Cards
cards.forEach(addCardDragEvents);

function addCardDragEvents(card) {
  card.addEventListener('dragstart', handleDragStart);
  card.addEventListener('drag', handleDrag);
  card.addEventListener('dragend', handleDragEnd);
}

function handleDragStart() {
  this.classList.add('is-dragging');
}

function handleDrag() {}

function handleDragEnd() {
  this.classList.remove('is-dragging');
}

// Dropzones
dropzones.forEach(addDropzonesDragEvents);

function addDropzonesDragEvents(dropzone) {
  dropzone.addEventListener('dragenter', handleDragEnter);
  dropzone.addEventListener('dragover', handleDragOver);
  dropzone.addEventListener('dragleave', handleDragLeave);
  dropzone.addEventListener('drop', handleDrop);
}

function handleDragEnter() {}

function handleDragOver() {
  const cardBeingDragged = document.querySelector('.is-dragging');
  if (cardBeingDragged) this.appendChild(cardBeingDragged);
}

function handleDragLeave() {}

function handleDrop() {}

/* END -  Drag And Drop */

/* START -  Todo actions */

let todoForm = document.querySelector('form');
const formFields = ['id', 'name', 'description', 'assignee', 'deadline'];

$('#taskModal').on('hide.bs.modal', () => todoForm.reset());

function addNewTaskToTheDOM(task) {
  const newTodoCard = document.createElement('div');

  newTodoCard.setAttribute('class', 'card');
  newTodoCard.setAttribute('draggable', 'true');
  newTodoCard.setAttribute('id', task.id);

  newTodoCard.innerHTML = `
  <header class="header">
    <span class="status d-none">${task.status}</span>
    <h4 class="name">${task.name}</h4>
    <span class="assignee">${task.assignee}</span>
    <span class="deadline">${task.deadline}</span>
  </header>
  
  <p class="description">${task.description}</p>
  
  <div>
    <!-- Button trigger task form modal -->
    <button type="button" class="btn" data-bs-toggle="modal" data-bs-target="#taskModal" onclick="handleClickEditTask(event)">
      <i class="fas fa-edit"></i>
    </button>

    <!-- Button trigger remove task modal -->
    <button type="button" class="btn" onclick="handleRemoveTask(event)">
      <i class="fas fa-trash"></i>
    </button>
  </div>
  `;

  addCardDragEvents(newTodoCard);

  document
    .querySelector(`#${task.status}-column .dropzone`)
    ?.appendChild(newTodoCard);
}

function editTaskInTheDOM(task) {
  const cardToEdit = document.getElementById(task.id);

  if (!cardToEdit) return;

  cardToEdit.querySelector('.status').innerHTML = task.status;
  cardToEdit.querySelector('.name').innerHTML = task.name;
  cardToEdit.querySelector('.description').innerHTML = task.description;
  cardToEdit.querySelector('.assignee').innerHTML = task.assignee;
  cardToEdit.querySelector('.deadline').innerHTML = task.deadline;
}

function fillFormWithEditingTask(task) {
  Object.values(task).forEach((value, index) => {
    todoForm[index].value = value;
  });
}

function handleClickEditTask(e) {
  const cardToEdit = e.delegateTarget?.parentNode?.parentNode;

  // Put card to edit data into the form values
  const id = cardToEdit.getAttribute('id');
  const status = cardToEdit.querySelector('.status').innerHTML;
  const name = cardToEdit.querySelector('.name').innerHTML;
  const assignee = cardToEdit.querySelector('.assignee').innerHTML;
  const deadline = cardToEdit.querySelector('.deadline').innerHTML;
  const description = cardToEdit.querySelector('.description').innerHTML;

  const taskToEdit = {
    id,
    status,
    name,
    description,
    assignee,
    deadline,
  };

  fillFormWithEditingTask(taskToEdit);
}

async function handleSaveTask() {
  const id = todoForm[0].value.trim();
  const status = todoForm[1].value.trim() || 'todo'; // todo | doing | done
  const name = todoForm[2].value.trim();
  const description = todoForm[3].value.trim();
  const assignee = todoForm[4].value.trim();
  const deadline = todoForm[5].value;

  const task = { id, status, name, description, assignee, deadline };

  if (Object.values(task).filter((value) => !!value).length < 5) {
    alert('Preencha todos os campos');
    return;
  }

  if (new Date(task.deadline).getTime() < new Date().getTime()) {
    alert('Insira uma data posterior a data atual');
    return;
  }

  const savedTask = await saveTask(task);

  if (!savedTask) return;

  if (task.id) {
    editTaskInTheDOM(task);
  } else {
    addNewTaskToTheDOM(task);
  }

  $('#taskModal').modal('hide');
}

async function handleRemoveTask(e) {
  const cardToRemove =
    e.target.tagName === 'BUTTON'
      ? e.target.parentNode?.parentNode
      : e.target.parentNode?.parentNode.parentNode;
  const id = cardToRemove.getAttribute('id');

  const isRemoved = await removeTask(id);

  isRemoved && cardToRemove.remove();
}

/* API CALLS */
async function removeTask(taskId) {
  const response = await fetch(`http://127.0.0.1:8080/todos/${taskId}`, {
    method: 'DELETE',
  });
  return status === 200;
}

async function getTasks() {
  const response = await fetch('http://127.0.0.1:8080/todos');
  const data = await response.json();
  return data;
}

async function saveTask(task) {
  const response = await fetch('http://127.0.0.1:8080/todos', {
    method: task.id ? 'PUT' : 'POST',
    body: JSON.stringify(task),
  });
  const data = await response.json();
  return data;
}

/* LOAD TASKS FROM SERVER */

async function loadTaksFromServer() {
  const taskList = await getTasks();
  taskList.forEach((task) => addNewTaskToTheDOM(task));
}

window.onload = loadTaksFromServer;

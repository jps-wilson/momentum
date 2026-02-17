document.addEventListener("DOMContentLoaded", () => {
  flatpickr("#task-due-date", {
    dateFormat: "Y-m-d",
    minDate: "today",
  });

  setupSections();
  setupForm();
  renderTasks();
  updateGreeting();
});

let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function setupSections() {
  const mainCanvas = document.getElementById("main-canvas");
  if (!document.getElementById("completed-task-list")) {
    const completedSection = document.createElement("section");
    completedSection.className = "task-list-section";
    completedSection.id = "completed-tasks";
    completedSection.innerHTML = `
      <h3>Completed</h3>
      <div class="task-list" id="completed-task-list"></div>
    `;
    mainCanvas.appendChild(completedSection);
  }
}

function updateGreeting() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Good morning!"
      : hour < 18
        ? "Good afternoon!"
        : "Good evening!";

  document.getElementById("greeting").textContent = greeting;
}

function setupForm() {
  const form = document.getElementById("add-task-form");
  const input = document.getElementById("new-task-input");
  const dateInput = document.getElementById("task-due-date");
  const notesInput = document.getElementById("task-notes");

  if (form && input) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const text = input.value.trim();
      const dueDate = dateInput.value;
      const notes = notesInput.value.trim();

      if (text) {
        tasks.push({
          id: Date.now(), // Unique ID
          text,
          dueDate,
          notes,
          completed: false,
        });
        saveTasks();
        renderTasks();

        input.value = "";
        dateInput.value = "";
        notesInput.value = "";
      }
    });
  }
}

function isToday(dateStr) {
  if (!dateStr) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  return date.getTime() === today.getTime();
}

function isUpcoming(dateStr) {
  if (!dateStr) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  return date.getTime() > today.getTime();
}

function updateTaskCountMessage() {
  const count = tasks.filter((t) => !t.completed).length;
  const message = `You have ${count} task${count !== 1 ? "s" : ""}`;
  const messageElement = document.getElementById("task-count-message");
  if (messageElement) {
    messageElement.textContent = message;
  }
}

function renderTasks() {
  const todayList = document.getElementById("task-list");
  const upcomingList = document.getElementById("upcoming-task-list");
  const completedSection = document.getElementById("completed-task-list");

  if (!todayList || !upcomingList) return; // prevents errors if elements are missing

  todayList.innerHTML = "";
  upcomingList.innerHTML = "";
  if (completedSection) completedSection.innerHTML = "";

  tasks.forEach((task) => {
    const card = createTaskCard(task);

    if (task.completed) {
      if (completedSection) completedSection.appendChild(card);
    } else if (isToday(task.dueDate)) {
      todayList.appendChild(card);
    } else if (isUpcoming(task.dueDate)) {
      upcomingList.appendChild(card);
    } else {
      todayList.appendChild(card);
    }
  });

  if (!todayList.children.length) {
    todayList.innerHTML = `<div class="empty-state"> All clear for today! <i data-lucide="party-popper"></i> </div>`;
  }

  const allLists = [todayList, upcomingList, completedSection];
  allLists.forEach((lists) => {
    if (!lists) return;

    lists.addEventListener("dragover", (e) => {
      e.preventDefault();
      const draggingEl = document.querySelector(".dragging");
      const afterElement = getDragAfterElement(lists, e.clientY);
      if (afterElement === null) {
        lists.appendChild(draggingEl);
      } else {
        lists.insertBefore(draggingEl, afterElement);
      }
    });

    lists.addEventListener("drop", (e) => {
      e.preventDefault();
      const id = Number(e.dataTransfer.getData("text/plain"));
      const newOrder = Array.from(lists.querySelectorAll(".task-card")).map(
        (card) => Number(card.dataset.id),
      );

      tasks.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));

      saveTasks();
    });
  });

  setTimeout(() => {
    document.querySelectorAll(".task-card").forEach((card, index) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(10px)";
      setTimeout(() => {
        card.style.opacity = "1";
        card.style.transform = "translate(0)";
      }, index * 40);
    });
  }, 0);

  if (window.lucide) lucide.createIcons();
  updateProgressBar();
  updateInsightsSummary();
  updateNavCounts();
  updateTaskCountMessage();
}

function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll(".task-card:not(.dragging)"),
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY },
  ).element;
}

function createTaskCard(task) {
  const card = document.createElement("div");
  card.className = "task-card";
  card.setAttribute("draggable", "true");
  card.dataset.id = task.id;
  if (task.completed) card.classList.add("completed");

  const title = document.createElement("div");
  title.className = "task-title";
  title.textContent = task.text;
  card.appendChild(title);

  if (task.dueDate) {
    const date = document.createElement("div");
    date.className = "task-date";
    date.textContent = `Due: ${task.dueDate}`;
    card.appendChild(date);
  }

  if (task.notes) {
    const notesDiv = document.createElement("div");
    notesDiv.className = "task-notes";
    notesDiv.textContent = task.notes;
    card.appendChild(notesDiv);
  }

  const completeBtn = document.createElement("button");
  completeBtn.className = "task-complete-btn";
  completeBtn.innerHTML = `<i data-lucide="SquareCheck"></i>`;
  completeBtn.title = "Mark as complete";
  completeBtn.setAttribute("aria-label", "Mark task as complete");
  completeBtn.onclick = () => {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
    if (task.completed && window.confetti) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };
  card.appendChild(completeBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "task-delete-btn";
  deleteBtn.innerHTML = `<i data-lucide="square-x"></i>`;
  deleteBtn.title = "Delete task";
  deleteBtn.setAttribute("aria-label", "Delete task");
  deleteBtn.onclick = () => {
    tasks = tasks.filter((t) => t.id !== task.id);
    saveTasks();
    renderTasks();
  };
  card.appendChild(deleteBtn);

  card.addEventListener("dragstart", (e) => {
    card.classList.add("dragging");
    e.dataTransfer.setData("text/plain", task.id);
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });

  return card;
}

function updateProgressBar() {
  const fill = document.getElementById("progress-fill");
  if (!fill) return;
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  fill.style.width = percent + "%";
}

function updateInsightsSummary() {
  const completed = tasks.filter((t) => t.completed).length;
  const countSpan = document.getElementById("completed-count");
  if (countSpan) countSpan.textContent = completed;
}

function updateNavCounts() {
  const todayTasks = tasks.filter((t) => !t.completed && isToday(t.dueDate));
  console.log("Today tasks:", todayTasks);

  const todayCount = todayTasks.length;
  const todayBadge = document.getElementById("today-badge");
  if (todayBadge) todayBadge.textContent = todayCount;

  const upcomingCount = tasks.filter(
    (t) => !t.completed && isUpcoming(t.dueDate),
  ).length;

  const completedCount = tasks.filter((t) => t.completed).length;

  const upcomingBadge = document.getElementById("upcoming-badge");
  if (upcomingBadge) upcomingBadge.textContent = upcomingCount;

  const completedBadge = document.getElementById("completed-badge");
  if (completedBadge) completedBadge.textContent = completedCount;
}

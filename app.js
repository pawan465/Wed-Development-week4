// 1. Find the HTML elements once so the rest of the code can reuse them.
const tableBody = document.querySelector("#student-table-body");
const totalCount = document.querySelector("#total-count");
const activeCount = document.querySelector("#active-count");
const classCount = document.querySelector("#class-count");
const searchInput = document.querySelector("#search-input");
const classFilter = document.querySelector("#class-filter");
const statusFilter = document.querySelector("#status-filter");
const dialog = document.querySelector("#student-dialog");
const form = document.querySelector("#student-form");
const toast = document.querySelector("#toast");
const storageKey = "student-desk-students-v1";

// 2. Load saved records from this browser. If this is a new browser, start empty.
function loadStudents() {
  try {
    const savedStudents = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(savedStudents) ? savedStudents : [];
  } catch {
    // A damaged saved value should not stop the rest of the page from working.
    return [];
  }
}

let students = loadStudents();
let toastTimer;

// 3. Save the whole list after each change. localStorage stays on this device.
function saveStudents() {
  localStorage.setItem(storageKey, JSON.stringify(students));
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

// 4. Keep the class filter and form suggestions in sync with the records.
function updateClassOptions() {
  const selectedClass = classFilter.value;
  const classes = [...new Set(students.map((student) => student.className.trim()).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second));

  classFilter.innerHTML = '<option value="">All classes</option>';
  classes.forEach((className) => {
    const option = document.createElement("option");
    option.value = className;
    option.textContent = className;
    classFilter.append(option);
  });
  classFilter.value = classes.includes(selectedClass) ? selectedClass : "";

  document.querySelector("#class-suggestions").innerHTML = classes
    .map((className) => `<option value="${escapeHtml(className)}"></option>`).join("");
}

// 5. Apply the search and filters, then draw the matching rows in the table.
function getVisibleStudents() {
  const query = searchInput.value.trim().toLowerCase();

  return students.filter((student) => {
    const searchableText = [student.name, student.studentId, student.className, student.email]
      .join(" ").toLowerCase();
    return searchableText.includes(query)
      && (!classFilter.value || student.className === classFilter.value)
      && (!statusFilter.value || student.status === statusFilter.value);
  });
}

function renderStudents() {
  updateClassOptions();
  const visibleStudents = getVisibleStudents();

  // The name and email are escaped before they are inserted into HTML.
  tableBody.innerHTML = visibleStudents.map((student) => {
    const palette = ["#f0edff", "#e9f5ff", "#fff2e8", "#e9f8f0", "#fdeef4"];
    const colorIndex = [...student.name].reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % palette.length;
    const statusClass = student.status === "Active" ? "active" : "inactive";
    return `<tr>
      <td><div class="student-person"><span class="student-avatar" style="background:${palette[colorIndex]}">${escapeHtml(initials(student.name))}</span><span class="student-name">${escapeHtml(student.name)}</span></div></td>
      <td>${escapeHtml(student.studentId)}</td>
      <td>${escapeHtml(student.className)}</td>
      <td class="student-email">${escapeHtml(student.email || "—")}</td>
      <td><span class="badge ${statusClass}">${escapeHtml(student.status)}</span></td>
      <td><div class="row-actions"><button class="row-action" type="button" data-action="edit" data-key="${escapeHtml(student.key)}" aria-label="Edit ${escapeHtml(student.name)}">✎</button><button class="row-action delete" type="button" data-action="delete" data-key="${escapeHtml(student.key)}" aria-label="Delete ${escapeHtml(student.name)}">⌫</button></div></td>
    </tr>`;
  }).join("");

  totalCount.textContent = students.length;
  activeCount.textContent = students.filter((student) => student.status === "Active").length;
  classCount.textContent = new Set(students.map((student) => student.className.trim()).filter(Boolean)).size;
  document.querySelector("#result-count").textContent = `Showing ${visibleStudents.length} of ${students.length} ${students.length === 1 ? "student" : "students"}`;

  const hasFilters = Boolean(searchInput.value.trim() || classFilter.value || statusFilter.value);
  const emptyState = document.querySelector("#empty-state");
  emptyState.hidden = visibleStudents.length > 0;
  document.querySelector("#clear-search-button").hidden = !hasFilters;
  document.querySelector("#empty-title").textContent = hasFilters ? "No matching students" : "No students yet";
  document.querySelector("#empty-message").textContent = hasFilters
    ? "Try a different search or clear your filters."
    : "Add your first student to get started.";
  document.querySelector("#empty-add-button").hidden = hasFilters;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2400);
}

// 6. Open a clean form to add a student, or fill it with an existing record.
function openStudentForm(student = null) {
  form.reset();
  document.querySelector("#form-error").hidden = true;
  document.querySelector("#student-key").value = student?.key || "";
  document.querySelector("#form-title").textContent = student ? "Edit student" : "Add a student";
  document.querySelector("#save-student-button").textContent = student ? "Save changes" : "Save student";

  if (student) {
    document.querySelector("#student-name").value = student.name;
    document.querySelector("#student-id").value = student.studentId;
    document.querySelector("#student-class").value = student.className;
    document.querySelector("#student-email").value = student.email;
    document.querySelector("#student-status").value = student.status;
  }

  dialog.showModal();
  document.querySelector("#student-name").focus();
}

function closeStudentForm() {
  dialog.close();
  form.reset();
}

// 7. Add a new record or update the record being edited.
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const key = document.querySelector("#student-key").value;
  const studentId = document.querySelector("#student-id").value.trim();
  const duplicate = students.find((student) => student.studentId.toLowerCase() === studentId.toLowerCase() && student.key !== key);

  if (duplicate) {
    const error = document.querySelector("#form-error");
    error.textContent = "That student ID is already in use. Please choose a unique ID.";
    error.hidden = false;
    document.querySelector("#student-id").focus();
    return;
  }

  const student = {
    key: key || (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    name: document.querySelector("#student-name").value.trim(),
    studentId,
    className: document.querySelector("#student-class").value.trim(),
    email: document.querySelector("#student-email").value.trim(),
    status: document.querySelector("#student-status").value,
  };

  if (key) {
    students = students.map((savedStudent) => savedStudent.key === key ? student : savedStudent);
  } else {
    students.unshift(student);
  }

  saveStudents();
  renderStudents();
  closeStudentForm();
  showToast(key ? "Student details updated." : "Student added successfully.");
});

// 8. Use the buttons inside each row to edit or delete that student.
tableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const student = students.find((item) => item.key === button.dataset.key);
  if (!student) return;

  if (button.dataset.action === "edit") {
    openStudentForm(student);
    return;
  }

  if (window.confirm(`Delete ${student.name}? This removes the student from this browser.`)) {
    students = students.filter((item) => item.key !== student.key);
    saveStudents();
    renderStudents();
    showToast("Student deleted.");
  }
});

// 9. Connect buttons and filters to the functions above.
document.querySelector("#add-student-button").addEventListener("click", () => openStudentForm());
document.querySelector("#empty-add-button").addEventListener("click", () => openStudentForm());
document.querySelector("#close-dialog-button").addEventListener("click", closeStudentForm);
document.querySelector("#cancel-dialog-button").addEventListener("click", closeStudentForm);
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeStudentForm();
});
searchInput.addEventListener("input", renderStudents);
classFilter.addEventListener("change", renderStudents);
statusFilter.addEventListener("change", renderStudents);
document.querySelector("#clear-search-button").addEventListener("click", () => {
  searchInput.value = "";
  classFilter.value = "";
  statusFilter.value = "";
  renderStudents();
});

// 10. Show today's date and draw the first version of the directory.
document.querySelector("#today-label").textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "short", month: "short", day: "numeric",
}).format(new Date());
renderStudents();

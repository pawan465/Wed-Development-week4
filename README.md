# Student Desk

A beginner-friendly student manager built with plain HTML, CSS, and JavaScript. It follows **Option 1** in the Week 4 PDF: add, edit, and delete students; save them in `localStorage`; show them in a table; and search and filter the list.

## Run the project

1. Open `index.html` in a recent web browser.
2. Select **Add student** and enter a name, unique student ID, and class.
3. Save the form. The student appears in the directory and is saved in this browser.
4. Use the search box or class and status filters to find a student.
5. Select the pencil icon to edit a record. Select the trash icon to delete it.

No installation or build command is required.

## Learn it step by step

### 1. HTML makes the page structure

Open `index.html`. It contains the sidebar, summary cards, student table, filters, and the add/edit form. The form labels, table headings, and button names help assistive technology understand the page.

### 2. CSS styles the page

Open `styles.css`. The color and spacing values start in `:root`. The layout uses CSS grid and flexbox. The media queries near the bottom rearrange the page for tablets and phones.

### 3. JavaScript finds the page elements

At the top of `app.js`, `querySelector()` stores references to the form, filters, table, and summary numbers. The `storageKey` is the name used to save this app's data in the browser.

### 4. Load and save the data

`loadStudents()` reads JSON from `localStorage` when the page opens. `saveStudents()` converts the current student array back to JSON whenever a record changes.

### 5. Render the student table

`renderStudents()` updates the class filter, calls `getVisibleStudents()`, creates one table row per matching student, and refreshes the summary numbers. The search checks the name, ID, class, and email.

### 6. Add and edit records

The form's `submit` event reads and validates its fields. An empty hidden key means “add a new record”; a key already in the form means “update this record.” Duplicate student IDs are rejected.

### 7. Delete records

The table listens for clicks on its edit and delete buttons. Deletion asks for confirmation, removes the record from the array, saves, then redraws the table.

## Useful notes

- Student records are stored in this browser on this device. They are not sent to a server and will not automatically appear in another browser or device.
- To start over, remove the `student-desk-students-v1` entry from the browser's developer tools under **Application/Storage → Local Storage**.
- `app.js` includes numbered comments that follow the same flow as this guide.

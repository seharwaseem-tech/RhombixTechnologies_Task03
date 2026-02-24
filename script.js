// ELEMENTS
const addBookBtn = document.getElementById("addBookBtn");
const bookModal = document.getElementById("bookModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveBookBtn = document.getElementById("saveBookBtn");

const titleInput = document.getElementById("titleInput");
const authorInput = document.getElementById("authorInput");
const categoryInput = document.getElementById("categoryInput");
const coverInput = document.getElementById("coverInput");

const bookContainer = document.getElementById("bookContainer");

const totalBooksEl = document.getElementById("totalBooks");
const borrowedBooksEl = document.getElementById("borrowedBooks");
const availableBooksEl = document.getElementById("availableBooks");

const historyModal = document.getElementById("historyModal");
const historyList = document.getElementById("historyList");
const closeHistoryBtn = document.getElementById("closeHistoryBtn");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

let books = JSON.parse(localStorage.getItem("books")) || [];

// MODALS
addBookBtn.onclick = () => bookModal.style.display = "flex";
closeModalBtn.onclick = () => bookModal.style.display = "none";
closeHistoryBtn.onclick = () => historyModal.style.display = "none";

// ADD BOOK
saveBookBtn.onclick = () => {
    if (!titleInput.value || !authorInput.value) {
        alert("Title and Author required");
        return;
    }

    books.push({
        id: Date.now(),
        title: titleInput.value,
        author: authorInput.value,
        category: categoryInput.value,
        cover: coverInput.value || "https://via.placeholder.com/200x250",
        borrowed: false,
        activeBorrow: null,
        history: []
    });

    localStorage.setItem("books", JSON.stringify(books));
    bookModal.style.display = "none";
    titleInput.value = authorInput.value = coverInput.value = "";
    renderBooks();
    updateStats();
};

// RENDER BOOKS
function renderBooks() {
    bookContainer.innerHTML = "";

    const searchText = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;

    const filteredBooks = books.filter(book => {
        const searchMatch =
            book.title.toLowerCase().includes(searchText) ||
            book.author.toLowerCase().includes(searchText);

        const categoryMatch =
            selectedCategory === "all" || book.category === selectedCategory;

        return searchMatch && categoryMatch;
    });

    if (filteredBooks.length === 0) {
        bookContainer.innerHTML = "<p style='padding:10px;'>No books found</p>";
        return;
    }

    filteredBooks.forEach(book => {
        bookContainer.innerHTML += `
        <div class="book-card">
            <img src="${book.cover}">
            <div class="book-info">
                <h3>${book.title}</h3>
                <p>${book.author}</p>
                <span class="category">${book.category}</span>

                <div class="book-actions">
                    <button class="${book.borrowed ? "return-btn" : "borrow-btn"}"
                        onclick="handleBorrowReturn(${book.id})">
                        ${book.borrowed ? "Return" : "Borrow"}
                    </button>

                    <button onclick="showHistory(${book.id})">History</button>
                    <button onclick="deleteBook(${book.id})" style="background:#000;color:#fff;">
                        Delete
                    </button>
                </div>
            </div>
        </div>`;
    });
}

// BORROW / RETURN
function handleBorrowReturn(bookId) {
    const book = books.find(b => b.id === bookId);

    if (!book.borrowed) {
        const borrowerId = prompt("Enter Borrower ID:");
        const name = prompt("Enter Borrower Name:");
        if (!borrowerId || !name) return;

        const allowedDays = parseInt(prompt("In how many days will you return the book?"));
        if (!allowedDays || allowedDays <= 0) {
            alert("Invalid number of days");
            return;
        }

        book.borrowed = true;
        book.activeBorrow = {
            borrowerId,
            name,
            borrowDate: Date.now(),
            allowedDays
        };

    } else {
        const confirmId = prompt("Confirm Borrower ID:");
        if (confirmId !== book.activeBorrow.borrowerId) {
            alert("Borrower ID mismatch!");
            return;
        }

        const actualDays = Math.floor((Date.now() - book.activeBorrow.borrowDate) / (1000 * 60 * 60 * 24));
        const overdue = actualDays - book.activeBorrow.allowedDays;
        const fine = overdue > 0 ? overdue * 50 : 0;

        if (fine > 0) {
            alert(`Late return! Fine: Rs. ${fine}`);
        }

        book.history.push({
            borrowerId: book.activeBorrow.borrowerId,
            name: book.activeBorrow.name,
            borrowDate: new Date(book.activeBorrow.borrowDate).toLocaleDateString(),
            returnDate: new Date().toLocaleDateString(),
            allowedDays: book.activeBorrow.allowedDays,
            fine
        });

        book.borrowed = false;
        book.activeBorrow = null;
    }

    localStorage.setItem("books", JSON.stringify(books));
    renderBooks();
    updateStats();
}

// DELETE BOOK
function deleteBook(bookId) {
    const book = books.find(b => b.id === bookId);

    if (book.borrowed) {
        alert("Cannot delete a borrowed book!");
        return;
    }

    const confirmDelete = confirm(`Delete "${book.title}" permanently?`);
    if (!confirmDelete) return;

    books = books.filter(b => b.id !== bookId);
    localStorage.setItem("books", JSON.stringify(books));
    renderBooks();
    updateStats();
}

// HISTORY
function showHistory(bookId) {
    const book = books.find(b => b.id === bookId);
    historyList.innerHTML = "";

    if (book.history.length === 0) {
        historyList.innerHTML = "<p>No history available</p>";
    } else {
        book.history.forEach(h => {
            historyList.innerHTML += `
            <div class="history-item">
                <strong>${h.name}</strong><br>
                ID: ${h.borrowerId}<br>
                Borrowed: ${h.borrowDate}<br>
                Returned: ${h.returnDate}<br>
                Allowed Days: ${h.allowedDays}<br>
                Fine: Rs. ${h.fine}
            </div>`;
        });
    }

    historyModal.style.display = "flex";
}

// STATS
function updateStats() {
    totalBooksEl.textContent = books.length;
    const borrowed = books.filter(b => b.borrowed).length;
    borrowedBooksEl.textContent = borrowed;
    availableBooksEl.textContent = books.length - borrowed;
}

// EVENTS
searchInput.addEventListener("input", renderBooks);
categoryFilter.addEventListener("change", renderBooks);

// INIT
renderBooks();
updateStats();
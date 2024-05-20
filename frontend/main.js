let loginRegisterLink = document.querySelector("#loginRegisterLink");
let loginUsername = document.querySelector("#identifier");
let loginPassword = document.querySelector("#password");
let registerUsername = document.querySelector("#registerUsername");
let registerEmail = document.querySelector("#registerEmail");
let registerPassword = document.querySelector("#registerPassword");
let loggedInUser = document.querySelector("#loggedInUser h2");
let loginContainer = document.querySelector("#loginContainer");
let bookList = document.getElementById("bookList");
let registerBtn = document.querySelector("#registerBtn");
let loginBtn = document.querySelector("#loginBtn");
let logoutBtn = document.querySelector("#logoutBtn");
let savedBooksBtn = document.querySelector("#savedBooks");
let savedBookList = document.querySelector("#savedBookList");
let sortByTitle = document.querySelector("#sortByTitle");
let sortByAuthor = document.querySelector("#sortByAuthor");
let userBookList = document.querySelector("#userBookList");

loginRegisterLink.addEventListener("click", () => {
  loginContainer.classList.remove("hidden");
  loginContainer.classList.add("open");
  loginUsername.value = "";
  loginPassword.value = "";
  registerUsername.value = "";
  registerEmail.value = "";
  registerPassword.value = "";
});

window.addEventListener("click", (event) => {
  if (event.target == loginContainer || event.target == userBookList) {
    loginContainer.classList.remove("open");
    userBookList.classList.remove("open");
    location.reload();
  }
});

savedBooksBtn.addEventListener("click", () => {
  getSavedBooks();
  userBookList.classList.toggle("hidden");
  userBookList.classList.add("open");
});

// Get books from api
async function getBooks() {
  try {
    const response = await axios.get(
      "http://localhost:1337/api/books?populate=*"
    );
    const books = response.data.data;
    bookList.innerHTML = "";
    books.forEach((book) => displayBooks(book));
    addToReadListener();
    // console.log(books);
  } catch (error) {
    console.log("Could not fetch books:", error);
  }
}

// Function for registration
const register = async () => {
  const username = registerUsername.value;
  const email = registerEmail.value;
  const password = registerPassword.value;
  try {
    let response = await axios.post(
      "http://localhost:1337/api/auth/local/register",
      {
        username,
        email,
        password,
      }
    );

    if (response.status === 200) {
      alert("Registration successful, proceed to login");
      registerUsername.value = "";
      registerEmail.value = "";
      registerPassword.value = "";
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.log("Registration failed:", error);
    alert("Registration failed, try again");
  }
};

// Function for login
async function login() {
  const identifier = loginUsername.value;
  const password = loginPassword.value;

  bookList.innerHTML = "";

  try {
    const response = await axios.post("http://localhost:1337/api/auth/local", {
      identifier,
      password,
    });

    if (response.status === 200) {
      const { jwt, user } = response.data;
      sessionStorage.setItem("token", jwt);
      //   sessionStorage.setItem("loginId", user.id);
      sessionStorage.setItem("user", JSON.stringify(user));
      renderPage();
    } else {
      throw new Error("Wrong login info");
    }
  } catch (error) {
    console.log("Failed to login:", error);
    alert("Failed to login, try again");
  }
}

// Function for logout
async function logout() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("savedBooks");
  sessionStorage.removeItem("sortBy", "author");
  sessionStorage.removeItem("sortBy", "title");
  loggedInUser.innerHTML = "";
  savedBookList.innerHTML = "";
  savedBooksBtn.classList.add("hidden");
  userBookList.classList.add("hidden");
  logoutBtn.classList.add("hidden");
  loginRegisterLink.classList.remove("hidden");
}

// Render page and get books and display
async function renderPage() {
  if (sessionStorage.getItem("token")) {
    let username = JSON.parse(sessionStorage.getItem("user")).username;

    loggedInUser.innerHTML = `Welcome back, ${username} 📖`;
    loginRegisterLink.classList.add("hidden");
    savedBooksBtn.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    loginContainer.classList.add("hidden");
  } else {
    loggedInUser.innerHTML = "";
    loginRegisterLink.classList.remove("hidden");
    savedBooksBtn.classList.add("hidden");
    logoutBtn.classList.add("hidden");
  }
  getBooks();
}

// Styling
const setTheme = async () => {
  try {
    const response = await axios.get("http://localhost:1337/api/theme");
    const theme = response.data.data.attributes.theme;

    document.body.classList.add(theme);
  } catch (error) {
    console.error("Failed to set theme", error);
  }
};

// Function for if added to read
function addToReadListener() {
  let addToReadBtn = document.querySelectorAll(".addToReadBtn");

  if (sessionStorage.getItem("token")) {
    addToReadBtn.forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const bookId = event.target.getAttribute("data-book-id");
        addToReadList(bookId);
      });
    });
  } else {
    addToReadBtn.forEach((btn) => {
      btn.addEventListener("click", () => {
        alert("You need to be logged in to add books to reading list!");
      });
    });
  }
}

// Display a list og the fetched books
function displayBooks(book) {
  //   console.log("Book object:", book);
  // Destructuring for cleaner look
  const { title, author, pages, published } = book.attributes;
  const id = book.id;

  const bookItem = document.createElement("li");
  bookItem.classList.add("book-item");
  bookItem.innerHTML = `
      <img src="http://localhost:1337${book.attributes.cover.data.attributes?.url}" alt="${title}" height="300"/>
      <h3>${title}</h3>
      <p>${author}</p>
      <p>${pages} pages</p>  
      <p>${published}</p>
      <button class="btn addToReadBtn" data-book-id="${id}">Add to read</button>
    `;

  bookList.appendChild(bookItem);
}

// Function add to read list
async function addToReadList(bookId) {
  const token = sessionStorage.getItem("token");
  const userId = JSON.parse(sessionStorage.getItem("user")).id;

  try {
    let response = await axios.put(
      `http://localhost:1337/api/users/${userId}`,
      {
        savedBooks: { connect: [bookId] },
      }, // Send just the book ID
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      alert("Book added to your read list!");
    } else {
      throw new Error("Failed to save book");
    }
  } catch (error) {
    console.log("Failed to save book:", error);
    alert("Failed to save book, try again");
  }
}

// Get saved books
async function getSavedBooks() {
  const token = sessionStorage.getItem("token");
  const userId = JSON.parse(sessionStorage.getItem("user")).id;

  try {
    const response = await axios.get(
      `http://localhost:1337/api/users/${userId}?populate=savedBooks`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const savedBooks = response.data.savedBooks;

    // Sort function
    function sortBooks(sortBy) {
      if (sortBy === "title") {
        savedBooks.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortBy === "author") {
        savedBooks.sort((a, b) => a.author.localeCompare(b.author));
      }
    }

    sortBooks(sessionStorage.getItem("sortBy"));

    displaySavedBooks(savedBooks);

    // Storing
    sessionStorage.setItem("savedBooks", JSON.stringify(savedBooks));
  } catch (error) {
    console.log("Could not fetch saved books:", error);
  }
}

// Function for deleting saved book
async function deleteSavedBook(bookId) {
  const token = sessionStorage.getItem("token");
  const userId = JSON.parse(sessionStorage.getItem("user")).id;

  try {
    let response = await axios.put(
      `http://localhost:1337/api/users/${userId}`,
      {
        savedBooks: { disconnect: [bookId] },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      alert("Book removed from reading list!");
      getSavedBooks();
    } else {
      throw new Error("Failed to delete book");
    }
  } catch (error) {
    console.log("Failed to delete book:", error);
    alert("Failed to delete book, try again");
  }
}

// Display list of saved books
function displaySavedBooks(books) {
  savedBookList.innerHTML = "";

  books.forEach((book) => {
    const { title, author, id } = book;

    const savedBookItem = document.createElement("li");
    savedBookItem.classList.add("saved-book-item");
    savedBookItem.innerHTML = `
          <h3>${title}</h3>
          <p>${author}</p>
          <button class="btn deleteBtn" data-book-id="${id}">Delete</button>
        `;

    savedBookList.appendChild(savedBookItem);
  });

  // Eventlistener for deleting saved books
  let deleteBtn = document.querySelectorAll(".deleteBtn");

  deleteBtn.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const bookId = event.target.getAttribute("data-book-id");
      deleteSavedBook(bookId);
    });
  });
}

registerBtn.addEventListener("click", register);
loginBtn.addEventListener("click", login);
logoutBtn.addEventListener("click", logout);

// Run sort function
sortByTitle.addEventListener("click", () => {
  sessionStorage.setItem("sortBy", "title");
  getSavedBooks().then(() => {
    // Call getSavedBooks and then update display
  });
});

sortByAuthor.addEventListener("click", () => {
  sessionStorage.setItem("sortBy", "author");
  getSavedBooks().then(() => {
    // Call getSavedBooks and then update display
  });
});

renderPage();
setTheme();

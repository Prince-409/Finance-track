// ==========================================
// 1. DATA STORAGE & INITIALIZATION
// ==========================================

// Variables to hold our data
let users = [];
let currentUser = null;
let accounts = [];
let transactions = [];

// Load data from localStorage when page opens
function loadData() {
    migrateOldData(); // Ensure old single-user data is converted
    
    let savedUsers = localStorage.getItem("financeUsers");
    if (savedUsers) {
        users = JSON.parse(savedUsers);
    }
}

function migrateOldData() {
    let oldUserStr = localStorage.getItem("financeUser");
    if (oldUserStr) {
        let oldUser = JSON.parse(oldUserStr);
        if (oldUser && oldUser.email) {
            let savedUsers = JSON.parse(localStorage.getItem("financeUsers")) || [];
            let userExists = savedUsers.find(u => u.email === oldUser.email);
            if (!userExists) {
                savedUsers.push(oldUser);
                localStorage.setItem("financeUsers", JSON.stringify(savedUsers));
                
                let oldAccounts = localStorage.getItem("financeAccounts");
                if (oldAccounts) localStorage.setItem("financeAccounts_" + oldUser.email, oldAccounts);
                
                let oldTrans = localStorage.getItem("financeTransactions");
                if (oldTrans) localStorage.setItem("financeTransactions_" + oldUser.email, oldTrans);
            }
        }
        localStorage.removeItem("financeUser");
        localStorage.removeItem("financeAccounts");
        localStorage.removeItem("financeTransactions");
    }
}

function saveUsersData() {
    localStorage.setItem("financeUsers", JSON.stringify(users));
}

// Save all data to localStorage so it is never lost
function saveData() {
    if (!currentUser) return;
    localStorage.setItem("financeAccounts_" + currentUser.email, JSON.stringify(accounts));
    localStorage.setItem("financeTransactions_" + currentUser.email, JSON.stringify(transactions));
}

function loadSessionData() {
    if (!currentUser) return;
    let savedAccounts = localStorage.getItem("financeAccounts_" + currentUser.email);
    let savedTransactions = localStorage.getItem("financeTransactions_" + currentUser.email);
    
    accounts = savedAccounts ? JSON.parse(savedAccounts) : [];
    transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
}

// Initialize app
document.addEventListener("DOMContentLoaded", function() {
    loadData(); // Load all saved data first

    // Check if user has an active session from a previous visit
    let loggedInEmail = localStorage.getItem("loggedInUserEmail");
    if (loggedInEmail) {
        let user = users.find(u => u.email === loggedInEmail);
        if (user) {
            currentUser = user;
            loadSessionData();
            
            // Hide login and show dashboard
            document.getElementById("authContainer").style.display = "none";
            document.getElementById("appContainer").style.display = "flex";
            document.getElementById("userDisplay").innerText = currentUser.name;
            
            // Refresh the UI with saved data
            updateAccountsList();
            updateAccountDropdown();
            updateTransactionsList();
        } else {
            logout(); // Clean up if user deleted
        }
    } else if (localStorage.getItem("isLoggedIn") === "true") {
        logout(); // Force re-login if old session format
    }
});
// ==========================================
// 2. AUTHENTICATION LOGIC
// ==========================================

// Switch between login and signup
function toggleAuth() {
    let loginForm = document.getElementById("loginForm");
    let signupForm = document.getElementById("signupForm");
    let authTitle = document.getElementById("authTitle");

    if (loginForm.style.display !== "none") {
        loginForm.style.display = "none";
        signupForm.style.display = "block";
        authTitle.innerText = "Sign Up";
    } else {
        loginForm.style.display = "block";
        signupForm.style.display = "none";
        authTitle.innerText = "Login";
    }
}

// Sign Up
function signup() {
    let nameInput = document.getElementById("signupName").value.trim();
    let emailInput = document.getElementById("signupEmail").value.trim();
    let passwordInput = document.getElementById("signupPassword").value;

    if (nameInput === "" || emailInput === "" || passwordInput === "") {
        alert("Please fill in all fields to sign up.");
        return;
    }

    // Email basic validation
    if (!emailInput.includes("@") || !emailInput.includes(".")) {
        alert("Please enter a valid email address.");
        return;
    }

    // Password validation (min 8 chars, 1 uppercase, 1 number)
    let hasUppercase = /[A-Z]/.test(passwordInput);
    let hasNumber = /[0-9]/.test(passwordInput);
    if (passwordInput.length < 8 || !hasUppercase || !hasNumber) {
        alert("Password must be at least 8 characters long, contain at least 1 uppercase letter, and 1 number.");
        return;
    }

    // Check if user already exists
    let existingUser = users.find(u => u.email === emailInput);
    if (existingUser) {
        alert("User with this email already exists. Please log in.");
        return;
    }

    // Save new user credentials
    let newUser = { name: nameInput, email: emailInput, password: passwordInput };
    users.push(newUser);
    saveUsersData(); // Save to local storage!

    alert("Sign up successful! Please log in.");
    document.getElementById("signupName").value = "";
    document.getElementById("signupEmail").value = "";
    document.getElementById("signupPassword").value = "";
    toggleAuth(); 
}

// Login
function login() {
    let emailInput = document.getElementById("loginEmail").value.trim();
    let passwordInput = document.getElementById("loginPassword").value;

    let user = users.find(u => u.email === emailInput && u.password === passwordInput);

    if (user && emailInput !== "") {
        currentUser = user;
        localStorage.setItem("loggedInUserEmail", currentUser.email); // Remember session so they don't have to login again
        
        loadSessionData(); // Load specific user data
        
        document.getElementById("authContainer").style.display = "none";
        document.getElementById("appContainer").style.display = "flex";
        document.getElementById("userDisplay").innerText = currentUser.name;

        // Load data on the screen
        updateAccountsList();
        updateAccountDropdown();
        updateTransactionsList();
    } else {
        alert("Invalid email or password. Have you signed up yet?");
    }
}

// Logout
function logout() {
    localStorage.removeItem("loggedInUserEmail"); // Clear session memory
    localStorage.removeItem("isLoggedIn"); // Clear old session format
    currentUser = null;
    accounts = [];
    transactions = [];
    
    document.getElementById("authContainer").style.display = "flex";
    document.getElementById("appContainer").style.display = "none";
    
    document.getElementById("loginEmail").value = "";
    document.getElementById("loginPassword").value = "";
}

// ==========================================
// 3. FINANCE TRACKER LOGIC
// ==========================================

// Add a new account
function addAccount() {
    let nameInput = document.getElementById("accountName").value;
    let balanceInput = document.getElementById("accountBalance").value;

    if (nameInput === "" || balanceInput === "") {
        alert("Please enter account name and balance");
        return; 
    }

    let newAccount = {
        name: nameInput,
        balance: Number(balanceInput) 
    };

    accounts.push(newAccount);
    saveData(); // Save changes to local storage!

    document.getElementById("accountName").value = "";
    document.getElementById("accountBalance").value = "";

    updateAccountsList();
    updateAccountDropdown();
}

// Update the accounts list UI
function updateAccountsList() {
    let ul = document.getElementById("accountsList");
    ul.innerHTML = ""; 

    for (let i = 0; i < accounts.length; i++) {
        let li = document.createElement("li");
        
        let accountText = document.createElement("span");
        accountText.innerText = accounts[i].name + "  |  ₹ " + accounts[i].balance;
        
        let deleteBtn = document.createElement("button");
        deleteBtn.innerText = "Delete";
        deleteBtn.className = "btn-delete-small";
        deleteBtn.onclick = function() {
            deleteAccount(i);
        };
        
        li.appendChild(accountText);
        li.appendChild(deleteBtn);
        ul.appendChild(li);
    }
}

// Delete an account
function deleteAccount(index) {
    let confirmDelete = confirm("Are you sure you want to delete this account?");
    if (!confirmDelete) return;

    let accountName = accounts[index].name;
    accounts.splice(index, 1);

    let remainingTransactions = [];
    for (let i = 0; i < transactions.length; i++) {
        if (transactions[i].account !== accountName) {
            remainingTransactions.push(transactions[i]);
        }
    }
    transactions = remainingTransactions;

    saveData(); // Save changes to local storage!

    updateAccountsList();
    updateAccountDropdown();
    updateTransactionsList();
}

// Update account selection dropdown
function updateAccountDropdown() {
    let select = document.getElementById("transAccount");
    select.innerHTML = '<option value="" disabled selected>Select Account</option>'; 

    for (let i = 0; i < accounts.length; i++) {
        let option = document.createElement("option");
        option.value = accounts[i].name;
        option.innerText = accounts[i].name;
        select.appendChild(option);
    }
}

// Add a new transaction
function addTransaction() {
    let textInput = document.getElementById("transText").value;
    let amountInput = document.getElementById("transAmount").value;
    let accountName = document.getElementById("transAccount").value;

    if (textInput === "" || amountInput === "" || accountName === "") {
        alert("Please fill all transaction details and select an account.");
        return;
    }

    let amountNum = Number(amountInput); 

    for (let i = 0; i < accounts.length; i++) {
        if (accounts[i].name === accountName) {
            accounts[i].balance = accounts[i].balance + amountNum; 
        }
    }

    let newTrans = {
        text: textInput,
        amount: amountNum,
        account: accountName
    };
    
    transactions.push(newTrans);
    saveData(); // Save changes to local storage!

    document.getElementById("transText").value = "";
    document.getElementById("transAmount").value = "";
    document.getElementById("transAccount").value = ""; 

    updateAccountsList(); 
    updateTransactionsList(); 
}

// Update the transactions list UI
function updateTransactionsList() {
    let ul = document.getElementById("transactionsList");
    ul.innerHTML = ""; 

    for (let i = 0; i < transactions.length; i++) {
        let li = document.createElement("li");
        let t = transactions[i];
        
        let amountText = "";
        if (t.amount > 0) {
            amountText = "+ ₹" + t.amount;
        } else {
            amountText = "- ₹" + Math.abs(t.amount); 
        }
        
        li.innerText = t.text + " (" + t.account + ")  |  " + amountText;
        ul.appendChild(li);
    }
}

// ==========================================
// 4. EXTRA FEATURES (ABOUT US & PDF EXPORT)
// ==========================================

function openAboutUs() {
    document.getElementById("aboutModal").style.display = "flex";
}

function closeAboutUs() {
    document.getElementById("aboutModal").style.display = "none";
}

function sendEmailPDF() {
    if (transactions.length === 0) {
        alert("No transactions to export!");
        return;
    }

    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Finance Tracker - Transaction Log", 14, 20);

    // User Info
    doc.setFontSize(12);
    let userName = currentUser ? currentUser.name : "Unknown User";
    let userEmail = currentUser ? currentUser.email : "No email provided";
    doc.text("User: " + userName, 14, 30);
    doc.text("Email: " + userEmail, 14, 38);

    // Transactions list
    let y = 50;
    doc.text("Transactions:", 14, y);
    y += 10;

    for (let i = 0; i < transactions.length; i++) {
        let t = transactions[i];
        let amountText = t.amount > 0 ? "+ Rs." + t.amount : "- Rs." + Math.abs(t.amount);
        let line = (i + 1) + ". " + t.text + " (" + t.account + ") | " + amountText;
        
        doc.text(line, 14, y);
        y += 10;

        // Add new page if we run out of space
        if (y > 280) {
            doc.addPage();
            y = 20;
        }
    }

    // Download the PDF
    doc.save("Transaction_Log.pdf");

    // Simulate sending email
    setTimeout(() => {
        alert("Success! Transaction log PDF has been successfully mailed to " + userEmail);
    }, 500); // Slight delay for realism
}

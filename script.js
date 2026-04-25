// ==========================================
// 1. DATA STORAGE & INITIALIZATION
// ==========================================

// Variables to hold our data
let registeredUser = { username: "", password: "" };
let accounts = [];
let transactions = [];

// Load data from localStorage when page opens
function loadData() {
    // Get saved data from the browser's memory
    let savedUser = localStorage.getItem("financeUser");
    let savedAccounts = localStorage.getItem("financeAccounts");
    let savedTransactions = localStorage.getItem("financeTransactions");

    // Convert strings back into arrays/objects
    if (savedUser) {
        registeredUser = JSON.parse(savedUser);
    }
    if (savedAccounts) {
        accounts = JSON.parse(savedAccounts);
    }
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
    }
}

// Save all data to localStorage so it is never lost
function saveData() {
    // Convert arrays/objects into strings to save them
    localStorage.setItem("financeUser", JSON.stringify(registeredUser));
    localStorage.setItem("financeAccounts", JSON.stringify(accounts));
    localStorage.setItem("financeTransactions", JSON.stringify(transactions));
}

// When the page fully loads, check if user was already logged in
window.onload = function() {
    loadData(); // Load all saved data first

    // Check if user has an active session from a previous visit
    if (localStorage.getItem("isLoggedIn") === "true") {
        // Hide login and show dashboard
        document.getElementById("authContainer").style.display = "none";
        document.getElementById("appContainer").style.display = "flex";
        document.getElementById("userDisplay").innerText = registeredUser.username;
        
        // Refresh the UI with saved data
        updateAccountsList();
        updateAccountDropdown();
        updateTransactionsList();
    }
};

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
    let usernameInput = document.getElementById("signupUsername").value;
    let passwordInput = document.getElementById("signupPassword").value;

    if (usernameInput === "" || passwordInput === "") {
        alert("Please enter a username and password to sign up.");
        return;
    }

    // Save new user credentials
    registeredUser.username = usernameInput;
    registeredUser.password = passwordInput;
    saveData(); // Save to local storage!

    alert("Sign up successful! Please log in.");
    document.getElementById("signupUsername").value = "";
    document.getElementById("signupPassword").value = "";
    toggleAuth(); 
}

// Login
function login() {
    let usernameInput = document.getElementById("loginUsername").value;
    let passwordInput = document.getElementById("loginPassword").value;

    if (usernameInput === registeredUser.username && passwordInput === registeredUser.password && usernameInput !== "") {
        localStorage.setItem("isLoggedIn", "true"); // Remember session so they don't have to login again
        
        document.getElementById("authContainer").style.display = "none";
        document.getElementById("appContainer").style.display = "flex";
        document.getElementById("userDisplay").innerText = usernameInput;

        // Load data on the screen
        updateAccountsList();
        updateAccountDropdown();
        updateTransactionsList();
    } else {
        alert("Invalid username or password. Have you signed up yet?");
    }
}

// Logout
function logout() {
    localStorage.setItem("isLoggedIn", "false"); // Clear session memory
    
    document.getElementById("authContainer").style.display = "flex";
    document.getElementById("appContainer").style.display = "none";
    
    document.getElementById("loginUsername").value = "";
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

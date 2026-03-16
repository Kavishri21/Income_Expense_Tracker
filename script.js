// --- Constants & Config ---
const APP_DATA_KEY = 'family_finance_tracker_data_v2';
const COLORS = ['#7311d4', '#a855f7', '#d8b4fe', '#f472b6', '#38bdf8', '#34d399', '#fbbf24', '#f87171'];
const EXPENSE_CATEGORIES = [
    'Food',
    'Household',
    'Transport',
    'School / College Fees',
    'Electricity',
    'Bank (Insurance / EMI / Loan)',
    'Medical',
    'Others'
];

// --- Default Data ---
const defaultData = {
    members: [
        { id: 1, name: 'Head of Family', isHead: true }
    ],
    // Clean slate, no dummy data
    transactions: []
};

// --- State ---
let appData = null;
let currentMonth = new Date().getMonth();
let currentPage = document.body.dataset.page || 'home';
let currentMemberId = null;
let editingTransactionId = null;

// --- Core Functions ---
function init() {
    appData = JSON.parse(localStorage.getItem(APP_DATA_KEY));
    if (!appData) {
        appData = defaultData;
        saveData();
    }

    // Parse URL params for member page
    if (currentPage === 'member') {
        const urlParams = new URLSearchParams(window.location.search);
        currentMemberId = parseInt(urlParams.get('id'));
        if (!currentMemberId || !appData.members.find(m => m.id === currentMemberId)) {
            // Fallback or redirect if invalid member
            window.location.href = 'index.html';
            return;
        }
    } else {
        const monthSelect = document.getElementById('month-filter');
        if (monthSelect) {
            monthSelect.value = currentMonth; // Set UI to current actual month
            currentMonth = parseInt(monthSelect.value);
        }
    }

    setupEventListeners();
    renderAll();
}

function saveData() {
    localStorage.setItem(APP_DATA_KEY, JSON.stringify(appData));
}

// --- Render Functions ---
function renderAll() {
    renderSidebarMembers();
    renderHeader();

    if (currentPage === 'home') {
        renderDashboard();
    } else if (currentPage === 'member') {
        renderMemberPage();
    }
}

function renderSidebarMembers() {
    const membersList = document.getElementById('members-list');
    const navHome = document.getElementById('nav-home');
    membersList.innerHTML = '';

    // Active state for home
    if (navHome) {
        if (currentPage === 'home') {
            navHome.className = 'flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-semibold';
        } else {
            navHome.className = 'flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors';
        }
    }

    appData.members.forEach((member) => {
        const a = document.createElement('a');
        a.href = `member.html?id=${member.id}`;

        const isActive = (currentPage === 'member' && currentMemberId === member.id);
        a.className = isActive
            ? 'flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-semibold relative group'
            : 'flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative group';

        a.innerHTML = `
            <span class="material-symbols-outlined" ${isActive ? 'style="font-variation-settings: \'FILL\' 1"' : ''}>person</span>
            <span class="text-sm flex-1 truncate">${member.name}</span>
            <div class="hidden group-hover:flex items-center gap-1 absolute right-2 bg-white dark:bg-slate-800 px-1 rounded shadow-sm border border-slate-200 dark:border-slate-700">
                 <button onclick="event.preventDefault(); window.editMemberName(${member.id})" class="text-slate-400 hover:text-primary p-1" title="Edit Name">
                     <span class="material-symbols-outlined text-[16px]">edit</span>
                 </button>
                 <button onclick="event.preventDefault(); window.deleteMember(${member.id})" class="text-slate-400 hover:text-rose-500 p-1 ${member.isHead ? 'hidden' : ''}" title="Delete Member">
                     <span class="material-symbols-outlined text-[16px]">delete</span>
                 </button>
            </div>
        `;
        membersList.appendChild(a);
    });
}

function renderHeader() {
    const headSelect = document.getElementById('head-of-family-select');
    const greetingMsg = document.getElementById('greeting-message');
    const headDisplay = document.querySelector('.head-of-family-name-display');

    // Find Head
    const headOfFamily = appData.members.find(m => m.isHead) || appData.members[0];

    if (headOfFamily) {
        if (greetingMsg) greetingMsg.innerHTML = `Hey ${headOfFamily.name} 👋`;
        if (headDisplay) headDisplay.innerText = headOfFamily.name;
    }

    if (headSelect) {
        headSelect.innerHTML = '';
        appData.members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.innerText = member.name;
            if (member.isHead) option.selected = true;
            headSelect.appendChild(option);
        });
    }
}

function renderDashboard() {
    const currentYear = new Date().getFullYear();

    // 0. Calculate Annual Totals (All transactions matching current year)
    // Note: the appData.transactions currently only stores `date` (YYYY-MM-DD), so we get year from that.
    const yearTx = appData.transactions.filter(t => new Date(t.date).getFullYear() === currentYear);
    const annualIncome = yearTx.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const annualExpense = yearTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    const annualIncEl = document.getElementById('annual-total-income');
    const annualExpEl = document.getElementById('annual-total-expense');
    if (annualIncEl) annualIncEl.innerText = `₹${annualIncome.toLocaleString()}`;
    if (annualExpEl) annualExpEl.innerText = `₹${annualExpense.toLocaleString()}`;

    // 1. Filter transactions by current month & year
    const monthTx = appData.transactions.filter(t => {
        const txDate = new Date(t.date);
        return t.month === currentMonth && txDate.getFullYear() === currentYear;
    });

    // 2. Calculate Totals
    const totalIncome = monthTx.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = monthTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    // Using optional chaining/checks in case DOM elements aren't strictly where they used to be 
    const incEl = document.getElementById('total-income');
    const expEl = document.getElementById('total-expense');
    const pieEl = document.getElementById('pie-total-expense');

    if (incEl) incEl.innerText = `₹${totalIncome.toLocaleString()}`;
    if (expEl) expEl.innerText = `₹${totalExpense.toLocaleString()}`;
    if (pieEl) pieEl.innerText = `₹${totalExpense >= 1000 ? (totalExpense / 1000).toFixed(1) + 'k' : totalExpense}`;

    // 3. Spending by Member
    const memberSpent = {};
    appData.members.forEach(m => memberSpent[m.id] = 0);

    monthTx.filter(t => t.type === 'expense').forEach(t => {
        if (memberSpent[t.memberId] !== undefined) {
            memberSpent[t.memberId] += t.amount;
        }
    });

    renderPieChart(memberSpent, totalExpense);
    renderMemberSpendingList(memberSpent, totalExpense);

    // 4. Expenses by Category
    const categorySpent = {};
    EXPENSE_CATEGORIES.forEach(c => categorySpent[c] = 0);

    monthTx.filter(t => t.type === 'expense').forEach(t => {
        if (categorySpent[t.category] !== undefined) {
            categorySpent[t.category] += t.amount;
        } else { // Categorize anything unknown as household to be safe, or add dynamic categories.
            categorySpent[t.category] = t.amount;
        }
    });

    renderCategorySummary(categorySpent);
}

function renderPieChart(memberSpent, totalExpense) {
    const svg = document.getElementById('spending-pie-chart');
    // Keep background circle
    svg.innerHTML = '<circle cx="18" cy="18" fill="transparent" r="16" stroke="#f1f5f9" stroke-width="4" class="dark:stroke-slate-800"></circle>';

    if (totalExpense === 0) return;

    let cumulativePercentage = 0;
    let colorIndex = 0;

    appData.members.forEach((member) => {
        const spent = memberSpent[member.id] || 0;
        if (spent > 0) {
            const percentage = (spent / totalExpense) * 100;
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", "18");
            circle.setAttribute("cy", "18");
            circle.setAttribute("fill", "transparent");
            circle.setAttribute("r", "16");
            circle.setAttribute("stroke", COLORS[colorIndex % COLORS.length]);
            circle.setAttribute("stroke-width", "4");

            // Circumference of r=16 is 2 * pi * 16 ≈ 100.5. We use 100 in dasharray generally (approx)
            circle.setAttribute("stroke-dasharray", `${percentage} 100`);
            circle.setAttribute("stroke-dashoffset", `-${cumulativePercentage}`);

            svg.appendChild(circle);

            cumulativePercentage += percentage;
            colorIndex++;
        }
    });
}

function renderMemberSpendingList(memberSpent, totalExpense) {
    const container = document.getElementById('member-spending-list');
    container.innerHTML = '';

    let colorIndex = 0;

    // Sort by spending descending, then alphabetically by name
    const sortedMembers = appData.members.map(m => ({ ...m, spent: memberSpent[m.id] || 0 }))
        .sort((a, b) => b.spent !== a.spent ? b.spent - a.spent : a.name.localeCompare(b.name));

    sortedMembers.forEach(member => {
        const percentage = totalExpense > 0 ? ((member.spent / totalExpense) * 100).toFixed(1) : "0.0";
        const color = COLORS[colorIndex % COLORS.length];

        const div = document.createElement('div');
        div.innerHTML = `
            <div class="flex justify-between text-sm mb-2">
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full" style="background-color: ${color}"></div>
                    <span class="font-semibold text-slate-700 dark:text-slate-300">${member.name}</span>
                </div>
                <span class="font-bold text-slate-900 dark:text-white">₹${member.spent.toLocaleString()}</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div class="h-full rounded-full" style="width: ${percentage}%; background-color: ${color}"></div>
            </div>
        `;
        container.appendChild(div);
        colorIndex++;
    });
}

function renderCategorySummary(categorySpent) {
    const container = document.getElementById('category-summary-list');
    container.innerHTML = '';

    // Filter categories that have > 0 spending
    const activeCategories = Object.keys(categorySpent).map(key => ({
        name: key,
        amount: categorySpent[key]
    })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

    if (activeCategories.length === 0) {
        container.innerHTML = '<p class="text-sm text-slate-400">No expenses recorded.</p>';
        return;
    }

    activeCategories.forEach((cat) => {
        const div = document.createElement('div');
        div.className = "category-item";
        div.innerHTML = `
            <span class="text-sm font-medium text-slate-600 dark:text-slate-400">${cat.name}</span>
            <span class="text-sm font-bold text-slate-800 dark:text-white">₹${cat.amount.toLocaleString()}</span>
        `;
        container.appendChild(div);
    });
}


function renderMemberPage() {
    const member = appData.members.find(m => m.id === currentMemberId);
    if (!member) return;

    // Header updates
    document.getElementById('header-member-name').innerText = member.name;
    document.getElementById('page-title-name').innerText = `${member.name} - Transactions`;

    // Calculate totals for ALL time for this member (or we can filter by month if preferred, but usually member history is total until filtered. The UI didn't specify month filter on member page, I hid it, so let's do total).
    const memberTx = appData.transactions.filter(t => t.memberId === currentMemberId);

    // Sort transactions by date descending
    memberTx.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate All-Time & Current Year Stats
    const currentYear = new Date().getFullYear();
    let totalIncome = 0;
    let totalExpense = 0;
    let annualIncome = 0;
    let annualExpense = 0;

    memberTx.forEach(t => {
        const txYear = new Date(t.date).getFullYear();

        if (t.type === 'income') {
            totalIncome += t.amount;
            if (txYear === currentYear) annualIncome += t.amount;
        } else {
            totalExpense += t.amount;
            if (txYear === currentYear) annualExpense += t.amount;
        }
    });

    const balance = totalIncome - totalExpense;

    document.getElementById('member-total-income').innerText = `₹${totalIncome.toLocaleString()}`;
    document.getElementById('member-total-expense').innerText = `₹${totalExpense.toLocaleString()}`;
    document.getElementById('member-current-balance').innerText = `₹${balance.toLocaleString()}`;

    const annualMemberIncEl = document.getElementById('annual-member-income');
    const annualMemberExpEl = document.getElementById('annual-member-expense');
    if (annualMemberIncEl) annualMemberIncEl.innerText = `₹${annualIncome.toLocaleString()}`;
    if (annualMemberExpEl) annualMemberExpEl.innerText = `₹${annualExpense.toLocaleString()}`;

    // Expense Alert Logic
    const alertBanner = document.getElementById('expense-alert-banner');
    if (member.alertThreshold && totalExpense >= member.alertThreshold) {
        alertBanner.classList.remove('hidden');
    } else {
        alertBanner.classList.add('hidden');
    }

    // Render Table
    const tbody = document.getElementById('transactions-tbody');
    tbody.innerHTML = '';

    if (memberTx.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500 text-sm">No transactions found.</td></tr>`;
        return;
    }

    // Calculate running balance per row (requires traversing chronological, which is reverse of our display array)
    // Actually, running balance means balance at that day.
    // Let's compute it:
    let runningBalance = balance;

    memberTx.forEach((t) => {
        const formattedDate = new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const amountDisplay = t.type === 'income' ? `+₹${t.amount.toLocaleString()}` : `-₹${t.amount.toLocaleString()}`;
        const amountClass = t.type === 'income' ? 'text-emerald-600' : 'text-rose-500';

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group';
        tr.innerHTML = `
            <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">${formattedDate}</td>
            <td class="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">${t.description}</td>
            <td class="px-6 py-4">
                <span class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold py-1 px-3 rounded-full">${t.category}</span>
            </td>
            <td class="px-6 py-4 text-sm font-bold ${amountClass}">${amountDisplay}</td>
            <td class="px-6 py-4 text-right text-sm font-medium text-slate-600 dark:text-slate-400">₹${runningBalance.toLocaleString()}</td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="editTransaction(${t.id})" class="text-slate-400 hover:text-primary transition-colors">
                        <span class="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button onclick="deleteTransaction(${t.id})" class="text-slate-400 hover:text-rose-500 transition-colors">
                        <span class="material-symbols-outlined text-xl">delete</span>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);

        // Reverse running balance for the next row down (older transaction)
        runningBalance = t.type === 'income' ? runningBalance - t.amount : runningBalance + t.amount;
    });
}

window.editTransaction = function (txId) {
    const tx = appData.transactions.find(t => t.id === txId);
    if (!tx) return;

    editingTransactionId = txId;

    // Populate the form fields with transaction data
    document.getElementById('tx-date').value = tx.date;
    document.getElementById('tx-desc').value = tx.description;
    document.getElementById('tx-category').value = tx.category;
    document.getElementById('tx-type').value = tx.type;
    document.getElementById('tx-amount').value = tx.amount;

    // Change button text and scroll up
    const submitBtn = document.getElementById('submit-tx-btn');
    if (submitBtn) submitBtn.innerText = 'Update Transaction';

    // Smooth scroll to top to ensure user sees the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteTransaction = function (txId) {
    if (confirm("Are you sure you want to delete this transaction?")) {
        appData.transactions = appData.transactions.filter(t => t.id !== txId);
        saveData();
        renderAll();
    }
};

window.editMemberName = function (memberId) {
    const member = appData.members.find(m => m.id === memberId);
    if (!member) return;

    const newName = prompt("Enter new name for " + member.name + ":", member.name);
    if (newName && newName.trim() !== "") {
        member.name = newName.trim();
        saveData();
        renderAll();
    }
};

window.deleteMember = function (memberId) {
    const member = appData.members.find(m => m.id === memberId);
    if (!member || member.isHead) return; // Cannot delete head

    if (confirm(`Are you sure you want to completely remove ${member.name} and all their transactions? This action cannot be undone.`)) {
        // Remove member
        appData.members = appData.members.filter(m => m.id !== memberId);

        // Remove their transactions
        appData.transactions = appData.transactions.filter(t => t.memberId !== memberId);

        saveData();

        // If we sequence a delete from the member's own page, redirect home
        if (currentPage === 'member' && currentMemberId === memberId) {
            window.location.href = 'index.html';
        } else {
            renderAll();
        }
    }
};

// --- Event Listeners ---
function setupEventListeners() {
    // Add Member Flow
    const addMemberBtn = document.getElementById('add-member-btn');
    const addMemberForm = document.getElementById('add-member-form');
    const saveMemberBtn = document.getElementById('save-member-btn');
    const cancelMemberBtn = document.getElementById('cancel-member-btn');
    const newMemberName = document.getElementById('new-member-name');

    addMemberBtn.addEventListener('click', () => {
        addMemberForm.classList.remove('hidden');
        addMemberForm.classList.add('animate-slideDown');
        addMemberBtn.classList.add('hidden');
        newMemberName.focus();
    });

    const closeForm = () => {
        addMemberForm.classList.add('hidden');
        addMemberForm.classList.remove('animate-slideDown');
        addMemberBtn.classList.remove('hidden');
        newMemberName.value = '';
    }

    cancelMemberBtn.addEventListener('click', closeForm);

    saveMemberBtn.addEventListener('click', () => {
        const name = newMemberName.value.trim();
        if (name) {
            const newId = appData.members.length > 0 ? Math.max(...appData.members.map(m => m.id)) + 1 : 1;
            appData.members.push({
                id: newId,
                name: name,
                isHead: appData.members.length === 0 // Make head if first member
            });
            saveData();
            renderAll();
            closeForm();
        }
    });

    // Change Head of Family
    const headSelect = document.getElementById('head-of-family-select');
    if (headSelect) {
        headSelect.addEventListener('change', (e) => {
            const newHeadId = parseInt(e.target.value);
            appData.members.forEach(m => m.isHead = (m.id === newHeadId));
            saveData();
            renderHeader();
            // Changing head of family might not change dash data, but we re-render just to keep states synced if needed.
        });
    }

    // Month Filter
    const monthFilter = document.getElementById('month-filter');
    if (monthFilter) {
        monthFilter.addEventListener('change', (e) => {
            currentMonth = parseInt(e.target.value);
            renderDashboard(); // Re-render numbers based on new month
        });
    }

    // --- Member Page Specific Listeners ---
    if (currentPage === 'member') {
        const addTxForm = document.getElementById('add-transaction-form');
        if (addTxForm) {
            addTxForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const date = document.getElementById('tx-date').value;
                const desc = document.getElementById('tx-desc').value.trim();
                const category = document.getElementById('tx-category').value;
                const type = document.getElementById('tx-type').value;
                const amount = parseFloat(document.getElementById('tx-amount').value);

                if (date && desc && category && type && !isNaN(amount)) {

                    // --- New Balance Validation Logic ---
                    if (type === 'expense') {
                        // Calculate current working balance for this member
                        const mTx = appData.transactions.filter(t => t.memberId === currentMemberId);
                        let inc = 0, exp = 0;
                        mTx.forEach(t => {
                            // Exclude the transaction we are currently editing from the math
                            if (t.id === editingTransactionId) return;
                            if (t.type === 'income') inc += t.amount; else exp += t.amount;
                        });
                        const currentBalance = inc - exp;

                        if (amount > currentBalance) {
                            alert("Insufficient Balance: Expense exceeds available funds.");
                            return; // Stop transaction
                        }
                    }

                    // Parse date to extract month for global filtering on home page
                    const txMonth = new Date(date).getMonth();

                    if (editingTransactionId) {
                        // --- Update Existing ---
                        const txIndex = appData.transactions.findIndex(t => t.id === editingTransactionId);
                        if (txIndex !== -1) {
                            appData.transactions[txIndex] = {
                                ...appData.transactions[txIndex],
                                date: date,
                                month: txMonth,
                                description: desc,
                                category: category,
                                type: type,
                                amount: amount
                            };
                        }
                        editingTransactionId = null;
                        document.getElementById('submit-tx-btn').innerText = 'Add Transaction';
                    } else {
                        // --- Create New ---
                        const newId = appData.transactions.length > 0 ? Math.max(...appData.transactions.map(t => t.id)) + 1 : 1;
                        appData.transactions.push({
                            id: newId,
                            memberId: currentMemberId,
                            date: date,
                            month: txMonth,
                            description: desc,
                            category: category,
                            type: type,
                            amount: amount
                        });
                    }

                    saveData();
                    renderAll();
                    addTxForm.reset();
                    // Set default date to today to be helpful
                    document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
                }
            });
            // Init date field
            document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
        }

        const setAlertBtn = document.getElementById('set-alert-btn');
        if (setAlertBtn) {
            setAlertBtn.addEventListener('click', () => {
                const member = appData.members.find(m => m.id === currentMemberId);
                const currentAlert = member.alertThreshold || "";
                const newAlertStr = prompt(`Set Expense Alert Threshold for ${member.name} (in ₹):`, currentAlert);

                if (newAlertStr !== null) {
                    const newAlert = parseFloat(newAlertStr);
                    if (!isNaN(newAlert) && newAlert >= 0) {
                        member.alertThreshold = newAlert;
                        saveData();
                        renderAll();
                    } else if (newAlertStr.trim() === '') {
                        // Clear alert
                        delete member.alertThreshold;
                        saveData();
                        renderAll();
                    } else {
                        alert("Please enter a valid amount.");
                    }
                }
            });
        }
    }
}

// Boot
document.addEventListener('DOMContentLoaded', init);

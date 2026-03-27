// Приложение для управления финансами и учётом товаров
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация данных из localStorage
    let finances = JSON.parse(localStorage.getItem('finances')) || [];
    let workRecords = JSON.parse(localStorage.getItem('workRecords')) || [];
    let debts = JSON.parse(localStorage.getItem('debts')) || [];

    // ==================== ВКЛАДКИ ====================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // ==================== ФИНАНСЫ ====================
    const financeForm = document.getElementById('finance-form');
    const financeTable = document.getElementById('finance-table').querySelector('tbody');

    function renderFinances() {
        financeTable.innerHTML = '';
        let totalIncome = 0;
        let totalExpense = 0;

        finances.forEach((item, index) => {
            if (item.type === 'income') {
                totalIncome += parseFloat(item.amount);
            } else {
                totalExpense += parseFloat(item.amount);
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span class="type-${item.type}">${item.type === 'income' ? 'Доход' : 'Расход'}</span></td>
                <td>${item.description}</td>
                <td>${formatMoney(item.amount)}</td>
                <td>${formatDate(item.date)}</td>
                <td><button class="btn-delete" onclick="deleteFinance(${index})">Удалить</button></td>
            `;
            financeTable.appendChild(row);
        });

        document.getElementById('total-income').textContent = formatMoney(totalIncome);
        document.getElementById('total-expense').textContent = formatMoney(totalExpense);
        document.getElementById('total-balance').textContent = formatMoney(totalIncome - totalExpense);
        
        saveData();
    }

    financeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newFinance = {
            type: document.getElementById('finance-type').value,
            description: document.getElementById('finance-description').value,
            amount: document.getElementById('finance-amount').value,
            date: document.getElementById('finance-date').value
        };

        finances.push(newFinance);
        renderFinances();
        financeForm.reset();
        document.getElementById('finance-date').value = new Date().toISOString().split('T')[0];
    });

    window.deleteFinance = function(index) {
        if (confirm('Вы уверены, что хотите удалить эту запись?')) {
            finances.splice(index, 1);
            renderFinances();
        }
    };

    // ==================== РАБОТА (ТОВАРЫ) ====================
    const workForm = document.getElementById('work-form');
    const workTable = document.getElementById('work-table').querySelector('tbody');
    const workFilterBtns = document.querySelectorAll('#work .filter-btn');
    let currentWorkFilter = 'all';

    function renderWork(filter = 'all') {
        workTable.innerHTML = '';
        let totalLoaded = 0;
        let totalPlaced = 0;

        workRecords.forEach((item, index) => {
            if (item.docType === 'loaded') {
                totalLoaded += parseInt(item.quantity);
            } else {
                totalPlaced += parseInt(item.quantity);
            }

            // Фильтрация
            if (filter !== 'all') {
                if (filter === 'loaded' || filter === 'placed') {
                    if (item.docType !== filter) return;
                } else if (filter === 'tires' || filter === 'disks') {
                    if (item.productType !== filter) return;
                }
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.docType === 'loaded' ? 'Выгрузка' : 'Размещение'}</td>
                <td>${item.docNumber}</td>
                <td>${item.productType === 'tires' ? 'Шины' : 'Диски'}</td>
                <td>${item.productName}</td>
                <td>${item.quantity} шт</td>
                <td>${formatDate(item.date)}</td>
                <td><button class="btn-delete" onclick="deleteWork(${index})">Удалить</button></td>
            `;
            workTable.appendChild(row);
        });

        document.getElementById('total-loaded').textContent = totalLoaded + ' шт';
        document.getElementById('total-placed').textContent = totalPlaced + ' шт';
        document.getElementById('total-pending').textContent = (totalLoaded - totalPlaced) + ' шт';
        
        saveData();
    }

    workFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            workFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentWorkFilter = btn.dataset.filter;
            renderWork(currentWorkFilter);
        });
    });

    workForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newRecord = {
            docType: document.getElementById('work-doc-type').value,
            docNumber: document.getElementById('work-doc-number').value,
            productType: document.getElementById('work-product-type').value,
            productName: document.getElementById('work-product-name').value,
            quantity: document.getElementById('work-quantity').value,
            date: document.getElementById('work-date').value
        };

        workRecords.push(newRecord);
        renderWork(currentWorkFilter);
        workForm.reset();
        document.getElementById('work-date').value = new Date().toISOString().split('T')[0];
    });

    window.deleteWork = function(index) {
        if (confirm('Вы уверены, что хотите удалить эту запись?')) {
            workRecords.splice(index, 1);
            renderWork(currentWorkFilter);
        }
    };

    // ==================== ДОЛГИ ====================
    const debtsForm = document.getElementById('debts-form');
    const debtsTable = document.getElementById('debts-table').querySelector('tbody');
    const debtsFilterBtns = document.querySelectorAll('#debts .filter-btn');
    let currentDebtsFilter = 'all';

    function renderDebts(filter = 'all') {
        debtsTable.innerHTML = '';
        let totalReceivable = 0;
        let totalPayable = 0;

        const today = new Date().toISOString().split('T')[0];

        debts.forEach((item, index) => {
            if (item.type === 'receivable') {
                totalReceivable += parseFloat(item.amount);
            } else {
                totalPayable += parseFloat(item.amount);
            }

            // Фильтрация
            if (filter !== 'all' && item.type !== filter) return;

            // Определение статуса
            let status = 'active';
            let statusText = 'Активен';
            if (item.completed) {
                status = 'completed';
                statusText = 'Погашен';
            } else if (item.dueDate && item.dueDate < today) {
                status = 'overdue';
                statusText = 'Просрочен';
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span class="type-${item.type === 'receivable' ? 'income' : 'expense'}">${item.type === 'receivable' ? 'Нам должны' : 'Мы должны'}</span></td>
                <td>${item.person}</td>
                <td>${item.description}</td>
                <td>${formatMoney(item.amount)}</td>
                <td>${formatDate(item.date)}</td>
                <td>${item.dueDate ? formatDate(item.dueDate) : '-'}</td>
                <td><span class="status-badge status-${status}">${statusText}</span></td>
                <td>
                    ${!item.completed ? `<button class="btn-complete" onclick="completeDebt(${index})">Погасить</button>` : ''}
                    <button class="btn-delete" onclick="deleteDebt(${index})">Удалить</button>
                </td>
            `;
            debtsTable.appendChild(row);
        });

        document.getElementById('total-receivable').textContent = formatMoney(totalReceivable);
        document.getElementById('total-payable').textContent = formatMoney(totalPayable);
        document.getElementById('total-debt-net').textContent = formatMoney(totalReceivable - totalPayable);
        
        saveData();
    }

    debtsFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            debtsFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDebtsFilter = btn.dataset.filter;
            renderDebts(currentDebtsFilter);
        });
    });

    debtsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newDebt = {
            type: document.getElementById('debt-type').value,
            person: document.getElementById('debt-person').value,
            description: document.getElementById('debt-description').value,
            amount: document.getElementById('debt-amount').value,
            date: document.getElementById('debt-date').value,
            dueDate: document.getElementById('debt-due-date').value,
            completed: false
        };

        debts.push(newDebt);
        renderDebts(currentDebtsFilter);
        debtsForm.reset();
        document.getElementById('debt-date').value = new Date().toISOString().split('T')[0];
    });

    window.completeDebt = function(index) {
        debts[index].completed = true;
        renderDebts(currentDebtsFilter);
    };

    window.deleteDebt = function(index) {
        if (confirm('Вы уверены, что хотите удалить эту запись?')) {
            debts.splice(index, 1);
            renderDebts(currentDebtsFilter);
        }
    };

    // ==================== ОТЧЁТЫ ====================
    const generateReportBtn = document.getElementById('generate-report');
    const reportMonthInput = document.getElementById('report-month');

    // Установка текущего месяца
    const now = new Date();
    reportMonthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    generateReportBtn.addEventListener('click', () => {
        const selectedMonth = reportMonthInput.value;
        const [year, month] = selectedMonth.split('-');
        
        // Финансовый отчёт
        const monthFinances = finances.filter(f => {
            const fDate = new Date(f.date);
            return fDate.getFullYear() == year && String(fDate.getMonth() + 1).padStart(2, '0') === month;
        });
        
        const income = monthFinances.filter(f => f.type === 'income').reduce((sum, f) => sum + parseFloat(f.amount), 0);
        const expense = monthFinances.filter(f => f.type === 'expense').reduce((sum, f) => sum + parseFloat(f.amount), 0);
        
        document.getElementById('finance-report').innerHTML = `
            <p><strong>Период:</strong> ${month}.${year}</p>
            <p><strong>Доходы:</strong> ${formatMoney(income)}</p>
            <p><strong>Расходы:</strong> ${formatMoney(expense)}</p>
            <p><strong>Прибыль:</strong> ${formatMoney(income - expense)}</p>
            <p><strong>Всего операций:</strong> ${monthFinances.length}</p>
        `;

        // Отчёт по товарам
        const monthWork = workRecords.filter(w => {
            const wDate = new Date(w.date);
            return wDate.getFullYear() == year && String(wDate.getMonth() + 1).padStart(2, '0') === month;
        });
        
        const loaded = monthWork.filter(w => w.docType === 'loaded').reduce((sum, w) => sum + parseInt(w.quantity), 0);
        const placed = monthWork.filter(w => w.docType === 'placed').reduce((sum, w) => sum + parseInt(w.quantity), 0);
        const tires = monthWork.filter(w => w.productType === 'tires').reduce((sum, w) => sum + parseInt(w.quantity), 0);
        const disks = monthWork.filter(w => w.productType === 'disks').reduce((sum, w) => sum + parseInt(w.quantity), 0);
        
        document.getElementById('work-report').innerHTML = `
            <p><strong>Период:</strong> ${month}.${year}</p>
            <p><strong>Выгружено:</strong> ${loaded} шт</p>
            <p><strong>Размещено:</strong> ${placed} шт</p>
            <p><strong>В ожидании:</strong> ${loaded - placed} шт</p>
            <p><strong>Шины:</strong> ${tires} шт</p>
            <p><strong>Диски:</strong> ${disks} шт</p>
            <p><strong>Всего записей:</strong> ${monthWork.length}</p>
        `;

        // Отчёт по долгам
        const monthDebts = debts.filter(d => {
            const dDate = new Date(d.date);
            return dDate.getFullYear() == year && String(dDate.getMonth() + 1).padStart(2, '0') === month;
        });
        
        const receivable = monthDebts.filter(d => d.type === 'receivable').reduce((sum, d) => sum + parseFloat(d.amount), 0);
        const payable = monthDebts.filter(d => d.type === 'payable').reduce((sum, d) => sum + parseFloat(d.amount), 0);
        const completed = monthDebts.filter(d => d.completed).length;
        
        document.getElementById('debts-report').innerHTML = `
            <p><strong>Период:</strong> ${month}.${year}</p>
            <p><strong>Нам должны:</strong> ${formatMoney(receivable)}</p>
            <p><strong>Мы должны:</strong> ${formatMoney(payable)}</p>
            <p><strong>Нетто:</strong> ${formatMoney(receivable - payable)}</p>
            <p><strong>Погашено:</strong> ${completed} из ${monthDebts.length}</p>
        `;
    });

    // ==================== УТИЛИТЫ ====================
    function formatMoney(amount) {
        return parseFloat(amount).toLocaleString('ru-RU', { 
            style: 'currency', 
            currency: 'RUB',
            minimumFractionDigits: 2
        });
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU');
    }

    function saveData() {
        localStorage.setItem('finances', JSON.stringify(finances));
        localStorage.setItem('workRecords', JSON.stringify(workRecords));
        localStorage.setItem('debts', JSON.stringify(debts));
    }

    // ==================== ИНИЦИАЛИЗАЦИЯ ====================
    // Установка сегодняшней даты в формы
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('finance-date').value = today;
    document.getElementById('work-date').value = today;
    document.getElementById('debt-date').value = today;

    // Первоначальная отрисовка
    renderFinances();
    renderWork();
    renderDebts();
});

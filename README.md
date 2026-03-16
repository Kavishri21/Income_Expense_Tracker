# Family Income & Expense Tracker

A responsive, client-side web application designed to help households track shared finances, monitor individual member spending, and maintain a clear ledger of income and expenses.

View the live application here: [Live Demo](https://income-expense-tracker-brown.vercel.app/)

## Features

### Dashboard Overview
* **Family Summaries**: Real-time aggregation of Total Monthly Income, Total Monthly Expense, Annual Family Income, and Annual Family Expense.
* **Dynamic Distribution**: Visual pie chart representing the proportional spending of each family member.
* **Category Breakdown**: Automatic categorization of expenses (Food, Household, Transport, Medical, etc.) for deeper insights.
* **Monthly Filtering**: Instantly filter the entire dashboard view by specific months to review historical performance.

### Individual Member Tracking
* **Dedicated Dashboards**: Each family member has an isolated view tracking their specific transaction history, annual totals, and current working balance.
* **Full-Featured Ledger**: Add, edit, and delete transactions with an intuitive, full-width form.
* **Expense Alerts**: Set custom spending thresholds per member. The application will flag accounts that exceed their designated limit.
* **Balance Assurance**: Built-in validation prevents logging expenses that would drop a member's balance below zero.

### Member Management
* **Dynamic Roster**: Add new family members directly from the sidebar.
* **Inline Editing**: Quickly rename members or remove them (along with their transaction history) via an accessible hover menu within the sidebar navigation.
* **Head of Family Role**: Designate a primary user to personalize the dashboard greeting.

## Architecture & Technology Stack

This project was built emphasizing separation of concerns and runs entirely in the browser using:

* **HTML5**: Semantic document structure across multiple pages (`index.html`, `member.html`).
* **CSS3**: Custom styling and layout logic handled via `style.css`, augmented heavily by **Tailwind CSS** (via CDN) for rapid utility-based UI design.
* **JavaScript (ES6)**: Vanilla JS driving all calculations, DOM manipulation, state management, and data synchronization in `script.js`.
* **Local Storage API**: Persistent, client-side data storage ensuring records remain intact across sessions without the need for a backend database.
* **Google Fonts & Material Symbols**: Utilizing 'Inter' for typography and Material Symbols 'Outlined' for a clean, modern iconography system.

## Local Setup

As a purely client-side application, no build steps or local servers are strictly required. 

1. Clone this repository to your local machine:
```bash
git clone https://github.com/yourusername/income-expense-tracker.git
```
2. Navigate to the project directory:
```bash
cd income-expense-tracker
```
3. Open `index.html` directly in any modern web browser to run the application.

## Usage Guide

1. **Initialization**: On first load, the application starts with a blank slate containing a single "Head of Family".
2. **Adding Members**: Use the `+ Add Member` button in the sidebar to populate your household roster.
3. **Logging Data**: Navigate to a specific member's page via the sidebar to begin logging Income or Expense transactions.
4. **Synchronization**: All data entered on individual member pages instantly aggregates and updates the visualizations on the main Home dashboard.

## Data Structure

The application serializes its working state to the browser's Local Storage under the key `family_finance_tracker_data_v2`. The schema is structured as follows:

```json
{
  "members": [
    { "id": 1, "name": "Head of Family", "isHead": true }
  ],
  "transactions": [
    {
      "id": 1,
      "memberId": 1,
      "date": "2023-10-15",
      "month": 9,
      "description": "Groceries",
      "category": "Food",
      "type": "expense",
      "amount": 1050
    }
  ]
}
```

# BigQuery Release Notes Tracker

An elegant, responsive dashboard built with Python Flask (backend) and vanilla HTML, CSS, and JavaScript (frontend) to monitor Google Cloud BigQuery release notes, filter updates, export data, and share details directly to Twitter/X.

## 🚀 Features

- **GCP Feed Proxy:** Fetches and proxies the official BigQuery Atom release feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`) to bypass browser CORS policies.
- **Granular Updates:** Automatically splits daily grouped feed updates into individual, discrete cards (categorized as *Feature*, *Announcement*, *Issue*, *Breaking Change*, or *General Change*).
- **Search & Filters:** Real-time client-side keyword search and quick-filter category pills.
- **Insights Stats Bar:** Interactive summary indicators displaying total counts and sub-counts by category.
- **Tweet Composer Modal:** Build pre-formatted tweets using templates (📢 News, 💻 Tech Details, ⚡ Short), featuring standard character count meters (max 280 chars) and instant redirects to X (Twitter) Web Intents.
- **Utility Integrations:** 
  - **Copy Text:** Copy clean, plain-text descriptions of individual updates directly to the clipboard.
  - **Export CSV:** Instantly download currently filtered lists as a cleanly formatted CSV file.
- **Premium Aesthetics:** Curated dark theme incorporating modern typography (Inter), glassmorphic elements, type-specific visual accents, and smooth transition animations.

---

## 📁 Project Structure

```text
bq-releases-notes/
│
├── app.py                # Flask Backend (Feed fetching, custom parsing API)
├── templates/
│   └── index.html        # Main Dashboard Layout & Modal Elements
│
├── static/
│   ├── css/
│   │   └── styles.css    # Responsive theme styling & layout rules
│   └── js/
│       └── app.js        # DOMParser parser, filters, composer logic
│
└── .gitignore            # Git exclusions
```

---

## 🛠️ Getting Started

### Prerequisites

- **Python 3.x**
- **pip** (Python package installer)

### Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/negso98/neg-event-talks-app.git
   cd neg-event-talks-app
   ```

2. **Install dependencies:**
   This project relies solely on standard library packages on top of the Flask framework:
   ```bash
   pip install flask
   ```

3. **Run the application:**
   ```bash
   python app.py
   ```

4. **Access the dashboard:**
   Open your browser and navigate to **[http://localhost:5000](http://localhost:5000)**.

---

## ⚙️ Technical Highlights

- **Server-Side parsing:** [app.py](app.py) handles XML parsing utilizing Python's built-in `xml.etree.ElementTree` inside the standard namespace structure.
- **Client-Side HTML parsing:** [app.js](static/js/app.js) reads the daily raw content blocks and splits them into distinct entries by iterating through node sequences using the browser's `DOMParser()`.
- **CORS Mitigation:** Fetching the Google RSS feed from the Flask backend solves browser-side CORS blocks.

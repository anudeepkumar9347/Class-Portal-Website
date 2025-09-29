# Class Portal Website

A lightweight, modern, and easy-to-update website for students to view class announcements, register for events, and access resources.

## ✨ Features

- **Modern UI:** Clean, card-based design.
- **Responsive:** Works on mobile, tablet, and desktop.
- **Dark/Light Mode:** Toggle between themes.
- **Dynamic Content:** Announcements and events are loaded from JSON files, making them easy to update without changing the code.
- **Search:** Filter announcements on the updates page.
- **Modals:** View announcement details in a clean pop-up window.
- **Easy Deployment:** Ready to be deployed on Netlify.

## Pages

- **Home (`index.html`):** A hero section, latest announcements, and quick links.
- **Updates (`updates.html`):** A full list of all announcements with a search bar.
- **Events (`events.html`):** A list of upcoming events with registration links.
- **Resources (`resources.html`):** Organized links to notes, slides, and other materials.
- **About (`about.html`):** Information about class representatives and faculty.

## 🚀 Getting Started

### 1. Customize the Content

1.  **Announcements:** Open `data/announcements.json` and add or edit the announcement objects.
    ```json
    [
      {
        "date": "YYYY-MM-DD",
        "title": "Your Announcement Title",
        "description": "A detailed description of the announcement."
      }
    ]
    ```
2.  **Events:** Open `data/events.json` and update the event details. Replace `"form_url"` with your Google Form link for registration.
    ```json
    [
      {
        "date": "YYYY-MM-DD",
        "title": "Your Event Title",
        "description": "A description of the event.",
        "form_url": "https://your-google-form-link"
      }
    ]
    ```
3.  **Resources:** Open `resources.html` and replace the placeholder `href` values with your actual links to Google Drive, Dropbox, etc.
4.  **About Page:** Open `about.html` and update the names and contact information.

### 2. Test Locally

Open the `index.html` file in your web browser to see your changes and test the website.



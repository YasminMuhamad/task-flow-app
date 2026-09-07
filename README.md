# 🌿 Kora — Collaborative Task Management App

Kora is a modern mobile application designed for collaborative task and project management. Built with React Native, Expo, and Firebase, it offers an intuitive workflow for teams to manage tasks, track project progress, organize subtasks, and archive completed work.

---

## 🎨 Design System

The app follows a minimalist, content-focused UI/UX approach with soft card elevations, rounded corners (12px–16px), and a balanced color palette:

- **Primary / Actions:** `#566551` (Olive Sage Green)
- **Cards / Containers:** `#C5D5E4` (Soft Ice Blue)
- **Background:** `#F8F9FA` (Off-White)
- **Text:** `#1E293B` (Dark Charcoal Slate)
- **Typography:** Fraunces (Brand logo) & Clean Sans-serif (UI body and controls)

---

## 💡 Key Features & Screens

### 1. Onboarding & Authentication
* **Splash & Onboarding:** Smooth entry flow with a 3-step feature introduction carousel.
* **Auth System:** Email/Password authentication, Google SSO integration, and a password recovery flow.

### 2. Dashboard & Projects
* **Projects Overview:** Cards displaying active projects, progress indicator bars, and project member avatar stacks.
* **Quick Stats:** Overview metrics highlighting deadlines and task completion status.

### 3. Task Management
* **Project Details:** Filter tasks by state (`All`, `To Do`, `In Progress`, `Done`).
* **Task Item Actions:** Quick priority badges (`High`, `Med`, `Low`), due dates, and status toggles.
* **Detailed Task View:** 
  * Full descriptions and file/image attachment previews.
  * Interactive subtask checklist.
  * Real-time team comments feed.
* **Create Task:** Bottom-sheet modal for adding new tasks with assignee selection and due dates.

### 4. Search, Archive & Notifications
* **Archived Tasks:** Dedicated screen (`ArchivedTasksScreen`) to manage archived tasks per project with support for restoring or permanently deleting tasks.
* **Search & Filters:** Global search across tasks, projects, and attachments.
* **Notifications & Settings:** Activity updates center, profile management, and preference controls.
* **Empty States:** Custom fallback UI components for empty lists and data views.

---

## 🛠️ Tech Stack

- **Framework:** React Native / Expo
- **Language:** TypeScript
- **Styling:** Tailwind CSS / NativeWind
- **Backend & Database:** Firebase (Authentication, Firestore, Cloud Storage)
- **State Management:** React Context API

---

## 📂 Project Structure

```text
taskflowapp/
├── assets/         # Images, fonts, and static assets
├── src/
│   ├── api/        # External services & API integrations
│   ├── components/ # Reusable UI components (Buttons, Cards, Modals)
│   ├── constants/  # Theme colors, typography, and constants
│   ├── context/    # React context state providers
│   ├── hooks/      # Custom React hooks
│   ├── screens/    # App screens (Dashboard, TaskDetail, ArchivedTasks, etc.)
│   ├── services/   # Firebase setup and database operations
│   ├── types/      # TypeScript interfaces and type definitions
│   └── utils/      # Helper utilities and date formatters
├── App.tsx         # Main entry point
└── package.json    # Project dependencies and scripts
```



## 🚀 Getting Started
### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo Go app on your mobile device (or an Android/iOS simulator)

### Setup Instructions
1. Clone the repository:
```bash
git clone [https://github.com/YasminMuhamad/task-flow-app.git](https://github.com/YasminMuhamad/task-flow-app.git)
cd task-flow-app
```
2. Install dependencies:
```bash
npm install
```
3. Configure Environment Variables:
Create a .env file in the root directory:

```text
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Run the app:
```bash
npx expo start
```

## 👤 Developer
Developed by Yasmin Muhammad
- GitHub: @YasminMuhamad
- Linkedin: yasminmuhammad
- Repository: task-flow-app

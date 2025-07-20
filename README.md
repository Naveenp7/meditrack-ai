# MediTrack AI - Healthcare Management System

## Overview

MediTrack AI is a comprehensive healthcare management system designed to streamline the interaction between doctors and patients. The application provides a user-friendly interface for managing medical records, appointments, prescriptions, and more, with separate dashboards for doctors and patients.

## Features

### For Doctors
- Dashboard with patient overview and upcoming appointments
- Patient management and medical record creation
- Prescription management
- Appointment scheduling and management
- Care plan creation and monitoring
- Referral management
- Emergency access approval

### For Patients
- Personal dashboard with health overview
- Appointment booking and management
- Medical record access
- Medication tracking and reminders
- Vital signs monitoring
- Family access management
- Insurance and billing information

### General Features
- Secure authentication and role-based access control
- Real-time data synchronization with Firebase
- Responsive design for desktop and mobile devices
- Dark/light theme support
- Notification system

## Technology Stack

- **Frontend**: React, TypeScript, Material-UI
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **State Management**: React Context API
- **Routing**: React Router
- **Data Visualization**: Chart.js

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/meditrack-ai.git
   cd meditrack-ai
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory with your Firebase configuration
   ```
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

4. Start the development server
   ```bash
   npm start
   # or
   yarn start
   ```

## Firebase Setup

### Authentication

1. Go to the Firebase Console and select your project
2. Navigate to Authentication > Sign-in method
3. Enable Email/Password authentication

### Firestore Database

1. Go to Firestore Database in the Firebase Console
2. Create a new database if you haven't already
3. Start in production mode
4. Set up the following collections:
   - `users`: Stores user information
   - `appointments`: Stores appointment data
   - `medicalRecords`: Stores patient medical records
   - `prescriptions`: Stores medication prescriptions
   - `vitals`: Stores patient vital signs
   - `reminders`: Stores medication and appointment reminders
   - `feedback`: Stores user feedback
   - `emergencyAccess`: Stores emergency access requests
   - `familyAccess`: Stores family access permissions
   - `carePlans`: Stores patient care plans
   - `referrals`: Stores patient referrals
   - `billing`: Stores billing information
   - `insurance`: Stores insurance information
   - `education`: Stores patient education resources

### Firebase Storage

1. Go to Storage in the Firebase Console
2. Set up storage if you haven't already
3. Create the following folders:
   - `profileImages`: For user profile pictures
   - `medicalRecordAttachments`: For medical record attachments
   - `insuranceCards`: For insurance card images
   - `educationResources`: For patient education files

### Firebase Security Rules

Add the following security rules to your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Common functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isDoctor() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'doctor';
    }
    
    function isPatient() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'patient';
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function hasPatientAccess(patientId) {
      return isDoctor() && 
        patientId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.patients;
    }
    
    function hasFamilyAccess(patientId) {
      return isPatient() && 
        request.auth.uid in get(/databases/$(database)/documents/familyAccess/$(patientId)).data.accessList;
    }
    
    function hasEmergencyAccess(patientId) {
      return isDoctor() && 
        exists(/databases/$(database)/documents/emergencyAccess/$(patientId + '_' + request.auth.uid)) && 
        get(/databases/$(database)/documents/emergencyAccess/$(patientId + '_' + request.auth.uid)).data.status == 'approved';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }
    
    // Appointments collection
    match /appointments/{appointmentId} {
      allow read: if isAuthenticated() && 
        (resource.data.patientId == request.auth.uid || 
         resource.data.doctorId == request.auth.uid || 
         hasPatientAccess(resource.data.patientId) || 
         hasFamilyAccess(resource.data.patientId));
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
        (resource.data.patientId == request.auth.uid || 
         resource.data.doctorId == request.auth.uid || 
         hasPatientAccess(resource.data.patientId));
      allow delete: if isDoctor() && resource.data.doctorId == request.auth.uid;
    }
    
    // Medical Records collection
    match /medicalRecords/{recordId} {
      allow read: if isAuthenticated() && 
        (resource.data.patientId == request.auth.uid || 
         resource.data.doctorId == request.auth.uid || 
         hasPatientAccess(resource.data.patientId) || 
         hasFamilyAccess(resource.data.patientId) || 
         hasEmergencyAccess(resource.data.patientId));
      allow create: if isDoctor();
      allow update: if isDoctor() && 
        (resource.data.doctorId == request.auth.uid || 
         hasPatientAccess(resource.data.patientId));
      allow delete: if isDoctor() && resource.data.doctorId == request.auth.uid;
    }
    
    // Apply similar rules to other collections
    // ...
  }
}
```

Add the following security rules to your Firebase Storage:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Common functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isDoctor() {
      return isAuthenticated() && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'doctor';
    }
    
    function isPatient() {
      return isAuthenticated() && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'patient';
    }
    
    // Profile images
    match /profileImages/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
    }
    
    // Medical record attachments
    match /medicalRecordAttachments/{recordId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isDoctor();
    }
    
    // Insurance cards
    match /insuranceCards/{userId}/{fileName} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isDoctor() || isAdmin());
      allow write: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
    }
    
    // Education resources
    match /educationResources/{fileId} {
      allow read: if isAuthenticated();
      allow write: if isDoctor() || isAdmin();
    }
  }
}
```

## Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/         # React context providers
├── firebase/         # Firebase configuration
├── hooks/            # Custom React hooks
├── pages/            # Application pages
│   ├── auth/         # Authentication pages
│   ├── doctor/       # Doctor dashboard and related pages
│   ├── landing/      # Landing page
│   └── patient/      # Patient dashboard and related pages
├── services/         # Firebase service functions
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── App.tsx           # Main application component
└── index.tsx         # Application entry point
```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

## License

This project is licensed under the MIT License.

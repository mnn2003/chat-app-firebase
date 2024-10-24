# Firebase Chat App

A real-time chat application built using **HTML**, **CSS**, **JavaScript**, **Bootstrap**, **Firebase** Authentication, and **Firestore** for backend data storage. The app allows users to sign up, log in, chat with other users, and send images in the chat. It also includes Google Authentication and user profile management.

## Features

- **User Authentication**: Users can sign up with an email and password or log in using Google authentication.
- **Real-time Messaging**: Send and receive text messages instantly between users.
- **Image Upload**: Users can attach and send images during a conversation.
- **User Search**: Find other users easily through the search feature.
- **Profile Settings**: Users can update their profile picture, display name, and change their password.
- **Responsive Design**: Fully responsive and mobile-friendly using Bootstrap.
  
## Tech Stack

- **Frontend**: HTML, CSS, Bootstrap, JavaScript
- **Backend**: Firebase Authentication, Firebase Firestore (database), Firebase Storage (for image upload)
- **Additional Libraries**:
  - FontAwesome for icons
  - Google Fonts for custom typography
  - Material Icons and Material Design for enhanced UI

## Installation and Setup

### Prerequisites

Before starting, ensure you have:

- Node.js installed (for dependency management if needed)
- Firebase account

### Firebase Setup

1. **Create a Firebase project**:
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Create a new project.
   
2. **Enable Authentication**:
   - In the Firebase Console, navigate to the "Authentication" section.
   - Enable the Email/Password provider.
   - Optionally, enable Google Sign-In in the "Sign-In Method" tab.

3. **Create Firestore Database**:
   - Go to "Firestore Database" in Firebase Console.
   - Create a Firestore database in "production mode."

4. **Enable Firebase Storage**:
   - In the Firebase Console, navigate to the "Storage" section.
   - Set up Firebase Storage for image uploads.

5. **Add Firebase SDK to your project**:
   - Go to the project settings in the Firebase Console.
   - Add a new web app, and copy the Firebase configuration keys.
   - Replace the placeholder configuration in `app.js` with your Firebase project credentials.

### Clone the Repository

```bash
git clone https://github.com/mnn2003/chat-app-firebase.git
cd chat-app-firebase

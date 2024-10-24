import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, updateProfile, updateEmail, reauthenticateWithCredential, EmailAuthProvider, updatePassword  } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, remove, ref, push, onValue, set, update, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { getStorage, uploadBytes, getDownloadURL, ref as storageRef } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js"; 

// Your web app's Firebase configuration
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth();
    const database = getDatabase();
    const storage = getStorage();

    const authContainer = document.getElementById('auth-container');
	const searchUserInput = document.getElementById('search-user-input');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const userListContainer = document.getElementById('user-list-container');
    const chatContainer = document.getElementById('chat-container');
    const userList = document.getElementById('user-list');
    const chatWindow = document.getElementById('chat-window');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const showSignupBtn = document.getElementById('show-signup-btn');
    const showLoginBtn = document.getElementById('show-login-btn');
    const sendBtn = document.getElementById('send-btn');
	const fileInput = document.getElementById('file');
	const messageInput = document.getElementById('message-input');
    const logoutBtn = document.getElementById('logout-btn');
    const authError = document.getElementById('auth-error');
    const chatWith = document.getElementById('chat-with');
    const backToUsersBtn = document.getElementById('back-to-users-btn');
	const googleLoginBtn = document.getElementById('google-login-btn');
	

    let currentUser = null;
    let selectedUser = null;
    let currentUserData = null;
	
    function getChatId(user1, user2) {
        return [user1.uid, user2.uid].sort().join('_');
    }

    showSignupBtn.addEventListener('click', () => {
        loginForm.classList.add('d-none');
        signupForm.classList.remove('d-none');
    });

    showLoginBtn.addEventListener('click', () => {
        signupForm.classList.add('d-none');
        loginForm.classList.remove('d-none');
    });
    
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            authContainer.classList.remove('d-none');
            userListContainer.classList.add('d-none');
            chatContainer.classList.add('d-none');
            currentUser = null;
            selectedUser = null;
        }).catch((error) => {
            console.error('Logout error:', error);
        });
    });

	googleLoginBtn.addEventListener('click', () => {
		const provider = new GoogleAuthProvider();
		signInWithPopup(auth, provider)
			.then((result) => {
				const user = result.user;

				set(ref(database, 'users/' + user.uid), {
					fullName: user.displayName,
					email: user.email,
					uid: user.uid,
					profilePicUrl: user.photoURL
				});
				currentUser = user;
				showUserList();
			})
			.catch((error) => {
				authError.textContent = error.message;
			});
	});
	
	fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        uploadImage(file);
    }
	});

	function uploadImage(file) {
		const imageRef = storageRef(storage, 'chat_images/' + Date.now() + '_' + file.name);
		uploadBytes(imageRef, file).then((snapshot) => {
			getDownloadURL(snapshot.ref).then((downloadURL) => {
				sendMessage(null, downloadURL);
			}).catch((error) => {
				console.error('Error getting download URL:', error);
			});
		}).catch((error) => {
			console.error('Error uploading image:', error);
		});
	}

    signupBtn.addEventListener('click', () => {
        const fullName = document.getElementById('signup-fullname').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const profilePic = document.getElementById('signup-profile-pic').files[0];

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;

                if (profilePic) {
                    const profilePicRef = storageRef(storage, 'profile_pics/' + user.uid);
                    uploadBytes(profilePicRef, profilePic).then((snapshot) => {
                        getDownloadURL(snapshot.ref).then((downloadURL) => {
                            set(ref(database, 'users/' + user.uid), {
                                fullName: fullName,
                                email: user.email,
                                uid: user.uid,
                                profilePicUrl: downloadURL
                            });
                            currentUser = user;
                            showUserList();
                        });
                    });
                } else {
                    set(ref(database, 'users/' + user.uid), {
                        fullName: fullName,
                        email: user.email,
                        uid: user.uid
                    });
                    currentUser = user;
                    showUserList();
                }
            })
            .catch((error) => {
                authError.textContent = error.message;
            });
    });

    loginBtn.addEventListener('click', () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                currentUser = user;
                showUserList();
            })
            .catch((error) => {
                authError.textContent = error.message;
            });
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            showUserList();
        } else {
            authContainer.classList.remove('d-none');
            userListContainer.classList.add('d-none');
            chatContainer.classList.add('d-none');
        }
    });
	
	function sendMessage(messageText, imageUrl) {
    const chatId = getChatId(currentUser, selectedUser);
    const chatRef = ref(database, `chats/${chatId}`);
    const newMessageRef = push(chatRef);

    const newMessage = {
        senderUid: currentUser.uid,
        text: messageText || '',
        imageUrl: imageUrl || '',
        timestamp: Date.now()
    };

    set(newMessageRef, newMessage).then(() => {
        updateLastMessage(currentUser.uid, selectedUser.uid, newMessage);
        updateLastMessage(selectedUser.uid, currentUser.uid, newMessage);
    });
}

function updateLastMessage(userUid, otherUserUid, message) {
    const lastMessageRef = ref(database, `users/${userUid}/recentChats/${otherUserUid}/lastMessage`);
    set(lastMessageRef, {
        text: message.text,
        imageUrl: message.imageUrl,
        timestamp: message.timestamp
    });
}

sendBtn.addEventListener('click', () => {
    const messageText = messageInput.value.trim();
    if (messageText) {
        sendMessage(messageText, null);
        messageInput.value = '';
    }
    messageInput.focus(); 
});

function showUserList() {
    authContainer.classList.add('d-none');
    userListContainer.classList.remove('d-none');

    const currentUserRef = ref(database, 'users/' + currentUser.uid);
    onValue(currentUserRef, (snapshot) => {
        currentUserData = snapshot.val();
        document.getElementById('current-user-name').textContent = currentUserData.fullName;
        document.getElementById('current-user-pic').src = currentUserData.profilePicUrl || 'https://firebasestorage.googleapis.com/v0/b/pq-hub-906ed.appspot.com/o/profile_pics%2F74eNKupoOpZGJ8aKzKVun0bt2Vn1?alt=media&token=c62ff39b-a500-4483-bd1e-30ecf9f9e48b'; 
    });

    loadUserList();
}

function loadUserList() {
    const usersRef = ref(database, 'users/');
    const searchUserInput = document.getElementById('search-user-input');
    searchUserInput.addEventListener('input', filterUserList);

    onValue(usersRef, (snapshot) => {
        const users = [];
        const fetchPromises = [];

        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            if (user.uid !== currentUser.uid) {
                // Fetch last message for each user
                fetchPromises.push(fetchLastMessageWithUser(user));
            }
        });

        // Once all last message data is fetched, sort and display users
        Promise.all(fetchPromises).then((usersWithLastMessages) => {
            // Sort users by last message timestamp (most recent at the top)
            usersWithLastMessages.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);

            // Store the sorted users data globally for filtering
            window.usersData = usersWithLastMessages;

            // Display sorted users
            displayUserList(usersWithLastMessages);
        }).catch((error) => {
            console.error('Error loading users or fetching messages:', error);
        });
    });

    const currentUserRef = ref(database, 'users/' + currentUser.uid);
    onValue(currentUserRef, (snapshot) => {
        currentUserData = snapshot.val();
        const currentUserProfilePic = currentUserData.profilePicUrl || 'https://firebasestorage.googleapis.com/v0/b/pq-hub-906ed.appspot.com/o/profile_pics%2F74eNKupoOpZGJ8aKzKVun0bt2Vn1?alt=media&token=c62ff39b-a500-4483-bd1e-30ecf9f9e48b';
        const currentUserPicElement = document.getElementById('current-user-pic');
        const currentUserNameElement = document.getElementById('current-user-name');
        if (currentUserPicElement && currentUserNameElement) {
            currentUserPicElement.src = currentUserProfilePic;
            currentUserNameElement.textContent = currentUserData.fullName;
        }
    });
}

function fetchLastMessageWithUser(user) {
    return new Promise((resolve, reject) => {
        const lastMessageRef = ref(database, `users/${currentUser.uid}/recentChats/${user.uid}/lastMessage`);
        
        get(lastMessageRef).then((snapshot) => {
            const lastMessage = snapshot.val() || { text: 'No message yet', imageUrl: '', timestamp: 0 };
            const displayMessage = lastMessage.imageUrl ? 'Photo' : lastMessage.text;
            
            resolve({
                user,
                lastMessage: displayMessage,
                lastMessageTimestamp: lastMessage.timestamp || 0
            });
        }).catch((error) => {
            console.error('Error fetching last message:', error);
            reject(error);
        });
    });
}

function displayUserList(usersWithLastMessages) {
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';

    usersWithLastMessages.forEach((userData) => {
        const { user, lastMessage, lastMessageTimestamp } = userData;

        const userItem = document.createElement('li');
        userItem.classList.add('list-group-item');
        userItem.style.display = 'flex';
        userItem.style.alignItems = 'center';
        userItem.style.justifyContent = 'space-between';

        // Format the last message time if available
        const messageTime = lastMessageTimestamp 
            ? new Date(lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : '';

        const lastMessageTime = lastMessageTimestamp 
            ? new Date(lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : '';

        // Populate the user item with name, last message, and timestamps
        userItem.innerHTML = `
            <img src="${user.profilePicUrl || 'https://firebasestorage.googleapis.com/v0/b/pq-hub-906ed.appspot.com/o/profile_pics%2F74eNKupoOpZGJ8aKzKVun0bt2Vn1?alt=media&token=c62ff39b-a500-4483-bd1e-30ecf9f9e48b'}" 
                 alt="${user.fullName}" 
                 class="rounded-circle" 
                 style="width: 40px; height: 40px; margin-right: 15px;">
            <div style="flex: 1; min-width: 0;"> 
                <div style="font-weight: bold; margin-bottom: 0px;">${user.fullName}</div>
                <div class="text-muted" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${lastMessage}</div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end;">
                <small class="text-muted" style="font-size: 12px;">${lastMessageTime}</small>
            </div>
        `;

        userItem.addEventListener('click', () => {
            selectedUser = user;
            chatWith.textContent = user.fullName;
            showChatUI();
        });

        userList.appendChild(userItem);
    });
}


function filterUserList() {
    const searchValue = searchUserInput.value.toLowerCase();
    const filteredUsers = window.usersData.filter(({ user }) => 
        user.fullName && user.fullName.toLowerCase().includes(searchValue)
    );
    displayUserList(filteredUsers);
}


function showUserProfile() {
    const currentUserRef = ref(database, 'users/' + currentUser.uid);
    onValue(currentUserRef, (snapshot) => {
        const userData = snapshot.val();
        document.getElementById('display-name').value = userData.fullName || '';
        document.getElementById('current-profile-pic').src = userData.profilePicUrl || 'https://firebasestorage.googleapis.com/v0/b/pq-hub-906ed.appspot.com/o/profile_pics%2F74eNKupoOpZGJ8aKzKVun0bt2Vn1?alt=media&token=c62ff39b-a500-4483-bd1e-30ecf9f9e48b';
    });
}

document.getElementById('settings-btn').addEventListener('click', () => {
    showUserProfile();
    const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
    settingsModal.show();
});

document.getElementById('profile-settings-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const fullName = document.getElementById('display-name').value;
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const profilePicInput = document.getElementById('profile-pic-url');
    const profilePicFile = profilePicInput.files[0];
    const user = auth.currentUser;

    try {
        if (profilePicFile) {
            const profilePicRef = storageRef(storage, `profile_pics/${user.uid}`);
            await uploadBytes(profilePicRef, profilePicFile);
            const profilePicUrl = await getDownloadURL(profilePicRef);
            await updateProfile(user, { photoURL: profilePicUrl });
            await update(ref(database, 'users/' + user.uid), { fullName, profilePicUrl });
        } else {
            await update(ref(database, 'users/' + user.uid), { fullName });
        }
        const newEmail = document.getElementById('signup-email').value;
        if (user.email !== newEmail) {
            await updateEmail(user, newEmail);
        }
        if (newPassword) {
            await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
            await updatePassword(user, newPassword);
        }
        const successAlert = document.createElement('div');
        successAlert.className = 'alert alert-success';
        successAlert.role = 'alert';
        successAlert.textContent = 'Profile updated successfully!';
        document.body.appendChild(successAlert);
        setTimeout(() => successAlert.remove(), 3000);

        const settingsModal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
        settingsModal.hide();
    } catch (error) {
        console.error('Error updating profile:', error);
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger';
        errorAlert.role = 'alert';
        errorAlert.textContent = `Error updating profile: ${error.message}`;
        document.body.appendChild(errorAlert);
        setTimeout(() => errorAlert.remove(), 5000);
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const profilePicInput = document.getElementById('profile-pic-url');
    const currentProfilePic = document.getElementById('current-profile-pic');
    const profilePicContainer = document.querySelector('.profile-pic-container');
    const changePicOverlay = document.querySelector('.change-pic-overlay');

    // Show file input when clicking on the overlay
    changePicOverlay.addEventListener('click', () => {
        profilePicInput.click();
    });

    // Update image preview when a new image is selected
    profilePicInput.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                currentProfilePic.src = e.target.result; // Set the image src to the selected file
            };
            reader.readAsDataURL(file);
        }
    });
});

function showChatUI() {
    userListContainer.classList.add('d-none');
    chatContainer.classList.remove('d-none');

    if (selectedUser) {
        chatWith.textContent = selectedUser.fullName;
        const chatWithPic = document.getElementById('chat-with-pic');
        chatWithPic.src = selectedUser.profilePicUrl || 'https://firebasestorage.googleapis.com/v0/b/pq-hub-906ed.appspot.com/o/profile_pics%2F74eNKupoOpZGJ8aKzKVun0bt2Vn1?alt=media&token=c62ff39b-a500-4483-bd1e-30ecf9f9e48b';
    }

    loadChat();
}

backToUsersBtn.addEventListener('click', () => {
    chatContainer.classList.add('d-none');
    userListContainer.classList.remove('d-none');
    chatActive = false; 
});


function formatDate(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
        return 'Today';
    } else if (isYesterday) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    }
}

let chatActive = false;

function loadChat() {
    const chatId = getChatId(currentUser, selectedUser);
    const chatRef = ref(database, `chats/${chatId}`);
    const userStatusRef = ref(database, `status/${selectedUser.uid}`);

    chatActive = true;

    onValue(chatRef, (snapshot) => {
        chatWindow.innerHTML = '';
        const carouselImages = document.getElementById('carouselImages');
        carouselImages.innerHTML = '';

        let images = [];
        let currentDateHeader = '';

        snapshot.forEach((childSnapshot) => {
            const message = childSnapshot.val();
            const messageDate = new Date(message.timestamp);
            const formattedDate = formatDate(message.timestamp);
            const isCurrentUser = message.senderUid === currentUser.uid;

            if (formattedDate !== currentDateHeader) {
                currentDateHeader = formattedDate;
                const dateElement = document.createElement('div');
                dateElement.classList.add('date-header', 'text-center', 'mb-2');
                dateElement.textContent = currentDateHeader;
                chatWindow.appendChild(dateElement);
            }

            const messageElement = document.createElement('div');
            messageElement.classList.add('mb-2', 'd-flex');
            messageElement.classList.add(isCurrentUser ? 'justify-content-end' : 'justify-content-start');

            const hours = messageDate.getHours();
            const minutes = messageDate.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedTime = `${hours % 12 || 12}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;

            let messageContent = '';
            if (message.imageUrl) {
                messageContent = `
                    <div class="d-flex flex-column p-2 rounded bg-light">
                        <img src="${message.imageUrl}" class="img-thumbnail chat-image" style="max-width: 200px; cursor: pointer;">
                        <span class="text-muted small align-self-end" style="color:rgba(11, 11, 11, 0.75) !important; font-size: 0.65rem;">${formattedTime}</span>
                    </div>
                `;
                images.push(message.imageUrl);
            } else {
                messageContent = `
                    <div class="${isCurrentUser ? 'bg-primary text-black' : 'bg-light'} p-2 rounded message-content">
                        ${message.text}
                        ${isCurrentUser ? `<span class="rtime">${formattedTime}<i class="material-icons tick" style="color: ${message.read ? 'rgb(79, 195, 247)': '#aaa'}">done_all</i></span>` : `<span class="rtime">${formattedTime}</span>`}
                        ${isCurrentUser ? '<button class="btn btn-danger btn-sm d-none delete-btn">Delete</button>' : ''}
                    </div>
                `;
            }

            messageElement.innerHTML = messageContent;
            chatWindow.appendChild(messageElement);

            const messageContentDiv = messageElement.querySelector('.message-content');
            const deleteButton = messageElement.querySelector('.delete-btn');

            if (deleteButton) {
                let pressTimer;
                messageContentDiv.addEventListener('mousedown', () => {
                    pressTimer = setTimeout(() => {
                        deleteButton.classList.remove('d-none');
                    }, 2000); // 2 seconds long press
                });

                messageContentDiv.addEventListener('mouseup', () => {
                    clearTimeout(pressTimer);
                });

                messageContentDiv.addEventListener('mouseleave', () => {
                    clearTimeout(pressTimer);
                });

                deleteButton.addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this message?')) {
                        deleteMessage(chatId, childSnapshot.key);
                    }
                });
            }

            if (message.imageUrl) {
                messageElement.querySelector('.chat-image').addEventListener('click', (e) => {
                    const clickedImageIndex = images.indexOf(message.imageUrl);

                    carouselImages.innerHTML = '';
                    images.forEach((image, index) => {
                        const carouselItem = document.createElement('div');
                        carouselItem.classList.add('carousel-item');
                        if (index === clickedImageIndex) carouselItem.classList.add('active');
                        carouselItem.innerHTML = `<img src="${image}" class="d-block w-100" alt="Chat Image">`;
                        carouselImages.appendChild(carouselItem);
                    });

                    const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
                    imageModal.show();
                });

                messageElement.querySelector('.chat-image').addEventListener('load', () => {
                    chatWindow.scrollTop = chatWindow.scrollHeight;
                });
            }

            if (!isCurrentUser && !message.read && chatActive) {
                const messageRef = ref(database, `chats/${chatId}/${childSnapshot.key}`);
                update(messageRef, { read: true });
            }
        });

        chatWindow.scrollTop = chatWindow.scrollHeight;
    });
}


function deleteMessage(chatId, messageId) {
    const messageRef = ref(database, `chats/${chatId}/${messageId}`);
    remove(messageRef)
        .then(() => {
            console.log('Message deleted successfully');
        })
        .catch((error) => {
            console.error('Error deleting message:', error);
        });
}

chatWindow.addEventListener('scroll', () => {
    const allMessages = chatWindow.querySelectorAll('.date-header');
    const chatWindowTop = chatWindow.scrollTop;

    let visibleDate = '';

    allMessages.forEach((dateHeader) => {
        const messageTop = dateHeader.offsetTop - chatWindow.scrollTop;
        if (messageTop >= 0 && messageTop <= chatWindow.clientHeight) {
            visibleDate = dateHeader.textContent;
        }
    });

    const topDateDisplay = document.getElementById('top-date-display');
    if (topDateDisplay && visibleDate) {
        topDateDisplay.textContent = visibleDate;
    }
});

    sendBtn.addEventListener('click', () => {
    const messageText = messageInput.value.trim();
    if (messageText) {
        const chatId = getChatId(currentUser, selectedUser);
        const chatRef = ref(database, `chats/${chatId}`);
        const newMessageRef = push(chatRef);

        set(newMessageRef, {
            text: messageText,
            senderUid: currentUser.uid,
            senderName: currentUserData.fullName,
            timestamp: Date.now()
        });

        messageInput.value = ''; 
        messageInput.focus();
    }
});

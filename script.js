// List of Participants (Initially empty, names will be added dynamically)
let participants = [];
let questioner = "";
let prey = "";
let chatMessages = [];

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAmmS7kULjxSLwAdYvnoOaiwYLZTvbLlu0",
  authDomain: "truth-and-truth-9fa82.firebaseapp.com",
  projectId: "truth-and-truth-9fa82",
  storageBucket: "truth-and-truth-9fa82.appspot.com",
  messagingSenderId: "537672216155",
  appId: "1:537672216155:web:5924a7ec3fa65fd0e3d97e",
  measurementId: "G-7M8KPF99DD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = firebase.firestore();

// Add the current participant (from localStorage) to the list and Firebase
function addCurrentParticipant() {
    const currentParticipant = localStorage.getItem('participantName');
    if (currentParticipant) {
        db.collection('participants').add({
            name: currentParticipant,
            joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }).then(() => {
            alert(`${currentParticipant}, you have joined the game!`);
        }).catch((error) => {
            console.error("Error adding participant: ", error);
        });
    } else {
        alert("You must set your name first to join the game.");
    }
}

// Listen for real-time participant updates
db.collection('participants').onSnapshot((snapshot) => {
    let participantsArray = [];
    snapshot.forEach((doc) => {
        participantsArray.push(doc.data().name);
    });
    participants = participantsArray; // Sync the participants array
});

// Spin to randomly select a Questioner and Prey
function spin() {
    if (participants.length < 2) {
        alert("Not enough participants!");
        return;
    }

    if (questioner === "") {
        // Select first questioner
        questioner = getRandomParticipant();
    }

    // Select Prey, ensure they aren't the same as the questioner
    prey = getRandomParticipant();

    // Update the game state in Firebase with both questioner and prey
    db.collection('game').doc('state').set({
        questioner: questioner,
        prey: prey
    }).then(() => {
        document.getElementById('questioner-name').innerText = questioner;
        document.getElementById('prey-name').innerText = prey;
        document.getElementById('spinner-result').innerText = `${questioner} is the Questioner. ${prey} is the Prey.`;
    }).catch((error) => {
        console.error("Error updating game state: ", error);
    });
}

// Helper function to select a random participant and remove them from the list
function getRandomParticipant() {
    const randomIndex = Math.floor(Math.random() * participants.length);
    const selectedParticipant = participants[randomIndex];
    participants.splice(randomIndex, 1); // Remove selected person
    return selectedParticipant;
}

// Listen for game state changes
db.collection('game').doc('state').onSnapshot((doc) => {
    if (doc.exists) {
        const gameState = doc.data();
        questioner = gameState.questioner;
        prey = gameState.prey;

        document.getElementById('questioner-name').innerText = questioner;
        document.getElementById('prey-name').innerText = prey;
        document.getElementById('spinner-result').innerText = `${questioner} is the Questioner. ${prey} is the Prey.`;
    }
});

// Submit answer
function submitAnswer() {
    const answer = document.getElementById('answer').value;
    if (answer === "") {
        alert("Please enter an answer!");
        return;
    }
    addChatMessage(`${prey} (Prey): ${answer}`);
    document.getElementById('answer').value = ""; // Clear the answer field

    // Rotate roles for the next round
    participants.push(questioner); // Add old questioner back to the pool
    questioner = prey; // Make the Prey the new Questioner
    document.getElementById('questioner-name').innerText = questioner;

    // Clear spinner result
    document.getElementById('spinner-result').innerText = "";
}

// Send a message in the chat
function sendMessage() {
    const message = document.getElementById('chat-message').value;
    const participantName = localStorage.getItem('participantName');

    if (message === "") {
        alert("Please enter a message!");
        return;
    }

    if (!participantName) {
        alert("You need to enter your name before sending a message!");
        return;
    }

    db.collection('chat').add({
        sender: participantName,
        message: message,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    }).then(() => {
        document.getElementById('chat-message').value = ""; // Clear chat input
    }).catch((error) => {
        console.error("Error sending message: ", error);
    });
}

// Listen for new chat messages
db.collection('chat').orderBy('timestamp').onSnapshot((snapshot) => {
    let chatBox = document.getElementById('chat-messages');
    chatBox.innerHTML = ""; // Clear previous messages

    snapshot.forEach((doc) => {
        let messageData = doc.data();
        let messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.innerText = `${messageData.sender}: ${messageData.message}`;
        chatBox.appendChild(messageDiv);
    });

    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the latest message
});

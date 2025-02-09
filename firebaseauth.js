// Import the required Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { 
    getFirestore, 
    setDoc, 
    doc, 
    getDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD5SWLYarBZsy-GQNqNWaOEGvwCgU5C6Ns",
    authDomain: "skillsync-8da60.firebaseapp.com",
    projectId: "skillsync-8da60",
    storageBucket: "skillsync-8da60.firebasestorage.app",
    messagingSenderId: "1004601660354",
    appId: "1:1004601660354:web:0de9a095c56e5940f93c5b",
    measurementId: "G-73RXN0WS7X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize providers
const googleProvider = new GoogleAuthProvider();

// Function to store user data in Firestore
async function storeUserData(userId, userData) {
    try {
        await setDoc(doc(db, "users", userId), {
            ...userData,
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("Error storing user data:", error);
        throw error;
    }
}

// Handle sign up
document.getElementById('submitSignUp').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('rEmail').value;
    const password = document.getElementById('rPassword').value;
    const firstName = document.getElementById('fName').value;
    const lastName = document.getElementById('lName').value;
    const userType = document.querySelector('input[name="userType"]:checked').value;
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        let userData = {
            firstName,
            lastName,
            email,
            userType,
            createdAt: serverTimestamp(),
            accountStatus: 'active',
            emailVerified: user.emailVerified,
            registrationMethod: 'email',
            profile: {
                firstName,
                lastName,
                fullName: `${firstName} ${lastName}`,
                email
            }
        };

        // If registering as company, add company details
        if (userType === 'company') {
            const companyData = {
                companyName: document.getElementById('companyName').value,
                companyId: document.getElementById('companyId').value,
                location: document.getElementById('companyLocation').value,
                website: document.getElementById('companyWebsite').value,
                description: document.getElementById('companyDescription').value,
                verificationStatus: 'pending'
            };
            
            userData = {
                ...userData,
                companyDetails: companyData
            };

            // Store in separate companies collection for easy access
            await setDoc(doc(db, "companies", user.uid), {
                ...companyData,
                userId: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        await storeUserData(user.uid, userData);

        showMessage('signUpMessage', 'Account created successfully!', 'success');
        setTimeout(() => {
            if (userType === 'company') {
                window.location.href = '/company-post.html';
            } else {
                window.location.href = '/index.html';
            }
        }, 2000);
    } catch (error) {
        let errorMessage = 'An error occurred during registration.';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'This email is already registered. Please use a different email or try logging in.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password should be at least 6 characters long.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Please enter a valid email address.';
                break;
            default:
                errorMessage = error.message;
        }
        showMessage('signUpMessage', errorMessage, 'error');
        clearForm('signup');
    }
});

// Handle sign in
document.getElementById('submitSignIn').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update last login time in Firestore
        await storeUserData(user.uid, {
            lastLogin: serverTimestamp()
        });

        showMessage('signInMessage', 'Signed in successfully!', 'success');
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1500);
    } catch (error) {
        let errorMessage = 'An error occurred during sign in.';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email. Please register first.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password. Please try again.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Please enter a valid email address.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
            default:
                errorMessage = error.message;
        }
        showMessage('signInMessage', errorMessage, 'error');
        clearForm('signin');
    }
});

// Google Sign In
async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Store user data in Firestore
        await storeUserData(user.uid, {
            firstName: user.displayName.split(' ')[0],
            lastName: user.displayName.split(' ').slice(1).join(' '),
            email: user.email,
            photoURL: user.photoURL,
            userType: 'google',
            registrationMethod: 'google',
            emailVerified: user.emailVerified,
            profile: {
                firstName: user.displayName.split(' ')[0],
                lastName: user.displayName.split(' ').slice(1).join(' '),
                fullName: user.displayName,
                email: user.email,
                photoURL: user.photoURL
            }
        });

        showMessage('signInMessage', 'Signed in with Google successfully!', 'success');
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1500);
    } catch (error) {
        showMessage('signInMessage', error.message, 'error');
    }
}

// Add event listeners for social login buttons
document.querySelectorAll('.social-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        if (e.currentTarget.classList.contains('google-btn')) {
            signInWithGoogle();
        }
    });
});

// Toggle between sign in and sign up forms
document.getElementById('signUpButton').addEventListener('click', showSignUpForm);
document.getElementById('signInButton').addEventListener('click', showSignInForm);

function showSignUpForm() {
    document.getElementById('signIn').style.display = 'none';
    document.getElementById('signup').style.display = 'block';
}

function showSignInForm() {
    document.getElementById('signup').style.display = 'none';
    document.getElementById('signIn').style.display = 'block';
}

// Utility function to show messages
function showMessage(elementId, message, type) {
    const messageDiv = document.getElementById(elementId);
    messageDiv.style.display = 'block';
    messageDiv.textContent = message;
    messageDiv.className = `messageDiv ${type}`;
}

// Utility function to clear form
function clearForm(formType) {
    if (formType === 'signup') {
        document.getElementById('rEmail').value = '';
        document.getElementById('rPassword').value = '';
        document.getElementById('fName').value = '';
        document.getElementById('lName').value = '';
    } else if (formType === 'signin') {
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
    }
}

// Check authentication state and update user data
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // User is signed in
        console.log('User is signed in:', user.email);
        
        // Get user data from Firestore
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log('User data:', userData);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    } else {
        // User is signed out
        console.log('User is signed out');
    }
});

// Add this function to get company details
export async function getCompanyDetails(companyId) {
    try {
        const companyDoc = await getDoc(doc(db, "companies", companyId));
        if (companyDoc.exists()) {
            return companyDoc.data();
        }
        return null;
    } catch (error) {
        console.error("Error fetching company details:", error);
        return null;
    }
} 
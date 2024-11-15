async function deleteSession(sessionId) {
    console.log(`deleteSession: sessionId: ${sessionId}\n`);
    
    try {
        let response = await fetch(`/session/${sessionId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete session');

        toastr.success('Session deleted successfully');
        refreshSessions();
    } catch (error) {
        console.error(`deleteSession: Error deleting session: ${error}\n`);
        toastr.error('Failed to delete session');
    }
}

//DO NOT DELETE REST OF THE CODE

// Fetch and display active sessions
async function refreshSessions() {
    let sessionsList = document.getElementById('sessionsList');
    let placeholder = document.getElementById('sessionListPlaceholder');
    let detailsSelect = document.getElementById('detailsSessionSelect');
    
    try {
        let response = await fetch('/list-sessions');
        let data = await response.json();
        
        // Update sessions list
        sessionsList.innerHTML = '';
        // Update details select
        detailsSelect.innerHTML = '<option value="">Select a session</option>';
        
        if (data.sessions && data.sessions.length > 0) {
            placeholder.style.display = 'none';
            
            for (let sessionId of data.sessions) {
                // Get status for each session
                let statusResponse = await fetch(`/session-status/${sessionId}`);
                let statusData = await statusResponse.json();
                
                let isConnected = statusData.connectionState.state === 'open';
                let statusIcon = isConnected ? 
                    '<i class="ph ph-circle-fill" style="color: #4CAF50;"></i>' : 
                    '<i class="ph ph-circle-fill" style="color: #f44336;"></i>';
                
                // Add to sessions list
                sessionsList.innerHTML += `
                    <div class="session-item">
                        ${statusIcon}
                        <span>${sessionId}</span>
                        <span class="status-text">${isConnected ? 'Connected' : 'Disconnected'}</span>
                        <button onclick="viewSessionDetails('${sessionId}')" class="view-btn">
                            <i class="ph ph-eye"></i>
                        </button>
                        <button onclick="deleteSession('${sessionId}')" class="delete-btn">
                            <i class="ph ph-trash"></i>
                        </button>
                    </div>
                `;
                
                // Add to details select
                detailsSelect.innerHTML += `<option value="${sessionId}">${sessionId}</option>`;
            }
        } else {
            placeholder.style.display = 'block';
        }
    } catch (error) {
        console.error(`refreshSessions: Error refreshing sessions: ${error}\n`);
        toastr.error('Failed to refresh sessions');
    }
}

async function createSession() {
    let sessionId = document.getElementById('sessionId').value;
    console.log(`createSession #543: Creating session with ID: ${sessionId}`);

    try {
        // Show loading state
        document.getElementById('qr-image').style.display = 'none';
        document.getElementById('qrcode-placeholder').style.display = 'block';
        document.getElementById('qrcode-placeholder').innerHTML = 'Loading QR code...';

        let response = await fetch('/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId })
        });

        if (response.ok) {
            // Check if response is an image
            let contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('image')) {
                let blob = await response.blob();
                let imageUrl = URL.createObjectURL(blob);
                
                // Display the QR code image
                let qrImage = document.getElementById('qr-image');
                qrImage.src = imageUrl;
                qrImage.style.display = 'block';
                document.getElementById('qrcode-placeholder').style.display = 'none';
                
                // Clean up the object URL after the image loads
                qrImage.onload = () => URL.revokeObjectURL(imageUrl);
            } else {
                throw new Error('Invalid response format');
            }
        } else {
            throw new Error(`Server responded with status: ${response.status}`);
        }
    } catch (error) {
        console.error(`createSession #544: Error: ${error}`);
        document.getElementById('qrcode-placeholder').innerHTML = 'Error generating QR code';
    }
}

async function sendMessage() {
    let sessionId = document.getElementById('sessionSelect').value;
    let jid = document.getElementById('jid').value.trim();
    let message = document.getElementById('message').value.trim();

    if (!sessionId || !jid || !message) {
        toastr.error('Please fill in all fields');
        return;
    }

    console.log(`sendMessage: sessionId: ${sessionId}, jid: ${jid}, message: ${message}\n`);

    try {
        let response = await fetch('/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionId, jid, message })
        });

        if (!response.ok) throw new Error('Failed to send message');

        toastr.success('Message sent successfully!');
        document.getElementById('jid').value = '';
        document.getElementById('message').value = '';
    } catch (error) {
        console.error(`sendMessage: Error sending message: ${error}\n`);
        toastr.error('Failed to send message');
    }
}

//send image
async function sendImage() {
    let sessionId = document.getElementById('imageSessionSelect').value;
    let jid = document.getElementById('imageJid').value.trim();
    let imageUrl = document.getElementById('imageUrl').value.trim();
    let caption = document.getElementById('imageCaption').value.trim();
    let viewOnce = document.getElementById('viewonce').value;                       

    console.log(`sendImage: sessionId: ${sessionId}, jid: ${jid}, imageUrl: ${imageUrl}, caption: ${caption}, viewOnce: ${viewOnce}\n`);

    try {
        let response = await fetch('/send-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionId, jid, imageUrl, caption, viewOnce })
        });

        if (!response.ok) throw new Error('Failed to send image');

        toastr.success('Image sent successfully!');
      //  document.getElementById('imageUrl').value = '';
      //  document.getElementById('caption').value = '';
    } catch (error) {
        console.error(`sendImage: Error sending image: ${error}\n`);
        toastr.error('Failed to send image');
    }
}

// Add status indicators to session cards
async function updateSessionStatus(sessionId) {
    try {
        let response = await fetch(`/session-status/${sessionId}`);
        let data = await response.json();
        
        let statusElement = document.querySelector(`#status-${sessionId}`);
        if (statusElement) {
            let state = data.connectionState.state;
            let color = state === 'open' ? '#4CAF50' : 
                       state === 'connecting' ? '#FFA500' : '#ff4444';
            
            statusElement.style.backgroundColor = color;
            statusElement.title = `Status: ${state}`;
        }
    } catch (error) {
        console.error(`Error updating status for ${sessionId}:`, error);
    }
}


async function getServerStatus() {
    try {
        let response = await fetch('/server-status');
        let data = await response.json();

        updateResourceBar('ramBar', data.ram.used, data.ram.total);
        updateResourceBar('cpuBar', data.cpu.used, data.cpu.total);
        updateResourceBar('diskBar', data.disk.used, data.disk.total);
    } catch (error) {
        console.error('Error fetching server status:', error);
        toastr.error('Failed to fetch server status');
    }
}
getServerStatus()

function updateResourceBar(barId, used, total) {
    let bar = document.getElementById(barId);
    let fill = bar.querySelector('.bar-fill');
    let text = bar.querySelector('.bar-text');

    let percentage = (parseFloat(used) / parseFloat(total)) * 100;
    fill.style.width = `${percentage}%`;
    text.textContent = `${used} / ${total}`;
}


// Add session info viewer
async function viewSessionInfo(sessionId) {
    console.log(`viewSessionInfo: sessionId: ${sessionId}\n`);
    
    try {
        let response = await fetch(`/session-info/${sessionId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch session info');
        }

        let data = await response.json();
        
        // Create a modal to display the info
        let modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
            <h3>Session Info: ${sessionId}</h3>
            <div class="info-tabs">
                <button onclick="showTab('contacts')">Contacts (${Object.keys(data.contacts).length})</button>
                <button onclick="showTab('chats')">Chats (${data.chats.length})</button>
                <button onclick="showTab('messages')">Messages (${data.messages.length})</button>
            </div>
            <div class="info-content">
                <pre>${JSON.stringify(data.info, null, 2)}</pre>
            </div>
            <button onclick="this.parentElement.parentElement.remove()">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        console.error(`viewSessionInfo: Error fetching session info: ${error}\n`);
        toastr.error('Failed to fetch session info');
    }
}
// Refresh sessions when page loads
document.addEventListener('DOMContentLoaded', refreshSessions);

// Refresh sessions every 30 seconds
//setInterval(refreshSessions, 30000); 

async function getSessionChats(sessionId) {
    console.log(`getSessionChats: sessionId: ${sessionId}\n`);
    
    try {
        let response = await fetch(`/session-chats-direct/${sessionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        let data = await response.json();
        
        if (data.status === "success") {
            console.log(`getSessionChats: Retrieved ${data.count} chats\n`);
            return data.chats;
        }
    } catch (error) {
        console.error(`getSessionChats: Error fetching chats: ${error}\n`);
        toastr.error('Failed to fetch chats');
    }
    return [];
}

async function getSessionContacts(sessionId) {
    console.log(`getSessionContacts: sessionId: ${sessionId}\n`);
    
    try {
        let response = await fetch(`/session-contacts-direct/${sessionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        let data = await response.json();
        
        if (data.status === "success") {
            console.log(`getSessionContacts: Retrieved ${data.count} contacts\n`);
            return data.contacts;
        }
    } catch (error) {
        console.error(`getSessionContacts: Error fetching contacts: ${error}\n`);
        toastr.error('Failed to fetch contacts');
    }
    return [];
}

async function updateSessionSelect() {
    let select = document.getElementById('detailsSessionSelect');
    let response = await fetch('/list-sessions');
    let data = await response.json();
    
    select.innerHTML = '<option value="">Select a session</option>';
    
    if (data.sessions) {
        data.sessions.forEach(sessionId => {
            select.innerHTML += `<option value="${sessionId}">${sessionId}</option>`;
        });
    }
}

function showTab(tabName) {
    let tabs = document.querySelectorAll('.tab-btn');
    let contents = document.querySelectorAll('.tab-content');
    let selectedTab = document.querySelector(`.tab-btn[onclick="showTab('${tabName}')"]`);
    let selectedContent = document.getElementById(`${tabName}Tab`);
    
    console.log(`showTab: Showing tab: ${tabName}\n`);
    
    if (!selectedTab || !selectedContent) {
        console.error(`showTab: Tab ${tabName} not found\n`);
        toastr.error('Tab not found');
        return;
    }

    // Remove active class from all tabs and contents
    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    // Add active class to selected tab and content
    selectedTab.classList.add('active');
    selectedContent.classList.add('active');

    // Load content based on selected tab
    let sessionId = document.getElementById('detailsSessionSelect').value;
    if (sessionId) {
        if (tabName === 'chats') {
            loadChats(sessionId);
        } else if (tabName === 'contacts') {
            loadContacts(sessionId);
        }
    }
}

async function loadChats(sessionId) {
    let chatsList = document.getElementById('chatsList');
    let placeholder = document.getElementById('chatsPlaceholder');
    
    if (!chatsList || !placeholder) {
        console.error(`loadChats: Required elements not found\n`);
        return;
    }
    
    try {
        console.log(`loadChats: Loading chats for session ${sessionId}\n`);
        chatsList.innerHTML = '<div class="loading">Loading chats...</div>';
        
        let chats = await getSessionChats(sessionId);
        chatsList.innerHTML = '';
        
        if (chats && chats.length > 0) {
            placeholder.style.display = 'none';
            chats.forEach(chat => {
                // Safely handle undefined values
                let chatName = chat.name || chat.id || 'Unknown';
                let unreadCount = chat.unreadCount || 0;
                
                chatsList.innerHTML += `
                    <div class="chat-item">
                        <i class="ph ${chat.isGroup ? 'ph-users' : 'ph-user'}"></i>
                        <div class="item-info">
                            <div class="item-name">${chatName}</div>
                            <div class="item-details">
                                ${chat.isGroup ? 'Group' : 'Private Chat'} • 
                                ${unreadCount ? `${unreadCount} unread` : 'No unread messages'}
                            </div>
                        </div>
                        <button onclick="copyToClipboard('${chat.id}')" class="copy-btn">
                            <i class="ph ph-copy"></i>
                        </button>
                    </div>
                `;
            });
        } else {
            placeholder.style.display = 'block';
        }
    } catch (error) {
        console.error(`loadChats: Error: ${error}\n`);
        toastr.error('Failed to load chats');
    }
}

async function loadContacts(sessionId) {
    let contactsList = document.getElementById('contactsList');
    let placeholder = document.getElementById('contactsPlaceholder');
    
    console.log(`loadContacts: Loading contacts for session ${sessionId}\n`);
    
    if (!contactsList || !placeholder) {
        console.error(`loadContacts: Required elements not found\n`);
        return;
    }
    
    try {
        let contacts = await getSessionContacts(sessionId);
        contactsList.innerHTML = '';
        
        if (contacts && contacts.length > 0) {
            placeholder.style.display = 'none';
            contacts.forEach(contact => {
                // Safely handle undefined values
                let contactName = contact.name || 'Unknown';
                let contactNumber = contact.number || 'No number';
                
                contactsList.innerHTML += `
                    <div class="contact-item">
                        <i class="ph ${contact.isBusiness ? 'ph-storefront' : 'ph-user'}"></i>
                        <div class="item-info">
                            <div class="item-name">${contactName}</div>
                            <div class="item-details">
                                ${contactNumber} • 
                                ${contact.isBusiness ? 'Business' : 'Personal'}
                            </div>
                        </div>
                        <button onclick="copyToClipboard('${contact.number}')" class="copy-btn">
                            <i class="ph ph-copy"></i>
                        </button>
                    </div>
                `;
            });
        } else {
            placeholder.style.display = 'block';
        }
    } catch (error) {
        console.error(`loadContacts: Error: ${error}\n`);
        toastr.error('Failed to load contacts');
    }
}


async function fetchChats(sessionId) {
    try {
        let response = await fetch(`/session-chats-direct/${sessionId}`);
        let data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch chats');
        }

        // Clear existing chats
        let chatsContainer = document.getElementById('chats-list');
        chatsContainer.innerHTML = '';

        // Add header/count
        chatsContainer.innerHTML = `<h3>Chats (${data.count})</h3>`;

        // Create chat list
        let chatList = document.createElement('ul');
        chatList.className = 'chat-list';

        data.chats.forEach(chat => {
            let li = document.createElement('li');
            li.className = 'chat-item';
            li.innerHTML = `
                <div class="chat-info">
                    <span class="chat-name">${escapeHtml(chat.name)}</span>
                    <span class="chat-details">
                        ${chat.isGroup ? '👥 Group' : '👤 Individual'} 
                        ${chat.isGroup ? `(${chat.participants} members)` : ''}
                    </span>
                    <span class="chat-id">${chat.id}</span>
                </div>
            `;
            chatList.appendChild(li);
        });

        chatsContainer.appendChild(chatList);
    } catch (error) {
        console.error('Error fetching chats:', error);
        showError(`Failed to fetch chats: ${error.message}`);
    }
}

// Add this helper function if not already present
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ... rest of the code ...

// Add function to view session details
function viewSessionDetails(sessionId) {
    let detailsSelect = document.getElementById('detailsSessionSelect');
    detailsSelect.value = sessionId;
    detailsSelect.dispatchEvent(new Event('change'));
    
    // Scroll to details section
    document.querySelector('.session-details').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Update the session select change handler
document.getElementById('detailsSessionSelect')?.addEventListener('change', function() {
    let sessionId = this.value;
    if (sessionId) {
        // Show active tab content
        let activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) {
            showTab(activeTab.getAttribute('data-tab'));
        } else {
            showTab('chats'); // Default to chats tab
        }
    } else {
        // Clear both lists if no session selected
        document.getElementById('chatsList').innerHTML = '';
        document.getElementById('contactsList').innerHTML = '';
        document.getElementById('chatsPlaceholder').style.display = 'block';
        document.getElementById('contactsPlaceholder').style.display = 'block';
    }
});

function copyToClipboard(text) {
    console.log(`copyToClipboard: copying text: ${text}\n`);
    
    try {
        navigator.clipboard.writeText(text);
        toastr.success('Copied to clipboard');
    } catch (error) {
        console.error(`copyToClipboard: Error: ${error}\n`);
        toastr.error('Failed to copy to clipboard');
    }
}

/* ================================================
   EKINTABULI Admin Dashboard - JavaScript
   Complete Working Version - No Firebase Required
   ================================================ */

// ================================================
// CONFIGURATION
// ================================================
const CONFIG = {
    eventName: 'EKINTABULI Kya Christmas',
    eventDate: '25th December 2025',
    eventTime: '6:00 PM - Late',
    eventVenue: 'Club Missouka',
    ticketPrice: 10000,
    currency: 'UGX',
    secretKey: 'EKINTABULI-2025-XMAS-SECRET'
};

// ================================================
// STATE
// ================================================
let allTickets = [];
let currentPage = 1;
const ticketsPerPage = 20;
let generatedTicketsData = [];
let isFirebaseConnected = false;

// ================================================
// UTILITY FUNCTIONS
// ================================================
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatCurrency(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
    } else {
        date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getVerifyUrl() {
    const currentUrl = window.location. href;
    const baseUrl = currentUrl. replace('/admin/index.html', '/verify/index.html')
                              .replace('/admin/', '/verify/');
    return baseUrl. split('?')[0];
}

function showNotification(message, type = 'success') {
    const container = document.getElementById('notificationContainer');
    if (! container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ================================================
// INITIALIZATION
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing EKINTABULI Admin Dashboard...');
    
    // Try to connect to Firebase
    checkFirebaseConnection();
    
    // Setup all event listeners
    setupEventListeners();
    
    // Load existing tickets
    loadTickets();
    
    // Update dashboard
    updateDashboard();
    renderTicketTable();
});

function checkFirebaseConnection() {
    const statusEl = document.getElementById('connectionStatus');
    const textEl = statusEl.querySelector('.status-text');
    const dotEl = statusEl. querySelector('.status-dot');
    
    // Check if Firebase is available and configured
    if (typeof firebase !== 'undefined' && typeof db !== 'undefined' && db !== null) {
        // Try a simple read to verify connection
        db.collection('tickets'). limit(1).get()
            .then(() => {
                isFirebaseConnected = true;
                statusEl.className = 'connection-status connected';
                textEl.textContent = '🟢 Connected to Firebase - Real-time sync active';
                dotEl. style.background = '#28a745';
                console.log('✅ Firebase connected');
                setupFirebaseListeners();
            })
            . catch((error) => {
                console.warn('⚠️ Firebase read failed:', error);
                setLocalMode(statusEl, textEl, dotEl);
            });
    } else {
        setLocalMode(statusEl, textEl, dotEl);
    }
}

function setLocalMode(statusEl, textEl, dotEl) {
    isFirebaseConnected = false;
    statusEl.className = 'connection-status local';
    textEl.textContent = '🟡 Offline Mode - Data saved locally in your browser';
    dotEl.style.background = '#fd7e14';
    console.log('📦 Running in local storage mode');
}

function setupFirebaseListeners() {
    if (!isFirebaseConnected || !db) return;
    
    // Real-time listener for tickets
    db.collection('tickets'). orderBy('createdAt', 'desc'). onSnapshot(snapshot => {
        allTickets = [];
        snapshot.forEach(doc => {
            allTickets.push({ id: doc.id, ...doc.data() });
        });
        updateDashboard();
        renderTicketTable();
    });
    
    // Real-time listener for scan logs
    db.collection('scanLogs'). orderBy('timestamp', 'desc'). limit(50).onSnapshot(snapshot => {
        renderScanLogs(snapshot);
    });
}

function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn. addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                sessionStorage.removeItem('ekintabuli_auth');
                localStorage.removeItem('ekintabuli_auth');
                window.location.href = '../index.html';
            }
        });
    }
    
    // Generate button
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateAllTickets);
    }
    
    // Download ZIP button
    const downloadZipBtn = document.getElementById('downloadZipBtn');
    if (downloadZipBtn) {
        downloadZipBtn.addEventListener('click', downloadAsZip);
    }
    
    // Preview button
    const previewBtn = document.getElementById('previewBtn');
    if (previewBtn) {
        previewBtn. addEventListener('click', showPreview);
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadTickets();
            updateDashboard();
            renderTicketTable();
            showNotification('Tickets refreshed! ', 'success');
        });
    }
    
    // Export CSV button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportReport);
    }
    
    // Search input
    const searchInput = document.getElementById('searchTicket');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            currentPage = 1;
            renderTicketTable();
        });
    }
    
    // Filter select
    const filterSelect = document.getElementById('filterStatus');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            currentPage = 1;
            renderTicketTable();
        });
    }
    
    // Modal close button
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn. addEventListener('click', closeModal);
    }
    
    // Close modal on background click
    const modal = document.getElementById('ticketPreviewModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
}

// ================================================
// LOCAL STORAGE
// ================================================
function saveTickets() {
    localStorage.setItem('ekintabuli_tickets', JSON.stringify(allTickets));
}

function loadTickets() {
    const saved = localStorage. getItem('ekintabuli_tickets');
    if (saved) {
        try {
            allTickets = JSON.parse(saved);
            console.log(`📦 Loaded ${allTickets.length} tickets from local storage`);
        } catch (e) {
            console.error('Error loading tickets:', e);
            allTickets = [];
        }
    }
}

// ================================================
// DASHBOARD UPDATES
// ================================================
function updateDashboard() {
    let stats = {
        generated: 0,
        downloaded: 0,
        sold: 0,
        used: 0,
        revenue: 0
    };
    
    allTickets.forEach(ticket => {
        stats.generated++;
        
        switch(ticket.status) {
            case 'DOWNLOADED':
                stats. downloaded++;
                break;
            case 'SOLD':
                stats.sold++;
                stats.revenue += CONFIG.ticketPrice;
                break;
            case 'USED':
                stats.used++;
                stats.sold++;
                stats.revenue += CONFIG.ticketPrice;
                break;
        }
    });
    
    // Update stat boxes
    document.getElementById('statGenerated').textContent = stats.generated;
    document.getElementById('statDownloaded').textContent = stats.downloaded;
    document.getElementById('statSold').textContent = stats.sold;
    document.getElementById('statUsed'). textContent = stats. used;
    document.getElementById('statRevenue').textContent = formatCurrency(stats.revenue);
    
    // Update revenue tracking
    const ticketCount = parseInt(document.getElementById('ticketCount').value) || 400;
    const ticketPrice = parseInt(document.getElementById('ticketPrice').value) || CONFIG.ticketPrice;
    
    const totalPotential = ticketCount * ticketPrice;
    const soldRevenue = stats.sold * ticketPrice;
    const attendancePercent = stats.sold > 0 ? Math.round((stats. used / stats.sold) * 100) : 0;
    
    document.getElementById('totalPotential').textContent = 
        `${ticketCount} × ${formatCurrency(ticketPrice)} = ${formatCurrency(totalPotential)} UGX`;
    document.getElementById('soldRevenue').textContent = 
        `${stats.sold} × ${formatCurrency(ticketPrice)} = ${formatCurrency(soldRevenue)} UGX`;
    document.getElementById('attendanceRate').textContent = 
        `${stats.used} / ${stats.sold} (${attendancePercent}%)`;
    document.getElementById('expectedCollection').textContent = `${formatCurrency(soldRevenue)} UGX`;
}

// ================================================
// TICKET TABLE
// ================================================
function renderTicketTable() {
    const tbody = document.getElementById('ticketTableBody');
    const searchTerm = (document.getElementById('searchTicket').value || '').toLowerCase();
    const filterStatus = document.getElementById('filterStatus').value;
    
    // Filter tickets
    let filteredTickets = allTickets. filter(ticket => {
        const matchesSearch = ticket.ticketId.toLowerCase(). includes(searchTerm);
        const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
        return matchesSearch && matchesStatus;
    });
    
    // Pagination
    const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);
    const startIdx = (currentPage - 1) * ticketsPerPage;
    const pageTickets = filteredTickets.slice(startIdx, startIdx + ticketsPerPage);
    
    if (pageTickets. length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <div class="empty-icon">🎫</div>
                    <p>No tickets found</p>
                    <p class="empty-hint">Generate tickets or adjust your search</p>
                </td>
            </tr>
        `;
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    let html = '';
    pageTickets.forEach(ticket => {
        const statusClass = `status-${ticket. status. toLowerCase()}`;
        const createdAt = formatTimestamp(ticket.createdAt);
        
        html += `
            <tr>
                <td>
                    <code style="background: rgba(212,175,55,0.1); padding: 5px 10px; border-radius: 5px; font-size: 12px;">
                        ${ticket.ticketId}
                    </code>
                </td>
                <td><span class="status-badge ${statusClass}">${ticket.status}</span></td>
                <td>${createdAt}</td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="viewTicket('${ticket.ticketId}')">👁️</button>
                    <button class="btn btn-small btn-primary" onclick="markTicketAsSold('${ticket.ticketId}')">💰</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    
    if (currentPage > 1) {
        html += `<button onclick="goToPage(${currentPage - 1})">← Prev</button>`;
    }
    
    const maxVisible = 7;
    let startPage = Math.max(1, currentPage - 3);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="${i === currentPage ?  'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    if (currentPage < totalPages) {
        html += `<button onclick="goToPage(${currentPage + 1})">Next →</button>`;
    }
    
    container.innerHTML = html;
}

// Make goToPage global
window.goToPage = function(page) {
    currentPage = page;
    renderTicketTable();
};

// ================================================
// SCAN LOGS
// ================================================
function renderScanLogs(snapshot) {
    const container = document.getElementById('scanLogsContainer');
    let totalScans = 0, validScans = 0, invalidScans = 0, duplicateScans = 0;
    let logsHtml = '';
    
    if (snapshot && snapshot.forEach) {
        snapshot.forEach(doc => {
            const log = doc.data();
            totalScans++;
            
            let statusClass = 'invalid';
            let icon = '❓';
            
            if (log.result === 'VALID' || log.result === 'SUCCESS') {
                validScans++;
                statusClass = 'valid';
                icon = '✅';
            } else if (log.result === 'ALREADY_USED' || log.result === 'DUPLICATE') {
                duplicateScans++;
                statusClass = 'duplicate';
                icon = '⚠️';
            } else {
                invalidScans++;
                statusClass = 'invalid';
                icon = '❌';
            }
            
            logsHtml += `
                <div class="scan-log-item ${statusClass}">
                    <div class="scan-log-icon">${icon}</div>
                    <div class="scan-log-content">
                        <div class="scan-log-ticket">${log.ticketId || 'Unknown Ticket'}</div>
                        <div class="scan-log-time">${formatTimestamp(log.timestamp)} - ${log.result}</div>
                    </div>
                </div>
            `;
        });
    }
    
    document.getElementById('totalScans').textContent = totalScans;
    document.getElementById('validScans'). textContent = validScans;
    document.getElementById('invalidScans').textContent = invalidScans;
    document.getElementById('duplicateScans'). textContent = duplicateScans;
    
    container.innerHTML = logsHtml || '<div class="empty-state"><p>No scans recorded yet</p></div>';
}

// ================================================
// TICKET GENERATION
// ================================================
async function generateAllTickets() {
    const ticketCount = parseInt(document. getElementById('ticketCount').value) || 400;
    const btn = document.getElementById('generateBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const badge = document.getElementById('ticketBadge');
    
    // Confirm if tickets exist
    if (allTickets.length > 0) {
        if (! confirm(`You already have ${allTickets.length} tickets.  Generate ${ticketCount} new tickets?  This will replace existing tickets.`)) {
            return;
        }
    }
    
    btn.disabled = true;
    btn.innerHTML = '⏳ Generating...';
    badge.textContent = 'Generating';
    progressContainer.style.display = 'block';
    
    allTickets = [];
    generatedTicketsData = [];
    
    try {
        for (let i = 1; i <= ticketCount; i++) {
            const ticketId = generateSecureTicketId(i);
            const encryptedCode = encryptTicketCode(ticketId);
            const verifyUrl = `${getVerifyUrl()}? t=${encodeURIComponent(encryptedCode)}`;
            
            const ticketData = {
                ticketId: ticketId,
                ticketNumber: i,
                status: 'GENERATED',
                createdAt: new Date(). toISOString(),
                eventName: CONFIG.eventName,
                eventDate: CONFIG.eventDate,
                eventVenue: CONFIG.eventVenue,
                price: CONFIG.ticketPrice,
                encryptedCode: encryptedCode,
                verifyUrl: verifyUrl
            };
            
            allTickets.push(ticketData);
            generatedTicketsData.push(ticketData);
            
            // Update progress
            const percent = Math.round((i / ticketCount) * 100);
            progressFill.style.width = `${percent}%`;
            progressFill.textContent = `${percent}%`;
            progressText.textContent = `Generating ticket ${i} of ${ticketCount}...`;
            
            // Allow UI to update
            if (i % 100 === 0) {
                await sleep(1);
            }
        }
        
        progressText.textContent = 'Saving tickets... ';
        
        // Save to local storage
        saveTickets();
        
        // Try to save to Firebase if connected
        if (isFirebaseConnected && db) {
            try {
                await saveTicketsToFirebase();
                progressText.textContent = `✅ Generated ${ticketCount} tickets (synced to cloud)! `;
            } catch (e) {
                console.warn('Firebase save failed:', e);
                progressText. textContent = `✅ Generated ${ticketCount} tickets (saved locally)!`;
            }
        } else {
            progressText.textContent = `✅ Generated ${ticketCount} tickets (saved locally)!`;
        }
        
        badge.textContent = 'Complete';
        
        // Enable buttons
        document.getElementById('downloadZipBtn').disabled = false;
        document.getElementById('previewBtn').disabled = false;
        
        showNotification(`Successfully generated ${ticketCount} tickets!`, 'success');
        
        updateDashboard();
        renderTicketTable();
        
    } catch (error) {
        console. error('Generation error:', error);
        progressText.textContent = '❌ Error generating tickets';
        badge.textContent = 'Error';
        showNotification('Failed to generate: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🎫 Generate Tickets';
    }
}

async function saveTicketsToFirebase() {
    if (!db) return;
    
    const batchSize = 400;
    
    for (let i = 0; i < allTickets.length; i += batchSize) {
        const batch = db.batch();
        const chunk = allTickets. slice(i, i + batchSize);
        
        chunk.forEach(ticket => {
            const docRef = db.collection('tickets').doc(ticket.ticketId);
            batch. set(docRef, {
                ...ticket,
                createdAt: firebase.firestore. FieldValue.serverTimestamp()
            });
        });
        
        await batch.commit();
    }
}

function generateSecureTicketId(number) {
    const prefix = 'EKT';
    const year = '25';
    const paddedNum = String(number).padStart(4, '0');
    const randomSuffix = generateRandomString(4);
    return `${prefix}-${year}-${paddedNum}-${randomSuffix}`;
}

function generateRandomString(length) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math. random() * chars. length));
    }
    return result;
}

function encryptTicketCode(ticketId) {
    const timestamp = Date.now(). toString(36);
    const combined = `${ticketId}|${CONFIG.secretKey}|${timestamp}`;
    return btoa(combined). replace(/[=+/]/g, ''). substring(0, 32);
}

function decryptTicketCode(encrypted) {
    try {
        const decoded = atob(encrypted);
        const parts = decoded.split('|');
        return parts[0];
    } catch (e) {
        return null;
    }
}

// ================================================
// TICKET ACTIONS
// ================================================
window.viewTicket = function(ticketId) {
    const ticket = allTickets.find(t => t.ticketId === ticketId);
    if (ticket) {
        showTicketPreview(ticket);
    } else {
        showNotification('Ticket not found', 'error');
    }
};

window. markTicketAsSold = function(ticketId) {
    const ticketIndex = allTickets.findIndex(t => t.ticketId === ticketId);
    if (ticketIndex !== -1) {
        allTickets[ticketIndex].status = 'SOLD';
        allTickets[ticketIndex].soldAt = new Date().toISOString();
        saveTickets();
        updateDashboard();
        renderTicketTable();
        showNotification(`Ticket ${ticketId} marked as sold!`, 'success');
        
        // Update Firebase if connected
        if (isFirebaseConnected && db) {
            db.collection('tickets'). doc(ticketId).update({
                status: 'SOLD',
                soldAt: firebase.firestore. FieldValue.serverTimestamp()
            }). catch(e => console.warn('Firebase update failed:', e));
        }
    }
};

// ================================================
// TICKET PREVIEW
// ================================================
function showPreview() {
    if (allTickets. length === 0) {
        showNotification('Generate tickets first! ', 'warning');
        return;
    }
    showTicketPreview(allTickets[0]);
}

function showTicketPreview(ticket) {
    const modal = document.getElementById('ticketPreviewModal');
    const frontContainer = document.getElementById('ticketFrontPreview');
    const backContainer = document. getElementById('ticketBackPreview');
    
    frontContainer.innerHTML = createTicketFrontHTML(ticket);
    backContainer.innerHTML = createTicketBackHTML(ticket);
    
    modal. classList.add('active');
    
    // Generate QR code
    setTimeout(() => {
        const qrContainer = document.getElementById(`qr-${ticket.ticketId}`);
        if (qrContainer) {
            qrContainer.innerHTML = '';
            new QRCode(qrContainer, {
                text: ticket.verifyUrl,
                width: 110,
                height: 110,
                colorDark: '#1a1a2e',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }, 100);
}

function closeModal() {
    const modal = document.getElementById('ticketPreviewModal');
    modal.classList.remove('active');
}

// ================================================
// TICKET DESIGN - FRONT
// ================================================
function createTicketFrontHTML(ticket) {
    return `
        <div style="
            width: 380px;
            height: 580px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            border-radius: 20px;
            padding: 25px;
            position: relative;
            overflow: hidden;
            font-family: 'Montserrat', Arial, sans-serif;
            color: white;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        ">
            <!-- Watermark Pattern -->
            <div style="
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 25px,
                    rgba(212, 175, 55, 0.03) 25px,
                    rgba(212, 175, 55, 0.03) 50px
                );
                pointer-events: none;
            "></div>
            
            <!-- Diagonal Watermark Text -->
            <div style="
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 45px;
                font-weight: 900;
                color: rgba(212, 175, 55, 0. 05);
                white-space: nowrap;
                pointer-events: none;
                letter-spacing: 10px;
            ">EKINTABULI</div>
            
            <!-- Gold Border -->
            <div style="
                position: absolute;
                top: 8px; left: 8px; right: 8px; bottom: 8px;
                border: 2px solid rgba(212, 175, 55, 0.4);
                border-radius: 15px;
                pointer-events: none;
            "></div>
            
            <!-- Corner Icons -->
            <div style="position: absolute; top: 18px; left: 18px; font-size: 24px;">👑</div>
            <div style="position: absolute; top: 18px; right: 18px; font-size: 24px;">🎄</div>
            
            <!-- Header -->
            <div style="text-align: center; margin-top: 30px; position: relative; z-index: 1;">
                <div style="font-size: 10px; color: #D4AF37; letter-spacing: 3px; margin-bottom: 5px; text-transform: uppercase;">Exclusive Christmas Event</div>
                <div style="font-family: Georgia, serif; font-size: 34px; font-weight: bold; color: #D4AF37; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">EKINTABULI</div>
                <div style="font-size: 14px; color: #aaa; margin-top: 3px;">Kya Christmas 2025</div>
            </div>
            
            <!-- Event Info -->
            <div style="margin-top: 30px; position: relative; z-index: 1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 12px; background: rgba(212, 175, 55, 0. 1); border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.2);">
                    <div>
                        <div style="font-size: 9px; color: #888; margin-bottom: 3px;">📅 DATE</div>
                        <div style="font-weight: 600; font-size: 12px;">25th December 2025</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 9px; color: #888; margin-bottom: 3px;">⏰ TIME</div>
                        <div style="font-weight: 600; font-size: 12px;">6:00 PM - Late</div>
                    </div>
                </div>
                
                <div style="padding: 12px; background: rgba(212, 175, 55, 0. 1); border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.2); margin-bottom: 10px;">
                    <div style="font-size: 9px; color: #888; margin-bottom: 3px;">📍 VENUE</div>
                    <div style="font-weight: 600; font-size: 12px;">Club Missouka</div>
                </div>
                
                <div style="display: flex; justify-content: space-between; padding: 12px; background: rgba(40, 167, 69, 0.1); border-radius: 8px; border: 1px solid rgba(40, 167, 69, 0.2);">
                    <div>
                        <div style="font-size: 9px; color: #888; margin-bottom: 3px;">🎫 TICKET ID</div>
                        <div style="font-weight: 700; font-size: 13px; color: #D4AF37;">${ticket.ticketId}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 9px; color: #888; margin-bottom: 3px;">💵 PRICE</div>
                        <div style="font-weight: 700; font-size: 13px; color: #28a745;">10,000 UGX</div>
                    </div>
                </div>
            </div>
            
            <!-- QR Code -->
            <div style="text-align: center; margin-top: 20px; position: relative; z-index: 1;">
                <div style="display: inline-block; padding: 10px; background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
                    <div id="qr-${ticket.ticketId}" style="width: 110px; height: 110px;"></div>
                </div>
                <div style="margin-top: 8px; font-size: 9px; color: #888;">Scan with phone camera to verify</div>
            </div>
            
            <!-- Footer -->
            <div style="position: absolute; bottom: 18px; left: 25px; right: 25px; text-align: center; z-index: 1;">
                <div style="font-size: 8px; color: #666; border-top: 1px solid rgba(212, 175, 55, 0.2); padding-top: 10px;">
                    🔒 This ticket is digitally protected and verified<br>
                    <span style="color: #D4AF37;">Valid for ONE person only • Present at gate</span>
                </div>
            </div>
        </div>
    `;
}

// ================================================
// TICKET DESIGN - BACK
// ================================================
function createTicketBackHTML(ticket) {
    return `
        <div style="
            width: 380px;
            height: 580px;
            background: linear-gradient(135deg, #0f3460 0%, #16213e 50%, #1a1a2e 100%);
            border-radius: 20px;
            padding: 25px;
            position: relative;
            overflow: hidden;
            font-family: 'Montserrat', Arial, sans-serif;
            color: white;
            box-shadow: 0 20px 60px rgba(0,0,0,0. 5);
        ">
            <!-- Security Pattern -->
            <div style="
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: 
                    repeating-linear-gradient(0deg, transparent, transparent 15px, rgba(212,175,55,0.015) 15px, rgba(212,175,55,0. 015) 16px),
                    repeating-linear-gradient(90deg, transparent, transparent 15px, rgba(212,175,55,0.015) 15px, rgba(212,175,55,0.015) 16px);
                pointer-events: none;
            "></div>
            
            <!-- Border -->
            <div style="
                position: absolute;
                top: 8px; left: 8px; right: 8px; bottom: 8px;
                border: 2px solid rgba(212, 175, 55, 0.4);
                border-radius: 15px;
                pointer-events: none;
            "></div>
            
            <!-- Header -->
            <div style="text-align: center; margin-top: 15px; position: relative; z-index: 1;">
                <div style="font-size: 20px; margin-bottom: 5px;">🎫</div>
                <div style="font-size: 11px; color: #D4AF37; letter-spacing: 2px;">TERMS & CONDITIONS</div>
            </div>
            
            <!-- Terms -->
            <div style="margin-top: 20px; position: relative; z-index: 1; font-size: 10px; line-height: 1.6; color: #ccc;">
                <div style="margin-bottom: 12px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px; border-left: 3px solid #D4AF37;">
                    <strong style="color: #D4AF37;">1. Single Use Only</strong><br>
                    This ticket can only be scanned once at the gate.  After scanning, it cannot be reused.
                </div>
                
                <div style="margin-bottom: 12px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px; border-left: 3px solid #D4AF37;">
                    <strong style="color: #D4AF37;">2. Non-Transferable</strong><br>
                    Once scanned, this ticket is linked to the holder and cannot be transferred. 
                </div>
                
                <div style="margin-bottom: 12px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px; border-left: 3px solid #D4AF37;">
                    <strong style="color: #D4AF37;">3.  Verification Required</strong><br>
                    Present valid ID matching ticket holder name if requested.
                </div>
                
                <div style="margin-bottom: 12px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px; border-left: 3px solid #D4AF37;">
                    <strong style="color: #D4AF37;">4. No Refunds</strong><br>
                    Tickets are non-refundable. Event occurs rain or shine.
                </div>
                
                <div style="padding: 10px; background: rgba(220,53,69,0. 1); border-radius: 8px; border-left: 3px solid #dc3545;">
                    <strong style="color: #dc3545;">⚠️ Anti-Fraud Notice</strong><br>
                    Counterfeit tickets will be confiscated.  Violators will be prosecuted.
                </div>
            </div>
            
            <!-- Security Badge -->
            <div style="position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%); text-align: center; z-index: 1;">
                <div style="display: inline-block; padding: 8px 20px; background: rgba(212, 175, 55, 0. 1); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 20px;">
                    <span style="font-size: 10px; color: #D4AF37;">🔐 VERIFIED AUTHENTIC</span>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="position: absolute; bottom: 18px; left: 25px; right: 25px; text-align: center; z-index: 1;">
                <div style="font-size: 9px; color: #666;">
                    <strong style="color: #D4AF37;">EKINTABULI Kya Christmas 2025</strong><br>
                    📞 Contact: +256 XXX XXX XXX<br>
                    Ticket #${ticket.ticketNumber || '000'} | Generated: ${new Date().toLocaleDateString()}
                </div>
            </div>
        </div>
    `;
}

// ================================================
// DOWNLOAD AS ZIP
// ================================================
async function downloadAsZip() {
    if (allTickets.length === 0) {
        showNotification('No tickets to download! ', 'error');
        return;
    }
    
    const btn = document.getElementById('downloadZipBtn');
    btn.disabled = true;
    btn.innerHTML = '⏳ Preparing... ';
    
    showNotification('Preparing tickets for download...  This may take a moment.', 'warning');
    
    try {
        const zip = new JSZip();
        const ticketsFolder = zip.folder("EKINTABULI_Tickets");
        
        const canvas = document.getElementById('ticketCanvas');
        
        // Generate first 10 tickets as sample (full generation would take too long)
        const ticketsToExport = allTickets.slice(0, 10);
        
        for (let i = 0; i < ticketsToExport.length; i++) {
            const ticket = ticketsToExport[i];
            
            // Create front
            canvas.innerHTML = createTicketFrontHTML(ticket);
            
            // Generate QR code
            const qrContainer = canvas.querySelector(`#qr-${ticket.ticketId}`);
            if (qrContainer) {
                new QRCode(qrContainer, {
                    text: ticket.verifyUrl,
                    width: 110,
                    height: 110,
                    colorDark: '#1a1a2e',
                    colorLight: '#ffffff'
                });
            }
            
            await sleep(100);
            
            const frontCanvas = await html2canvas(canvas. firstChild, { scale: 2, useCORS: true });
            const frontData = frontCanvas.toDataURL('image/png'). split(',')[1];
            ticketsFolder.file(`${ticket.ticketId}_FRONT.png`, frontData, { base64: true });
            
            // Create back
            canvas. innerHTML = createTicketBackHTML(ticket);
            await sleep(50);
            
            const backCanvas = await html2canvas(canvas.firstChild, { scale: 2, useCORS: true });
            const backData = backCanvas.toDataURL('image/png').split(',')[1];
            ticketsFolder. file(`${ticket. ticketId}_BACK.png`, backData, { base64: true });
            
            btn.innerHTML = `⏳ ${i + 1}/${ticketsToExport.length}`;
        }
        
        // Generate ZIP
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'EKINTABULI_Tickets_Sample.zip');
        
        showNotification('Download started! (Sample of first 10 tickets)', 'success');
        
    } catch (error) {
        console. error('Download error:', error);
        showNotification('Download failed: ' + error. message, 'error');
    } finally {
        btn. disabled = false;
        btn.innerHTML = '📥 Download ZIP (PNG)';
    }
}

// ================================================
// EXPORT CSV REPORT
// ================================================
function exportReport() {
    if (allTickets. length === 0) {
        showNotification('No tickets to export!', 'error');
        return;
    }
    
    let csv = 'Ticket ID,Status,Created At,Sold At,Used At,Price\n';
    
    allTickets. forEach(ticket => {
        csv += `"${ticket.ticketId}","${ticket.status}","${ticket.createdAt || ''}","${ticket. soldAt || ''}","${ticket.usedAt || ''}","${ticket.price}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a. download = `EKINTABULI_Tickets_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('CSV report downloaded! ', 'success');
}

// ================================================
// LOGOUT
// ================================================
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        localStorage.removeItem('ekintabuli_auth');
        window.location.href = '../index.html';
    }
}

console.log('✅ Admin. js loaded successfully');

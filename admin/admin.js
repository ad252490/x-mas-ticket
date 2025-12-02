/* ================================================
   EKINTABULI Admin Dashboard - JavaScript
   Complete Working Version
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

// Get base URL for verification
function getVerifyUrl() {
    const baseUrl = window.location. origin + window.location.pathname. replace('/admin/', '/verify/');
    return baseUrl;
}

// ================================================
// STATE MANAGEMENT
// ================================================
let allTickets = [];
let currentPage = 1;
const ticketsPerPage = 20;
let generatedTicketsData = [];
let db = null;

// ================================================
// INITIALIZATION
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing EKINTABULI Admin Dashboard.. .');
    
    // Check if Firebase is available
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        db = firebase.firestore();
        initializeWithFirebase();
    } else {
        console.log('⚠️ Firebase not available, using local storage mode');
        initializeLocalMode();
    }
    
    // Setup event listeners
    setupEventListeners();
});

function initializeWithFirebase() {
    updateConnectionStatus('connecting');
    
    try {
        setupRealtimeListeners();
        updateConnectionStatus('connected');
        console.log('✅ Connected to Firebase');
    } catch (error) {
        console. error('❌ Firebase error:', error);
        updateConnectionStatus('disconnected');
        initializeLocalMode();
    }
}

function initializeLocalMode() {
    updateConnectionStatus('local');
    loadFromLocalStorage();
    updateDashboard();
}

function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Generate button
    document.getElementById('generateBtn').addEventListener('click', generateAllTickets);
    
    // Download button
    document. getElementById('downloadZipBtn').addEventListener('click', downloadAsZip);
    
    // Preview button
    document. getElementById('previewBtn').addEventListener('click', showPreview);
    
    // Refresh button
    document. getElementById('refreshBtn'). addEventListener('click', refreshTickets);
    
    // Export button
    document. getElementById('exportBtn'). addEventListener('click', exportReport);
    
    // Search and filter
    document. getElementById('searchTicket').addEventListener('keyup', filterTickets);
    document.getElementById('filterStatus').addEventListener('change', filterTickets);
    
    // Modal close
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    
    // Close modal on outside click
    document. getElementById('ticketPreviewModal').addEventListener('click', function(e) {
        if (e. target === this) closeModal();
    });
}

// ================================================
// CONNECTION STATUS
// ================================================
function updateConnectionStatus(status) {
    const statusEl = document.getElementById('connectionStatus');
    const textEl = statusEl.querySelector('.status-text');
    
    statusEl.className = 'connection-status ' + status;
    
    switch(status) {
        case 'connected':
            textEl. textContent = '🟢 Connected to Firebase - Real-time updates active';
            break;
        case 'disconnected':
            textEl.textContent = '🔴 Disconnected from database';
            break;
        case 'local':
            textEl.textContent = '🟡 Local Mode - Data stored in browser';
            break;
        default:
            textEl.textContent = '🟡 Connecting to database...';
    }
}

// ================================================
// FIREBASE REAL-TIME LISTENERS
// ================================================
function setupRealtimeListeners() {
    if (!db) return;
    
    // Listen to tickets collection
    db. collection('tickets').orderBy('createdAt', 'desc'). onSnapshot(snapshot => {
        console.log('📡 Tickets updated:', snapshot.size);
        allTickets = [];
        snapshot.forEach(doc => {
            allTickets.push({ id: doc.id, ...doc.data() });
        });
        updateDashboard();
        renderTicketTable();
    }, error => {
        console.error('Tickets listener error:', error);
        updateConnectionStatus('disconnected');
    });
    
    // Listen to scan logs
    db.collection('scanLogs').orderBy('timestamp', 'desc').limit(50).onSnapshot(snapshot => {
        renderScanLogs(snapshot);
    }, error => {
        console. error('Scan logs error:', error);
    });
}

// ================================================
// LOCAL STORAGE FUNCTIONS
// ================================================
function saveToLocalStorage() {
    localStorage.setItem('ekintabuli_tickets', JSON.stringify(allTickets));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('ekintabuli_tickets');
    if (saved) {
        allTickets = JSON.parse(saved);
    }
}

// ================================================
// DASHBOARD UPDATE
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
        
        if (ticket.status === 'DOWNLOADED') {
            stats.downloaded++;
        } else if (ticket.status === 'SOLD') {
            stats.sold++;
            stats.revenue += CONFIG.ticketPrice;
        } else if (ticket.status === 'USED') {
            stats. used++;
            stats.sold++;
            stats.revenue += CONFIG.ticketPrice;
        }
    });
    
    // Update stat boxes
    document.getElementById('statGenerated').textContent = stats.generated;
    document.getElementById('statDownloaded').textContent = stats.downloaded;
    document.getElementById('statSold').textContent = stats.sold;
    document.getElementById('statUsed'). textContent = stats. used;
    document.getElementById('statRevenue').textContent = formatCurrency(stats. revenue);
    
    // Update revenue tracking
    updateRevenueTracking(stats);
}

function updateRevenueTracking(stats) {
    const ticketCount = parseInt(document.getElementById('ticketCount').value) || 400;
    const ticketPrice = parseInt(document. getElementById('ticketPrice').value) || CONFIG.ticketPrice;
    
    const totalPotential = ticketCount * ticketPrice;
    const soldRevenue = stats.sold * ticketPrice;
    const attendancePercent = stats.sold > 0 ? Math.round((stats.used / stats.sold) * 100) : 0;
    
    document.getElementById('totalPotential').textContent = 
        `${ticketCount} × ${formatCurrency(ticketPrice)} = ${formatCurrency(totalPotential)}`;
    document.getElementById('soldRevenue').textContent = 
        `${stats.sold} × ${formatCurrency(ticketPrice)} = ${formatCurrency(soldRevenue)}`;
    document.getElementById('attendanceRate').textContent = 
        `${stats.used} / ${stats. sold} (${attendancePercent}%)`;
    document.getElementById('expectedCollection').textContent = formatCurrency(soldRevenue);
}

// ================================================
// TICKET TABLE
// ================================================
function renderTicketTable() {
    const tbody = document.getElementById('ticketTableBody');
    const searchTerm = document.getElementById('searchTicket'). value. toLowerCase();
    const filterStatus = document.getElementById('filterStatus').value;
    
    // Filter tickets
    let filteredTickets = allTickets. filter(ticket => {
        const matchesSearch = ticket.ticketId.toLowerCase().includes(searchTerm);
        const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
        return matchesSearch && matchesStatus;
    });
    
    // Pagination
    const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);
    const startIdx = (currentPage - 1) * ticketsPerPage;
    const pageTickets = filteredTickets.slice(startIdx, startIdx + ticketsPerPage);
    
    if (pageTickets. length === 0) {
        tbody. innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <div class="empty-icon">🎫</div>
                    <p>No tickets found</p>
                    <p class="empty-hint">Generate tickets or adjust your filters</p>
                </td>
            </tr>
        `;
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    let html = '';
    pageTickets.forEach(ticket => {
        const statusClass = `status-${ticket.status. toLowerCase()}`;
        const createdAt = ticket.createdAt ?  formatTimestamp(ticket.createdAt) : 'Just now';
        
        html += `
            <tr>
                <td><code style="background: rgba(212,175,55,0.1); padding: 5px 10px; border-radius: 5px;">${ticket.ticketId}</code></td>
                <td><span class="status-badge ${statusClass}">${ticket.status}</span></td>
                <td>${createdAt}</td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="viewTicket('${ticket.ticketId}')">👁️ View</button>
                    <button class="btn btn-small btn-primary" onclick="markAsSold('${ticket.id || ticket.ticketId}')">💰 Mark Sold</button>
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
    
    for (let i = 1; i <= Math.min(totalPages, 10); i++) {
        html += `<button class="${i === currentPage ?  'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    if (currentPage < totalPages) {
        html += `<button onclick="goToPage(${currentPage + 1})">Next →</button>`;
    }
    
    container.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    renderTicketTable();
}

function filterTickets() {
    currentPage = 1;
    renderTicketTable();
}

function refreshTickets() {
    if (db) {
        showNotification('Refreshing from database...', 'success');
    } else {
        loadFromLocalStorage();
        updateDashboard();
        renderTicketTable();
        showNotification('Tickets refreshed', 'success');
    }
}

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
            
            let statusClass = '';
            let icon = '';
            
            if (log.result === 'VALID') {
                validScans++;
                statusClass = 'valid';
                icon = '✅';
            } else if (log.result === 'INVALID') {
                invalidScans++;
                statusClass = 'invalid';
                icon = '❌';
            } else {
                duplicateScans++;
                statusClass = 'duplicate';
                icon = '⚠️';
            }
            
            const time = log.timestamp ? formatTimestamp(log.timestamp) : 'Unknown time';
            
            logsHtml += `
                <div class="scan-log-item ${statusClass}">
                    <div class="scan-log-icon">${icon}</div>
                    <div class="scan-log-content">
                        <div class="scan-log-ticket">Ticket: ${log.ticketId || 'Unknown'}</div>
                        <div class="scan-log-time">${time} - ${log.result || 'Unknown'}</div>
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
    const ticketCount = parseInt(document.getElementById('ticketCount').value) || 400;
    const btn = document.getElementById('generateBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document. getElementById('progressText');
    const badge = document.getElementById('ticketBadge');
    
    btn.disabled = true;
    btn.innerHTML = '⏳ Generating...';
    badge.textContent = 'Generating';
    progressContainer. style.display = 'block';
    
    generatedTicketsData = [];
    
    try {
        for (let i = 1; i <= ticketCount; i++) {
            const ticketId = generateSecureTicketId(i);
            const encryptedCode = encryptTicketCode(ticketId);
            const verifyUrl = `${getVerifyUrl()}?t=${encodeURIComponent(encryptedCode)}`;
            
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
            
            generatedTicketsData.push(ticketData);
            
            // Update progress
            const percent = Math.round((i / ticketCount) * 100);
            progressFill.style.width = `${percent}%`;
            progressFill.textContent = `${percent}%`;
            progressText.textContent = `Generating ticket ${i} of ${ticketCount}...`;
            
            // Allow UI to update every 50 tickets
            if (i % 50 === 0) {
                await sleep(10);
            }
        }
        
        progressText.textContent = 'Saving tickets... ';
        
        // Save to Firebase or local storage
        if (db) {
            await saveTicketsToFirebase(generatedTicketsData);
        } else {
            allTickets = generatedTicketsData;
            saveToLocalStorage();
        }
        
        progressText.textContent = `✅ Successfully generated ${ticketCount} tickets! `;
        badge.textContent = 'Complete';
        
        // Enable buttons
        document.getElementById('downloadZipBtn').disabled = false;
        document.getElementById('previewBtn').disabled = false;
        
        showNotification(`Successfully generated ${ticketCount} tickets! `, 'success');
        
        updateDashboard();
        renderTicketTable();
        
    } catch (error) {
        console.error('Error generating tickets:', error);
        progressText.textContent = '❌ Error generating tickets';
        badge.textContent = 'Error';
        showNotification('Failed to generate tickets: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🎫 Generate Tickets';
    }
}

async function saveTicketsToFirebase(tickets) {
    const batchSize = 500; // Firestore batch limit
    
    for (let i = 0; i < tickets.length; i += batchSize) {
        const batch = db.batch();
        const chunk = tickets.slice(i, i + batchSize);
        
        chunk.forEach(ticket => {
            const docRef = db.collection('tickets').doc();
            batch.set(docRef, {
                ...ticket,
                createdAt: firebase.firestore. FieldValue.serverTimestamp()
            });
        });
        
        await batch. commit();
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
        result += chars. charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function encryptTicketCode(ticketId) {
    const timestamp = Date.now(). toString(36);
    const combined = `${ticketId}|${CONFIG.secretKey}|${timestamp}`;
    return btoa(combined). replace(/=/g, ''). substring(0, 32);
}

// ================================================
// TICKET DESIGN - TWO SIDED
// ================================================
function createTicketFrontHTML(ticket) {
    return `
        <div style="
            width: 400px;
            height: 600px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            border-radius: 20px;
            padding: 30px;
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
                    transparent 30px,
                    rgba(212, 175, 55, 0.03) 30px,
                    rgba(212, 175, 55, 0.03) 60px
                );
                pointer-events: none;
            "></div>
            
            <!-- Diagonal Watermark -->
            <div style="
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 50px;
                font-weight: 900;
                color: rgba(212, 175, 55, 0. 05);
                white-space: nowrap;
                pointer-events: none;
                letter-spacing: 15px;
            ">EKINTABULI</div>
            
            <!-- Gold Border -->
            <div style="
                position: absolute;
                top: 10px; left: 10px; right: 10px; bottom: 10px;
                border: 3px solid rgba(212, 175, 55, 0. 5);
                border-radius: 15px;
                pointer-events: none;
            "></div>
            
            <!-- Corners -->
            <div style="position: absolute; top: 20px; left: 20px; font-size: 28px;">👑</div>
            <div style="position: absolute; top: 20px; right: 20px; font-size: 28px;">🎄</div>
            
            <!-- Header -->
            <div style="text-align: center; margin-top: 35px; position: relative; z-index: 1;">
                <div style="font-size: 11px; color: #D4AF37; letter-spacing: 4px; margin-bottom: 8px;">EXCLUSIVE CHRISTMAS EVENT</div>
                <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 38px; font-weight: 900; color: #D4AF37; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">EKINTABULI</div>
                <div style="font-size: 15px; color: #ccc; margin-top: 5px;">Kya Christmas 2025</div>
            </div>
            
            <!-- Event Details -->
            <div style="margin-top: 35px; position: relative; z-index: 1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding: 14px; background: rgba(212, 175, 55, 0. 1); border-radius: 10px; border: 1px solid rgba(212, 175, 55, 0.3);">
                    <div>
                        <div style="font-size: 10px; color: #888; margin-bottom: 4px;">📅 DATE</div>
                        <div style="font-weight: 600; font-size: 13px;">25th December 2025</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 10px; color: #888; margin-bottom: 4px;">⏰ TIME</div>
                        <div style="font-weight: 600; font-size: 13px;">6:00 PM - Late</div>
                    </div>
                </div>
                
                <div style="padding: 14px; background: rgba(212, 175, 55, 0. 1); border-radius: 10px; border: 1px solid rgba(212, 175, 55, 0.3); margin-bottom: 12px;">
                    <div style="font-size: 10px; color: #888; margin-bottom: 4px;">📍 VENUE</div>
                    <div style="font-weight: 600; font-size: 13px;">Club Missouka</div>
                </div>
                
                <div style="display: flex; justify-content: space-between; padding: 14px; background: rgba(40, 167, 69, 0.1); border-radius: 10px; border: 1px solid rgba(40, 167, 69, 0.3);">
                    <div>
                        <div style="font-size: 10px; color: #888; margin-bottom: 4px;">🎫 TICKET</div>
                        <div style="font-weight: 700; font-size: 14px; color: #D4AF37;">${ticket.ticketId}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 10px; color: #888; margin-bottom: 4px;">💵 PRICE</div>
                        <div style="font-weight: 700; font-size: 14px; color: #28a745;">10,000 UGX</div>
                    </div>
                </div>
            </div>
            
            <!-- QR Code -->
            <div style="text-align: center; margin-top: 20px; position: relative; z-index: 1;">
                <div style="display: inline-block; padding: 12px; background: white; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.3);">
                    <div id="qr-${ticket.ticketId}" style="width: 110px; height: 110px;"></div>
                </div>
                <div style="margin-top: 8px; font-size: 10px; color: #888;">Scan with phone camera to verify</div>
            </div>
            
            <!-- Footer -->
            <div style="position: absolute; bottom: 20px; left: 30px; right: 30px; text-align: center; z-index: 1;">
                <div style="font-size: 9px; color: #666; border-top: 1px solid rgba(212, 175, 55, 0. 3); padding-top: 12px;">
                    🔒 Protected & verified digitally<br>
                    <span style="color: #D4AF37;">Valid for one person only</span>
                </div>
            </div>
        </div>
    `;
}

function createTicketBackHTML(ticket) {
    return `
        <div style="
            width: 400px;
            height: 600px;
            background: linear-gradient(135deg, #0f3460 0%, #16213e 50%, #1a1a2e 100%);
            border-radius: 20px;
            padding: 30px;
            position: relative;
            overflow: hidden;
            font-family: 'Montserrat', Arial, sans-serif;
            color: white;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        ">
            <!-- Security Pattern -->
            <div style="
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: 
                    repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(212,175,55,0.02) 20px, rgba(212,175,55,0. 02) 21px),
                    repeating-linear-gradient(90deg, transparent, transparent

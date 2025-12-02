/* ================================================
   EKINTABULI Admin Dashboard - JavaScript
   ================================================ */

// Configuration
const CONFIG = {
    eventName: 'EKINTABULI Kya Christmas',
    eventDate: '25th December 2025',
    eventVenue: 'Club Missouka',
    ticketPrice: 10000,
    currency: 'UGX',
    verifyBaseUrl: window.location.origin + '/verify/',
    secretKey: 'EKINTABULI-2025-SECRET-KEY-XMAS'
};

// State
let allTickets = [];
let currentPage = 1;
const ticketsPerPage = 20;
let unsubscribeListeners = [];

// ================================================
// INITIALIZATION
// ================================================

async function initializeDashboard() {
    console.log('🚀 Initializing EKINTABULI Admin Dashboard...');
    
    updateConnectionStatus('connecting');
    
    try {
        // Set up real-time listeners
        setupRealtimeListeners();
        
        // Load initial data
        await loadTickets();
        
        updateConnectionStatus('connected');
        console.log('✅ Dashboard initialized successfully');
    } catch (error) {
        console. error('❌ Dashboard initialization error:', error);
        updateConnectionStatus('disconnected');
        showNotification('Failed to connect to database', 'error');
    }
}

function updateConnectionStatus(status) {
    const statusEl = document.getElementById('connectionStatus');
    const textEl = statusEl.querySelector('.status-text');
    
    statusEl.className = 'connection-status ' + status;
    
    switch(status) {
        case 'connected':
            textEl.textContent = '🟢 Connected to Firebase - Real-time updates active';
            break;
        case 'disconnected':
            textEl.textContent = '🔴 Disconnected from database';
            break;
        default:
            textEl.textContent = '🟡 Connecting to database...';
    }
}

// ================================================
// REAL-TIME FIREBASE LISTENERS
// ================================================

function setupRealtimeListeners() {
    // Clean up any existing listeners
    unsubscribeListeners.forEach(unsub => unsub());
    unsubscribeListeners = [];
    
    // Listen to tickets collection
    const ticketsRef = db.collection('tickets');
    const unsubTickets = ticketsRef. onSnapshot(snapshot => {
        console.log('📡 Tickets updated:', snapshot.size);
        processTicketSnapshot(snapshot);
    }, error => {
        console.error('Tickets listener error:', error);
        updateConnectionStatus('disconnected');
    });
    unsubscribeListeners.push(unsubTickets);
    
    // Listen to scan logs
    const scansRef = db.collection('scanLogs'). orderBy('timestamp', 'desc'). limit(50);
    const unsubScans = scansRef.onSnapshot(snapshot => {
        console.log('📡 Scan logs updated:', snapshot.size);
        processScanLogsSnapshot(snapshot);
    }, error => {
        console.error('Scan logs listener error:', error);
    });
    unsubscribeListeners. push(unsubScans);
    
    // Listen to security events
    const securityRef = db.collection('securityLogs'). orderBy('timestamp', 'desc').limit(20);
    const unsubSecurity = securityRef.onSnapshot(snapshot => {
        processSecurityLogsSnapshot(snapshot);
    }, error => {
        console.error('Security logs listener error:', error);
    });
    unsubscribeListeners.push(unsubSecurity);
}

function processTicketSnapshot(snapshot) {
    allTickets = [];
    let stats = {
        generated: 0,
        downloaded: 0,
        sold: 0,
        used: 0,
        revenue: 0
    };
    
    snapshot.forEach(doc => {
        const ticket = { id: doc.id, ...doc.data() };
        allTickets.push(ticket);
        
        stats.generated++;
        if (ticket.status === 'DOWNLOADED') stats.downloaded++;
        if (ticket.status === 'SOLD') {
            stats.sold++;
            stats. revenue += CONFIG.ticketPrice;
        }
        if (ticket.status === 'USED') {
            stats.used++;
            stats.sold++; // Used tickets were also sold
            stats.revenue += CONFIG.ticketPrice;
        }
    });
    
    updateDashboardStats(stats);
    renderTicketTable();
    updateRevenueTracking(stats);
}

function processScanLogsSnapshot(snapshot) {
    const container = document.getElementById('scanLogsContainer');
    let totalScans = 0, validScans = 0, invalidScans = 0, duplicateScans = 0;
    let logsHtml = '';
    
    snapshot.forEach(doc => {
        const log = doc.data();
        totalScans++;
        
        let statusClass = '';
        let icon = '';
        
        switch(log.result) {
            case 'VALID':
                validScans++;
                statusClass = 'valid';
                icon = '✅';
                break;
            case 'INVALID':
                invalidScans++;
                statusClass = 'invalid';
                icon = '❌';
                break;
            case 'DUPLICATE':
            case 'ALREADY_USED':
                duplicateScans++;
                statusClass = 'duplicate';
                icon = '⚠️';
                break;
            default:
                icon = '❓';
        }
        
        const time = log.timestamp ?  formatTimestamp(log.timestamp) : 'Unknown time';
        
        logsHtml += `
            <div class="scan-log-item ${statusClass}">
                <div class="scan-log-icon">${icon}</div>
                <div class="scan-log-content">
                    <div class="scan-log-ticket">Ticket: ${log.ticketId || 'Unknown'}</div>
                    <div class="scan-log-time">${time} - ${log.result || 'Unknown result'}</div>
                </div>
            </div>
        `;
    });
    
    // Update stats
    document.getElementById('totalScans').textContent = totalScans;
    document.getElementById('validScans'). textContent = validScans;
    document.getElementById('invalidScans').textContent = invalidScans;
    document.getElementById('duplicateScans'). textContent = duplicateScans;
    
    // Update logs container
    container. innerHTML = logsHtml || '<div class="empty-state"><p>No scans recorded yet</p></div>';
}

function processSecurityLogsSnapshot(snapshot) {
    const container = document.getElementById('securityLog');
    let logsHtml = '';
    let fraudCount = 0;
    
    snapshot.forEach(doc => {
        const log = doc.data();
        fraudCount++;
        
        const time = log.timestamp ? formatTimestamp(log.timestamp) : 'Unknown time';
        
        logsHtml += `
            <div class="security-item">
                <div class="security-item-header">
                    <span class="security-item-title">🚨 ${log.type || 'Security Event'}</span>
                    <span class="security-item-time">${time}</span>
                </div>
                <div class="security-item-details">${log.details || 'No details available'}</div>
            </div>
        `;
    });
    
    document.getElementById('statFraud').textContent = fraudCount;
    container.innerHTML = logsHtml || '<div class="empty-state"><p>No security events recorded</p></div>';
}

// ================================================
// DASHBOARD STATS & REVENUE
// ================================================

function updateDashboardStats(stats) {
    document.getElementById('statGenerated').textContent = stats.generated;
    document.getElementById('statDownloaded'). textContent = stats. downloaded;
    document.getElementById('statSold').textContent = stats.sold;
    document.getElementById('statUsed').textContent = stats.used;
    document. getElementById('statRevenue').textContent = formatCurrency(stats. revenue);
}

function updateRevenueTracking(stats) {
    const ticketCount = parseInt(document.getElementById('ticketCount').value) || 400;
    const ticketPrice = parseInt(document. getElementById('ticketPrice').value) || CONFIG.ticketPrice;
    
    const totalPotential = ticketCount * ticketPrice;
    const soldRevenue = stats.sold * ticketPrice;
    const attendancePercent = stats.sold > 0 ?  Math.round((stats. used / stats.sold) * 100) : 0;
    
    document.getElementById('totalPotential').textContent = 
        `${ticketCount} × ${formatCurrency(ticketPrice)} = ${formatCurrency(totalPotential)}`;
    document.getElementById('soldRevenue'). textContent = 
        `${stats.sold} × ${formatCurrency(ticketPrice)} = ${formatCurrency(soldRevenue)}`;
    document.getElementById('attendanceRate').textContent = 
        `${stats.used} / ${stats.sold} (${attendancePercent}%)`;
    document.getElementById('expectedCollection').textContent = formatCurrency(soldRevenue);
}

// ================================================
// TICKET TABLE
// ================================================

async function loadTickets() {
    try {
        const snapshot = await db.collection('tickets').orderBy('createdAt', 'desc').get();
        processTicketSnapshot(snapshot);
    } catch (error) {
        console.error('Error loading tickets:', error);
    }
}

function renderTicketTable() {
    const tbody = document.getElementById('ticketTableBody');
    const searchTerm = document.getElementById('searchTicket').value. toLowerCase();
    const filterStatus = document.getElementById('filterStatus').value;
    
    // Filter tickets
    let filteredTickets = allTickets. filter(ticket => {
        const matchesSearch = ticket. ticketId.toLowerCase().includes(searchTerm);
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
                <td colspan="6" class="empty-state">
                    <div class="empty-icon">🎫</div>
                    <p>No tickets found</p>
                </td>
            </tr>
        `;
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    let html = '';
    pageTickets.forEach(ticket => {
        const statusClass = `status-${ticket.status. toLowerCase()}`;
        const createdAt = ticket.createdAt ?  formatTimestamp(ticket.createdAt) : '-';
        const soldAt = ticket.soldAt ? formatTimestamp(ticket.soldAt) : '-';
        const usedAt = ticket.usedAt ?  formatTimestamp(ticket.usedAt) : '-';
        
        html += `
            <tr>
                <td><code>${ticket.ticketId}</code></td>
                <td><span class="status-badge ${statusClass}">${ticket.status}</span></td>
                <td>${createdAt}</td>
                <td>${soldAt}</td>
                <td>${usedAt}</td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="previewTicket('${ticket.ticketId}')">👁️</button>
                    <button class="btn btn-small btn-primary" onclick="markAsSold('${ticket. id}')">💰</button>
                </td>
            </tr>
        `;
    });
    
    tbody. innerHTML = html;
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
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button class="${i === currentPage ?  'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<button disabled>...</button>`;
        }
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
    loadTickets();
    showNotification('Tickets refreshed', 'success');
}

// ================================================
// TICKET GENERATION
// ================================================

async function generateAllTickets() {
    const ticketCount = parseInt(document. getElementById('ticketCount').value) || 400;
    const btn = document.getElementById('generateBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document. getElementById('progressText');
    const badge = document.getElementById('ticketBadge');
    
    btn.disabled = true;
    btn.innerHTML = '⏳ Generating...';
    badge.textContent = 'Generating';
    progressContainer.style.display = 'block';
    
    const generatedTickets = [];
    const batch = db.batch();
    
    try {
        for (let i = 1; i <= ticketCount; i++) {
            const ticketId = generateSecureTicketId(i);
            const ticketData = {
                ticketId: ticketId,
                ticketNumber: i,
                status: 'GENERATED',
                createdAt: firebase.firestore. FieldValue.serverTimestamp(),
                eventName: CONFIG.eventName,
                eventDate: CONFIG.eventDate,
                eventVenue: CONFIG.eventVenue,
                price: CONFIG.ticketPrice,
                encryptedCode: encryptTicketCode(ticketId),
                verifyUrl: `${CONFIG.verifyBaseUrl}? t=${encodeURIComponent(encryptTicketCode(ticketId))}`
            };
            
            const docRef = db.collection('tickets'). doc();
            batch.set(docRef, ticketData);
            generatedTickets.push({ id: docRef. id, ...ticketData });
            
            // Update progress
            const percent = Math.round((i / ticketCount) * 100);
            progressFill.style.width = `${percent}%`;
            progressFill.textContent = `${percent}%`;
            progressText.textContent = `Generating ticket ${i} of ${ticketCount}... `;
            
            // Allow UI to update
            if (i % 50 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        
        progressText.textContent = 'Saving to database...';
        await batch.commit();
        
        progressText.textContent = `✅ Successfully generated ${ticketCount} tickets! `;
        badge.textContent = 'Complete';
        
        // Enable download buttons
        document.getElementById('downloadZipBtn').disabled = false;
        document. getElementById('downloadPdfBtn').disabled = false;
        
        showNotification(`Successfully generated ${ticketCount} tickets! `, 'success');
        
        // Store for download
        window.generatedTickets = generatedTickets;
        
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
    // Simple encryption for demo - use stronger encryption in production
    const timestamp = Date.now(). toString(36);
    const hash = btoa(`${ticketId}|${CONFIG.secretKey}|${timestamp}`);
    return hash. replace(/=/g, ''). substring(0, 32);
}

// ================================================
// TICKET DESIGN - TWO SIDED
// ================================================

function createTicketFrontHTML(ticket) {
    return `
        <div class="ticket-front" style="
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
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 30px,
                    rgba(212, 175, 55, 0.03) 30px,
                    rgba(212, 175, 55, 0.03) 60px
                );
                pointer-events: none;
            "></div>
            
            <!-- Diagonal Watermark Text -->
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 60px;
                font-weight: 900;
                color: rgba(212, 175, 55, 0. 05);
                white-space: nowrap;
                pointer-events: none;
                letter-spacing: 20px;
            ">EKINTABULI</div>
            
            <!-- Gold Border -->
            <div style="
                position: absolute;
                top: 10px;
                left: 10px;
                right: 10px;
                bottom: 10px;
                border: 3px solid rgba(212, 175, 55, 0. 5);
                border-radius: 15px;
                pointer-events: none;
            "></div>
            
            <!-- Corner Decorations -->
            <div style="position: absolute; top: 20px; left: 20px; font-size: 30px;">👑</div>
            <div style="position: absolute; top: 20px; right: 20px; font-size: 30px;">🎄</div>
            
            <!-- Header -->
            <div style="text-align: center; margin-top: 30px; position: relative; z-index: 1;">
                <div style="font-size: 12px; color: #D4AF37; letter-spacing: 3px; margin-bottom: 5px;">EXCLUSIVE CHRISTMAS EVENT</div>
                <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 36px; font-weight: 900; color: #D4AF37; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">EKINTABULI</div>
                <div style="font-size: 16px; color: #ccc; margin-top: 5px;">Kya Christmas 2025</div>
            </div>
            
            <!-- Event Details -->
            <div style="margin-top: 40px; position: relative; z-index: 1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 15px; background: rgba(212, 175, 55, 0. 1); border-radius: 10px; border: 1px solid rgba(212, 175, 55, 0.3);">
                    <div>
                        <div style="font-size: 11px; color: #888; margin-bottom: 3px;">📅 DATE</div>
                        <div style="font-weight: 600; font-size: 14px;">25th December 2025</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 11px; color: #888; margin-bottom: 3px;">⏰ TIME</div>
                        <div style="font-weight: 600; font-size: 14px;">6:00 PM - Late</div>
                    </div>
                </div>
                
                <div style="padding: 15px; background: rgba(212, 175, 55, 0. 1); border-radius: 10px; border: 1px solid rgba(212, 175, 55, 0.3); margin-bottom: 15px;">
                    <div style="font-size: 11px; color: #888; margin-bottom: 3px;">📍 VENUE</div>
                    <div style="font-weight: 600; font-size: 14px;">Club Missouka</div>
                </div>
                
                <div style="display: flex; justify-content: space-between; padding: 15px; background: rgba(40, 167, 69, 0.1); border-radius: 10px; border: 1px solid rgba(40, 167, 69, 0.3);">
                    <div>
                        <div style="font-size: 11px; color: #888; margin-bottom: 3px;">🎫 TICKET</div>
                        <div style="font-weight: 700; font-size: 16px; color: #D4AF37;">${ticket.ticketId}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 11px; color: #888; margin-bottom: 3px;">💵 PRICE</div>
                        <div style="font-weight: 700; font-size: 16px; color: #28a745;">10,000 UGX</div>
                    </div>
                </div>
            </div>
            
            <!-- QR Code Section -->
            <div style="text-align: center; margin-top: 25px; position: relative; z-index: 1;">
                <div style="display: inline-block; padding: 15px; background: white; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.3);">
                    <div id="qrcode-${ticket.ticketId}" style="width: 120px; height: 120px;"></div>
                </div>
                <div style="margin-top: 10px; font-size: 11px; color: #888;">Scan to verify authenticity</div>
            </div>
            
            <!-- Footer -->
            <div style="position: absolute; bottom: 25px; left: 30px; right: 30px; text-align: center; z-index: 1;">
                <div style="font-size: 10px; color: #666; border-top: 1px solid rgba(212, 175, 55, 0.3); padding-top: 15px;">
                    🔒 This ticket is protected and verified digitally<br>
                    <span style="color: #D4AF37;">Valid for one person only • Non-transferable after scan</span>
                </div>
            </div>
            
            <!-- Holographic Effect -->
            <div style="
                position: absolute;
                top: 0;
                left: -100%;
                width: 50%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                transform: skewX(-25deg);
                pointer-events: none;
            "></div>
        </div>
    `;
}

function createTicketBackHTML(ticket) {
    return `
        <div class="ticket-back" style="
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
            <!-- Security Pattern Background -->
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: 
                    repeating-

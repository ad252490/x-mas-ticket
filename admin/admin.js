/* ================================================
   EKINTABULI Admin Dashboard - Professional Ticket System
   High Security + Premium Design
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
    secretKey: 'EKINTABULI-2025-XMAS-SECRET',
    // Ticket size: 5.5cm x 2cm at 300 DPI = 650px x 236px
    // We'll use 2x for high quality: 1300px x 472px
    ticketWidth: 650,
    ticketHeight: 236,
    printScale: 2
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
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

function formatCurrency(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    var date;
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
    // YOUR PRODUCTION URL - CHANGE THIS TO YOUR ACTUAL DEPLOYED URL
    var productionUrl = 'https://ad252490.github.io/x-mas-ticket/verify/index.html';
    
    // Always use production URL for QR codes
    return productionUrl;
}

function showNotification(message, type) {
    type = type || 'success';
    var container = document.getElementById('notificationContainer');
    if (! container) return;
    var icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
    var notification = document.createElement('div');
    notification.className = 'notification ' + type;
    notification. innerHTML = '<span>' + icon + '</span><span>' + message + '</span>';
    container.appendChild(notification);
    setTimeout(function() {
        notification.style.opacity = '0';
        setTimeout(function() { notification.remove(); }, 300);
    }, 4000);
}

// ================================================
// SECURE TICKET ID GENERATION
// ================================================
function generateSecureTicketId(number) {
    var prefix = 'EKT';
    var year = '25';
    var paddedNum = String(number).padStart(4, '0');
    var randomSuffix = generateRandomString(4);
    var checksum = generateChecksum(prefix + year + paddedNum + randomSuffix);
    return prefix + '-' + year + '-' + paddedNum + '-' + randomSuffix + checksum;
}

function generateRandomString(length) {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var result = '';
    var array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    for (var i = 0; i < length; i++) {
        result += chars.charAt(array[i] % chars.length);
    }
    return result;
}

function generateChecksum(str) {
    var sum = 0;
    for (var i = 0; i < str.length; i++) {
        sum += str.charCodeAt(i) * (i + 1);
    }
    return (sum % 36). toString(36). toUpperCase();
}

function encryptTicketCode(ticketId) {
    var timestamp = Date.now(). toString(36);
    var random = generateRandomString(8);
    var combined = ticketId + '|' + CONFIG.secretKey + '|' + timestamp + '|' + random;
    var encrypted = btoa(combined);
    // Add integrity hash
    var hash = simpleHash(encrypted);
    return encrypted. replace(/[=+/]/g, '') + hash;
}

function simpleHash(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash). toString(36). substring(0, 4). toUpperCase();
}

// ================================================
// INITIALIZATION
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing EKINTABULI Admin Dashboard.. .');
    checkFirebaseConnection();
    setupEventListeners();
    loadTickets();
    updateDashboard();
    renderTicketTable();
});

function checkFirebaseConnection() {
    var statusEl = document.getElementById('connectionStatus');
    var textEl = statusEl.querySelector('.status-text');
    var dotEl = statusEl.querySelector('.status-dot');
    
    if (typeof firebase !== 'undefined' && typeof db !== 'undefined' && db !== null) {
        db.collection('tickets').limit(1).get()
            .then(function() {
                isFirebaseConnected = true;
                statusEl.className = 'connection-status connected';
                textEl.textContent = 'Connected to Firebase - Real-time sync active';
                dotEl.style.background = '#28a745';
                console.log('Firebase connected');
                setupFirebaseListeners();
            })
            . catch(function(error) {
                console.warn('Firebase read failed:', error);
                setLocalMode(statusEl, textEl, dotEl);
            });
    } else {
        setLocalMode(statusEl, textEl, dotEl);
    }
}

function setLocalMode(statusEl, textEl, dotEl) {
    isFirebaseConnected = false;
    statusEl.className = 'connection-status local';
    textEl.textContent = 'Offline Mode - Data saved locally';
    dotEl.style.background = '#fd7e14';
    console.log('Running in local storage mode');
}

function setupFirebaseListeners() {
    if (!isFirebaseConnected || !db) return;
    
    db.collection('tickets'). orderBy('createdAt', 'desc').onSnapshot(function(snapshot) {
        allTickets = [];
        snapshot.forEach(function(doc) {
            var data = doc.data();
            data.id = doc. id;
            allTickets.push(data);
        });
        updateDashboard();
        renderTicketTable();
    });
    
    db.collection('scanLogs').orderBy('timestamp', 'desc').limit(50).onSnapshot(function(snapshot) {
        renderScanLogs(snapshot);
    });
}

function setupEventListeners() {
    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                sessionStorage.removeItem('ekintabuli_auth');
                localStorage.removeItem('ekintabuli_auth');
                window. location.href = '../index.html';
            }
        });
    }
    
    var generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateAllTickets);
    }
    
    var downloadZipBtn = document. getElementById('downloadZipBtn');
    if (downloadZipBtn) {
        downloadZipBtn.addEventListener('click', downloadAsZip);
    }
    
    var downloadPdfBtn = document.getElementById('downloadPdfBtn');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', downloadAsPdf);
    }
    
    var previewBtn = document. getElementById('previewBtn');
    if (previewBtn) {
        previewBtn.addEventListener('click', showPreview);
    }
    
    var refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadTickets();
            updateDashboard();
            renderTicketTable();
            showNotification('Tickets refreshed! ', 'success');
        });
    }
    
    var exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportReport);
    }
    
    var searchInput = document.getElementById('searchTicket');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            currentPage = 1;
            renderTicketTable();
        });
    }
    
    var filterSelect = document.getElementById('filterStatus');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            currentPage = 1;
            renderTicketTable();
        });
    }
    
    var closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn. addEventListener('click', closeModal);
    }
    
    var modal = document.getElementById('ticketPreviewModal');
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
    var saved = localStorage. getItem('ekintabuli_tickets');
    if (saved) {
        try {
            allTickets = JSON.parse(saved);
            console.log('Loaded ' + allTickets. length + ' tickets from local storage');
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
    var stats = { generated: 0, downloaded: 0, sold: 0, used: 0, revenue: 0 };
    
    for (var i = 0; i < allTickets.length; i++) {
        var ticket = allTickets[i];
        stats.generated++;
        if (ticket.status === 'DOWNLOADED') stats.downloaded++;
        if (ticket.status === 'SOLD') { stats.sold++; stats.revenue += CONFIG.ticketPrice; }
        if (ticket.status === 'USED') { stats.used++; stats.sold++; stats.revenue += CONFIG.ticketPrice; }
    }
    
    document.getElementById('statGenerated').textContent = stats.generated;
    document.getElementById('statDownloaded').textContent = stats.downloaded;
    document.getElementById('statSold').textContent = stats.sold;
    document.getElementById('statUsed'). textContent = stats. used;
    document.getElementById('statRevenue').textContent = formatCurrency(stats.revenue);
    
    var ticketCount = parseInt(document.getElementById('ticketCount').value) || 400;
    var ticketPrice = parseInt(document.getElementById('ticketPrice').value) || CONFIG.ticketPrice;
    var totalPotential = ticketCount * ticketPrice;
    var soldRevenue = stats.sold * ticketPrice;
    var attendancePercent = stats.sold > 0 ?  Math.round((stats. used / stats.sold) * 100) : 0;
    
    document.getElementById('totalPotential').textContent = ticketCount + ' x ' + formatCurrency(ticketPrice) + ' = ' + formatCurrency(totalPotential) + ' UGX';
    document.getElementById('soldRevenue').textContent = stats.sold + ' x ' + formatCurrency(ticketPrice) + ' = ' + formatCurrency(soldRevenue) + ' UGX';
    document. getElementById('attendanceRate').textContent = stats.used + ' / ' + stats.sold + ' (' + attendancePercent + '%)';
    document.getElementById('expectedCollection').textContent = formatCurrency(soldRevenue) + ' UGX';
}

// ================================================
// TICKET TABLE
// ================================================
function renderTicketTable() {
    var tbody = document.getElementById('ticketTableBody');
    var searchTerm = (document.getElementById('searchTicket').value || '').toLowerCase();
    var filterStatus = document.getElementById('filterStatus').value;
    
    var filteredTickets = allTickets. filter(function(ticket) {
        var matchesSearch = ticket. ticketId.toLowerCase(). indexOf(searchTerm) !== -1;
        var matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
        return matchesSearch && matchesStatus;
    });
    
    var totalPages = Math.ceil(filteredTickets. length / ticketsPerPage);
    var startIdx = (currentPage - 1) * ticketsPerPage;
    var pageTickets = filteredTickets.slice(startIdx, startIdx + ticketsPerPage);
    
    if (pageTickets. length === 0) {
        tbody. innerHTML = '<tr><td colspan="4" class="empty-state"><div class="empty-icon">🎫</div><p>No tickets found</p></td></tr>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    var html = '';
    for (var i = 0; i < pageTickets.length; i++) {
        var ticket = pageTickets[i];
        var statusClass = 'status-' + ticket.status. toLowerCase();
        html += '<tr>' +
            '<td><code style="background:rgba(212,175,55,0. 1);padding:5px 10px;border-radius:5px;font-size:12px;">' + ticket.ticketId + '</code></td>' +
            '<td><span class="status-badge ' + statusClass + '">' + ticket. status + '</span></td>' +
            '<td>' + formatTimestamp(ticket. createdAt) + '</td>' +
            '<td>' +
                '<button class="btn btn-small btn-secondary" onclick="viewTicket(\'' + ticket.ticketId + '\')">👁️</button>' +
                '<button class="btn btn-small btn-primary" onclick="markTicketAsSold(\'' + ticket.ticketId + '\')">💰</button>' +
            '</td></tr>';
    }
    tbody.innerHTML = html;
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    var container = document.getElementById('pagination');
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    var html = '';
    if (currentPage > 1) html += '<button onclick="goToPage(' + (currentPage - 1) + ')">Prev</button>';
    for (var i = 1; i <= totalPages; i++) {
        if (i <= 3 || i > totalPages - 3 || Math.abs(i - currentPage) <= 1) {
            html += '<button class="' + (i === currentPage ? 'active' : '') + '" onclick="goToPage(' + i + ')">' + i + '</button>';
        } else if (i === 4 || i === totalPages - 3) {
            html += '<span>...</span>';
        }
    }
    if (currentPage < totalPages) html += '<button onclick="goToPage(' + (currentPage + 1) + ')">Next</button>';
    container.innerHTML = html;
}

window.goToPage = function(page) {
    currentPage = page;
    renderTicketTable();
};

// ================================================
// SCAN LOGS
// ================================================
function renderScanLogs(snapshot) {
    var container = document.getElementById('scanLogsContainer');
    var totalScans = 0, validScans = 0, invalidScans = 0, duplicateScans = 0;
    var logsHtml = '';
    
    if (snapshot && snapshot.forEach) {
        snapshot.forEach(function(doc) {
            var log = doc.data();
            totalScans++;
            var statusClass = 'invalid';
            var icon = '❓';
            if (log.result === 'VALID' || log.result === 'SUCCESS') {
                validScans++; statusClass = 'valid'; icon = '✅';
            } else if (log.result === 'ALREADY_USED' || log.result === 'DUPLICATE') {
                duplicateScans++; statusClass = 'duplicate'; icon = '⚠️';
            } else {
                invalidScans++; statusClass = 'invalid'; icon = '❌';
            }
            logsHtml += '<div class="scan-log-item ' + statusClass + '">' +
                '<div class="scan-log-icon">' + icon + '</div>' +
                '<div class="scan-log-content">' +
                    '<div class="scan-log-ticket">' + (log.ticketId || 'Unknown') + '</div>' +
                    '<div class="scan-log-time">' + formatTimestamp(log.timestamp) + ' - ' + log.result + '</div>' +
                '</div></div>';
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
    var ticketCount = parseInt(document. getElementById('ticketCount').value) || 400;
    var btn = document.getElementById('generateBtn');
    var progressContainer = document.getElementById('progressContainer');
    var progressFill = document.getElementById('progressFill');
    var progressText = document.getElementById('progressText');
    var badge = document.getElementById('ticketBadge');
    
    if (allTickets.length > 0) {
        if (! confirm('You have ' + allTickets.length + ' tickets.  Generate ' + ticketCount + ' new tickets?  This will replace existing. ')) {
            return;
        }
    }
    
    btn.disabled = true;
    btn.innerHTML = 'Generating...';
    badge.textContent = 'Generating';
    progressContainer. style.display = 'block';
    
    allTickets = [];
    generatedTicketsData = [];
    
    try {
        for (var i = 1; i <= ticketCount; i++) {
            var ticketId = generateSecureTicketId(i);
            var encryptedCode = encryptTicketCode(ticketId);
            var verifyUrl = getVerifyUrl() + '?t=' + encodeURIComponent(encryptedCode);
            
            var ticketData = {
                ticketId: ticketId,
                ticketNumber: i,
                status: 'GENERATED',
                createdAt: new Date().toISOString(),
                eventName: CONFIG.eventName,
                eventDate: CONFIG.eventDate,
                eventVenue: CONFIG.eventVenue,
                price: CONFIG.ticketPrice,
                encryptedCode: encryptedCode,
                verifyUrl: verifyUrl,
                securityHash: simpleHash(ticketId + CONFIG. secretKey)
            };
            
            allTickets.push(ticketData);
            generatedTicketsData. push(ticketData);
            
            var percent = Math.round((i / ticketCount) * 100);
            progressFill.style.width = percent + '%';
            progressFill.textContent = percent + '%';
            progressText.textContent = 'Generating ticket ' + i + ' of ' + ticketCount + '...';
            
            if (i % 50 === 0) await sleep(1);
        }
        
        progressText.textContent = 'Saving tickets...';
        saveTickets();
        
        if (isFirebaseConnected && db) {
            try {
                await saveTicketsToFirebase();
                progressText.textContent = 'Generated ' + ticketCount + ' tickets (synced to cloud)! ';
            } catch (e) {
                console.warn('Firebase save failed:', e);
                progressText. textContent = 'Generated ' + ticketCount + ' tickets (saved locally)!';
            }
        } else {
            progressText.textContent = 'Generated ' + ticketCount + ' tickets (saved locally)!';
        }
        
        badge.textContent = 'Complete';
        document.getElementById('downloadZipBtn').disabled = false;
        document.getElementById('previewBtn').disabled = false;
        
        var pdfBtn = document.getElementById('downloadPdfBtn');
        if (pdfBtn) pdfBtn.disabled = false;
        
        showNotification('Successfully generated ' + ticketCount + ' tickets! ', 'success');
        updateDashboard();
        renderTicketTable();
        
    } catch (error) {
        console.error('Generation error:', error);
        progressText.textContent = 'Error generating tickets';
        badge.textContent = 'Error';
        showNotification('Failed to generate: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🎫 Generate Tickets';
    }
}

async function saveTicketsToFirebase() {
    if (! db) return;
    var batchSize = 400;
    for (var i = 0; i < allTickets.length; i += batchSize) {
        var batch = db.batch();
        var chunk = allTickets. slice(i, i + batchSize);
        for (var j = 0; j < chunk.length; j++) {
            var ticket = chunk[j];
            var docRef = db.collection('tickets').doc(ticket.ticketId);
            var ticketCopy = Object.assign({}, ticket);
            ticketCopy.createdAt = firebase.firestore. FieldValue.serverTimestamp();
            batch.set(docRef, ticketCopy);
        }
        await batch.commit();
    }
}

// ================================================
// TICKET ACTIONS
// ================================================
window.viewTicket = function(ticketId) {
    var ticket = null;
    for (var i = 0; i < allTickets.length; i++) {
        if (allTickets[i].ticketId === ticketId) {
            ticket = allTickets[i];
            break;
        }
    }
    if (ticket) {
        showTicketPreview(ticket);
    } else {
        showNotification('Ticket not found', 'error');
    }
};

window. markTicketAsSold = function(ticketId) {
    for (var i = 0; i < allTickets.length; i++) {
        if (allTickets[i].ticketId === ticketId) {
            allTickets[i]. status = 'SOLD';
            allTickets[i]. soldAt = new Date().toISOString();
            saveTickets();
            updateDashboard();
            renderTicketTable();
            showNotification('Ticket ' + ticketId + ' marked as sold! ', 'success');
            
            if (isFirebaseConnected && db) {
                db.collection('tickets'). doc(ticketId).update({
                    status: 'SOLD',
                    soldAt: firebase.firestore. FieldValue.serverTimestamp()
                }). catch(function(e) { console.warn('Firebase update failed:', e); });
            }
            break;
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
    var modal = document.getElementById('ticketPreviewModal');
    var frontContainer = document.getElementById('ticketFrontPreview');
    var backContainer = document. getElementById('ticketBackPreview');
    
    frontContainer.innerHTML = createTicketFrontHTML(ticket);
    backContainer.innerHTML = createTicketBackHTML(ticket);
    
    modal.classList.add('active');
    
    setTimeout(function() {
        var qrContainer = document.getElementById('qr-' + ticket.ticketId);
        if (qrContainer && typeof QRCode !== 'undefined') {
            qrContainer.innerHTML = '';
            new QRCode(qrContainer, {
                text: ticket.verifyUrl,
                width: 80,
                height: 80,
                colorDark: '#1a1a2e',
                colorLight: '#ffffff',
                correctLevel: QRCode. CorrectLevel.H
            });
        }
    }, 100);
}

function closeModal() {
    var modal = document. getElementById('ticketPreviewModal');
    modal.classList.remove('active');
}

// ================================================
// PROFESSIONAL TICKET DESIGN - FRONT (5. 5cm x 2cm)
// ================================================
function createTicketFrontHTML(ticket) {
    var w = CONFIG.ticketWidth;
    var h = CONFIG. ticketHeight;
    
    return '<div class="ticket-front" style="' +
        'width:' + w + 'px;' +
        'height:' + h + 'px;' +
        'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);' +
        'border-radius:12px;' +
        'position:relative;' +
        'overflow:hidden;' +
        'font-family:Arial,sans-serif;' +
        'color:white;' +
        'box-shadow:0 4px 15px rgba(0,0,0,0.3);' +
        '">' +
        
        // Security pattern watermark
        '<div style="position:absolute;top:0;left:0;right:0;bottom:0;' +
        'background:repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(212,175,55,0.03) 10px,rgba(212,175,55,0. 03) 20px);' +
        'pointer-events:none;"></div>' +
        
        // Diagonal watermark text
        '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-25deg);' +
        'font-size:28px;font-weight:900;color:rgba(212,175,55,0.06);white-space:nowrap;' +
        'letter-spacing:8px;pointer-events:none;">EKINTABULI</div>' +
        
        // Micro text watermark line
        '<div style="position:absolute;bottom:3px;left:0;right:0;overflow:hidden;height:8px;">' +
        '<div style="font-size:4px;color:rgba(212,175,55,0.15);white-space:nowrap;letter-spacing:1px;">' +
        'EKINTABULI-AUTHENTIC-VERIFIED-SECURE-EKINTABULI-AUTHENTIC-VERIFIED-SECURE-EKINTABULI-AUTHENTIC-VERIFIED-SECURE-EKINTABULI' +
        '</div></div>' +
        
        // Gold border
        '<div style="position:absolute;top:4px;left:4px;right:4px;bottom:4px;' +
        'border:1. 5px solid rgba(212,175,55,0.5);border-radius:10px;pointer-events:none;"></div>' +
        
        // Left section - Event info
        '<div style="position:absolute;left:12px;top:12px;bottom:12px;width:55%;">' +
            // Header
            '<div style="margin-bottom:8px;">' +
                '<div style="font-size:6px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;">Christmas Event 2025</div>' +
                '<div style="font-size:18px;font-weight:bold;color:#D4AF37;text-shadow:1px 1px 2px rgba(0,0,0,0.5);">EKINTABULI</div>' +
            '</div>' +
            
            // Event details
            '<div style="display:flex;gap:15px;margin-bottom:6px;">' +
                '<div>' +
                    '<div style="font-size:5px;color:#888;">DATE</div>' +
                    '<div style="font-size:8px;font-weight:600;">25 DEC 2025</div>' +
                '</div>' +
                '<div>' +
                    '<div style="font-size:5px;color:#888;">TIME</div>' +
                    '<div style="font-size:8px;font-weight:600;">6PM - LATE</div>' +
                '</div>' +
            '</div>' +
            
            '<div style="margin-bottom:6px;">' +
                '<div style="font-size:5px;color:#888;">VENUE</div>' +
                '<div style="font-size:8px;font-weight:600;">Club Missouka</div>' +
            '</div>' +
            
            // Ticket ID and Price
            '<div style="display:flex;justify-content:space-between;padding:6px 8px;' +
            'background:rgba(212,175,55,0. 15);border-radius:6px;border:1px solid rgba(212,175,55,0.3);">' +
                '<div>' +
                    '<div style="font-size:5px;color:#888;">TICKET ID</div>' +
                    '<div style="font-size:7px;font-weight:700;color:#D4AF37;">' + ticket.ticketId + '</div>' +
                '</div>' +
                '<div style="text-align:right;">' +
                    '<div style="font-size:5px;color:#888;">PRICE</div>' +
                    '<div style="font-size:7px;font-weight:700;color:#28a745;">10,000 UGX</div>' +
                '</div>' +
            '</div>' +
            
            // Security text
            '<div style="position:absolute;bottom:0;font-size:4px;color:#666;">' +
                '🔒 Digitally secured • Valid for ONE person' +
            '</div>' +
        '</div>' +
        
        // Right section - QR Code
        '<div style="position:absolute;right:12px;top:50%;transform:translateY(-50%);text-align:center;">' +
            '<div style="padding:6px;background:white;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">' +
                '<div id="qr-' + ticket.ticketId + '" style="width:80px;height:80px;"></div>' +
            '</div>' +
            '<div style="margin-top:4px;font-size:5px;color:#888;">SCAN TO VERIFY</div>' +
        '</div>' +
        
        // Corner decorations
        '<div style="position:absolute;top:8px;left:8px;font-size:10px;">👑</div>' +
        '<div style="position:absolute;top:8px;right:8px;font-size:10px;">🎄</div>' +
        
    '</div>';
}

// ================================================
// PROFESSIONAL TICKET DESIGN - BACK
// ================================================
function createTicketBackHTML(ticket) {
    var w = CONFIG.ticketWidth;
    var h = CONFIG.ticketHeight;
    
    return '<div class="ticket-back" style="' +
        'width:' + w + 'px;' +
        'height:' + h + 'px;' +
        'background:linear-gradient(135deg,#0f3460 0%,#16213e 50%,#1a1a2e 100%);' +
        'border-radius:12px;' +
        'position:relative;' +
        'overflow:hidden;' +
        'font-family:Arial,sans-serif;' +
        'color:white;' +
        'box-shadow:0 4px 15px rgba(0,0,0,0.3);' +
        'padding:12px;' +
        '">' +
        
        // Security grid pattern
        '<div style="position:absolute;top:0;left:0;right:0;bottom:0;' +
        'background:repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(212,175,55,0.02) 8px,rgba(212,175,55,0. 02) 9px),' +
        'repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(212,175,55,0.02) 8px,rgba(212,175,55,0.02) 9px);' +
        'pointer-events:none;"></div>' +
        
        // Border
        '<div style="position:absolute;top:4px;left:4px;right:4px;bottom:4px;' +
        'border:1. 5px solid rgba(212,175,55,0.5);border-radius:10px;pointer-events:none;"></div>' +
        
        // Header
        '<div style="text-align:center;margin-bottom:8px;position:relative;z-index:1;">' +
            '<div style="font-size:8px;color:#D4AF37;font-weight:bold;">TERMS & CONDITIONS</div>' +
        '</div>' +
        
        // Terms in columns
        '<div style="display:flex;gap:10px;font-size:5px;line-height:1. 4;color:#ccc;position:relative;z-index:1;">' +
            '<div style="flex:1;">' +
                '<div style="margin-bottom:4px;"><strong style="color:#D4AF37;">1.</strong> Single use only - one scan per entry</div>' +
                '<div style="margin-bottom:4px;"><strong style="color:#D4AF37;">2. </strong> Non-transferable after scanning</div>' +
                '<div><strong style="color:#D4AF37;">3.</strong> Present valid ID if requested</div>' +
            '</div>' +
            '<div style="flex:1;">' +
                '<div style="margin-bottom:4px;"><strong style="color:#D4AF37;">4.</strong> No refunds - event rain or shine</div>' +
                '<div style="margin-bottom:4px;"><strong style="color:#dc3545;">⚠️</strong> Counterfeit tickets prosecuted</div>' +
                '<div><strong style="color:#28a745;">✓</strong> Verified authentic ticket</div>' +
            '</div>' +
        '</div>' +
        
        // Security badge
        '<div style="position:absolute;bottom:25px;left:50%;transform:translateX(-50%);">' +
            '<div style="padding:3px 12px;background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.4);border-radius:10px;">' +
                '<span style="font-size:6px;color:#D4AF37;">🔐 VERIFIED AUTHENTIC</span>' +
            '</div>' +
        '</div>' +
        
        // Footer
        '<div style="position:absolute;bottom:8px;left:12px;right:12px;text-align:center;font-size:5px;color:#666;">' +
            '<strong style="color:#D4AF37;">EKINTABULI Kya Christmas 2025</strong> • ' +
            'Ticket #' + (ticket.ticketNumber || '000') + ' • ' +
            'Hash: ' + (ticket.securityHash || 'N/A') +
        '</div>' +
        
    '</div>';
}

// ================================================
// DOWNLOAD AS ZIP (PNG)
// ================================================
async function downloadAsZip() {
    if (allTickets.length === 0) {
        showNotification('No tickets to download! ', 'error');
        return;
    }
    
    var btn = document.getElementById('downloadZipBtn');
    btn.disabled = true;
    btn.innerHTML = 'Preparing... ';
    
    var ticketCount = Math.min(allTickets. length, 50);
    showNotification('Generating ' + ticketCount + ' tickets...  This may take a moment.', 'warning');
    
    try {
        var zip = new JSZip();
        var ticketsFolder = zip.folder("EKINTABULI_Tickets");
        var canvas = document.getElementById('ticketCanvas');
        
        for (var i = 0; i < ticketCount; i++) {
            var ticket = allTickets[i];
            
            // Front
            canvas.innerHTML = createTicketFrontHTML(ticket);
            var qrContainer = document. getElementById('qr-' + ticket.ticketId);
            if (qrContainer && typeof QRCode !== 'undefined') {
                new QRCode(qrContainer, {
                    text: ticket.verifyUrl,
                    width: 80,
                    height: 80,
                    colorDark: '#1a1a2e',
                    colorLight: '#ffffff'
                });
            }
            await sleep(50);
            
            var frontCanvas = await html2canvas(canvas. firstChild, { scale: CONFIG.printScale, useCORS: true, backgroundColor: null });
            var frontData = frontCanvas.toDataURL('image/png'). split(',')[1];
            ticketsFolder.file(ticket.ticketId + '_FRONT.png', frontData, { base64: true });
            
            // Back
            canvas.innerHTML = createTicketBackHTML(ticket);
            await sleep(30);
            
            var backCanvas = await html2canvas(canvas.firstChild, { scale: CONFIG.printScale, useCORS: true, backgroundColor: null });
            var backData = backCanvas.toDataURL('image/png'). split(',')[1];
            ticketsFolder.file(ticket. ticketId + '_BACK.png', backData, { base64: true });
            
            btn.innerHTML = (i + 1) + '/' + ticketCount;
        }
        
        var content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'EKINTABULI_Tickets.zip');
        showNotification('Downloaded ' + ticketCount + ' tickets as ZIP!', 'success');
        
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Download failed: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '📥 Download ZIP';
    }
}

// ================================================
// DOWNLOAD AS PDF (Both Sides)
// ================================================
async function downloadAsPdf() {
    if (allTickets. length === 0) {
        showNotification('No tickets to download!', 'error');
        return;
    }
    
    if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
        showNotification('PDF library not loaded.  Use ZIP download instead.', 'error');
        return;
    }
    
    var btn = document.getElementById('downloadPdfBtn');
    btn. disabled = true;
    btn.innerHTML = 'Creating PDF...';
    
    try {
        var PDF = window.jspdf ?  window.jspdf. jsPDF : window.jsPDF;
        var doc = new PDF({ orientation: 'landscape', unit: 'cm', format: [5.5, 2] });
        var canvas = document.getElementById('ticketCanvas');
        var ticketCount = Math.min(allTickets.length, 20);
        
        for (var i = 0; i < ticketCount; i++) {
            var ticket = allTickets[i];
            
            if (i > 0) doc. addPage([5.5, 2], 'landscape');
            
            // Front
            canvas. innerHTML = createTicketFrontHTML(ticket);
            var qrContainer = document. getElementById('qr-' + ticket.ticketId);
            if (qrContainer && typeof QRCode !== 'undefined') {
                new QRCode(qrContainer, { text: ticket.verifyUrl, width: 80, height: 80, colorDark: '#1a1a2e', colorLight: '#ffffff' });
            }
            await sleep(50);
            var frontCanvas = await html2canvas(canvas. firstChild, { scale: 3, useCORS: true });
            var frontImg = frontCanvas.toDataURL('image/png');
            doc.addImage(frontImg, 'PNG', 0, 0, 5.5, 2);
            
            // Back on next page
            doc.addPage([5.5, 2], 'landscape');
            canvas.innerHTML = createTicketBackHTML(ticket);
            await sleep(30);
            var backCanvas = await html2canvas(canvas. firstChild, { scale: 3, useCORS: true });
            var backImg = backCanvas. toDataURL('image/png');
            doc.addImage(backImg, 'PNG', 0, 0, 5.5, 2);
            
            btn.innerHTML = (i + 1) + '/' + ticketCount;
        }
        
        doc.save('EKINTABULI_Tickets.pdf');
        showNotification('Downloaded ' + ticketCount + ' tickets as PDF!', 'success');
        
    } catch (error) {
        console. error('PDF error:', error);
        showNotification('PDF failed: ' + error. message, 'error');
    } finally {
        btn. disabled = false;
        btn.innerHTML = '📄 Download PDF';
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
    
    var csv = 'Ticket ID,Status,Created At,Sold At,Used At,Price,Security Hash\n';
    for (var i = 0; i < allTickets.length; i++) {
        var t = allTickets[i];
        csv += '"' + t.ticketId + '","' + t.status + '","' + (t.createdAt || '') + '","' + (t.soldAt || '') + '","' + (t. usedAt || '') + '","' + t.price + '","' + (t.securityHash || '') + '"\n';
    }
    
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a. href = url;
    a.download = 'EKINTABULI_Report_' + new Date(). toISOString(). split('T')[0] + '.csv';
    a.click();
    URL. revokeObjectURL(url);
    showNotification('CSV report downloaded! ', 'success');
}

console.log('Admin. js loaded successfully');
/* ================================================
   EKINTABULI Admin - FINAL GOLD/RED SECURE EDITION
   Fixed Filters, Red Text, Watermarks, Dual-Zip
   ================================================ */

// ================================================
// 1. CONFIGURATION
// ================================================
const CONFIG = {
    eventName: 'EKINTABULI',
    eventSub: 'Christmas 2025',
    secretKey: 'EKINTABULI-2025-XMAS-SECRET', 
    ticketPrice: 10000, 
    ticketWidth: 600, 
    ticketHeight: 220,
    printScale: 3 
};

// ================================================
// 2. STATE
// ================================================
let allTickets = [];
let filteredTickets = [];
let currentPage = 1;
let isFirebaseConnected = false;

// ================================================
// 3. UTILITY & HELPERS
// ================================================
const sleep = ms => new Promise(r => setTimeout(r, ms));
const formatCurrency = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const getVerifyUrl = () => 'https://ad252490.github.io/x-mas-ticket/verify/index.html';
const getTicketLink = t => `${getVerifyUrl()}?t=${encodeURIComponent(t.encryptedCode)}`;

function showNotification(msg, type='success') {
    const c = document.getElementById('notificationContainer');
    if(!c) return;
    const n = document.createElement('div');
    n.className = `notification`;
    n.style.borderLeftColor = type==='error'?'#dc3545':'#d4af37';
    n.innerHTML = `<span>${type==='success'?'✅':type==='error'?'❌':'⚠️'}</span><span>${msg}</span>`;
    c.appendChild(n);
    setTimeout(() => { n.style.opacity='0'; setTimeout(()=>n.remove(),300); }, 4000);
}

function updateDashboard() {
    const s = { gen:0, sold:0, used:0, rev:0 };
    allTickets.forEach(t => {
        s.gen++;
        if(t.status === 'SOLD' || t.status === 'USED') {
            s.sold++;
            s.rev += parseInt(t.price || 0);
        }
        if(t.status === 'USED') s.used++;
    });

    document.getElementById('statGenerated').textContent = s.gen;
    document.getElementById('statSold').textContent = s.sold;
    document.getElementById('statUsed').textContent = s.used;
    document.getElementById('statRevenue').textContent = formatCurrency(s.rev);
    
    const hasData = s.gen > 0;
    ['downloadPdfBtn', 'downloadZipBtn', 'exportBtn', 'previewBtn'].forEach(id => {
        const b = document.getElementById(id);
        if(b) b.disabled = !hasData;
    });
}

// ================================================
// 4. SECURITY
// ================================================
function generateSecureTicketId(n) {
    const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `EKT-25-${String(n).padStart(4,'0')}-${rnd}`;
}

function encryptTicketCode(id) {
    const ts = Date.now().toString(36);
    const salt = Math.random().toString(36).substring(2, 8);
    const raw = `${id}|${CONFIG.secretKey}|${ts}|${salt}`;
    const enc = btoa(raw);
    let hash = 0;
    for(let i=0; i<enc.length; i++) hash = ((hash<<5)-hash)+enc.charCodeAt(i) | 0;
    return enc + Math.abs(hash).toString(36).substring(0,4).toUpperCase();
}

// ================================================
// 5. INITIALIZATION
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("System Started");
    if(typeof firebase !== 'undefined' && typeof db !== 'undefined' && db) {
        db.collection('tickets').limit(1).get().then(() => {
            isFirebaseConnected = true;
            document.querySelector('.status-dot').style.background = '#00ff88';
            document.querySelector('.status-text').textContent = 'Online';
            startRealTimeSync();
        }).catch(() => console.warn('Offline'));
    }

    // Event Listeners
    document.getElementById('generateBtn').addEventListener('click', generateTickets);
    document.getElementById('clearDbBtn').addEventListener('click', clearDatabase);
    document.getElementById('downloadPdfBtn').addEventListener('click', downloadDoubleSidedPdf);
    document.getElementById('downloadZipBtn').addEventListener('click', downloadZip);
    document.getElementById('exportBtn').addEventListener('click', exportCSV);
    document.getElementById('previewBtn').addEventListener('click', () => showPreview(allTickets[0]?.ticketId));
    document.getElementById('closeModalBtn').addEventListener('click', () => document.getElementById('ticketPreviewModal').classList.remove('active'));
    
    // Filter Listeners
    document.getElementById('searchTicket').addEventListener('keyup', () => { currentPage=1; renderTable(); });
    document.getElementById('filterStatus').addEventListener('change', () => { currentPage=1; renderTable(); });
    document.getElementById('refreshBtn').addEventListener('click', () => { renderTable(); });

    const local = localStorage.getItem('ekt_data');
    if(local) { allTickets = JSON.parse(local); updateDashboard(); renderTable(); }
});

function startRealTimeSync() {
    db.collection('tickets').orderBy('createdAt', 'desc').onSnapshot(snap => {
        allTickets = [];
        snap.forEach(doc => { let d = doc.data(); d.ticketId = doc.id; allTickets.push(d); });
        localStorage.setItem('ekt_data', JSON.stringify(allTickets));
        updateDashboard();
        renderTable();
    });
}

// ================================================
// 6. GENERATION LOGIC
// ================================================
async function generateTickets() {
    if(!isFirebaseConnected) return alert("Connect to internet.");
    const count = parseInt(document.getElementById('ticketCount').value) || 400;
    if(allTickets.length > 0 && !confirm("Overwrite database?")) return;

    const btn = document.getElementById('generateBtn');
    const bar = document.getElementById('progressFill');
    const txt = document.getElementById('progressText');
    btn.disabled = true; 
    document.getElementById('progressContainer').style.display='block';

    try {
        let temp = [];
        for(let i=1; i<=count; i++) {
            const tid = generateSecureTicketId(i);
            const code = encryptTicketCode(tid);
            temp.push({
                ticketId: tid,
                status: 'GENERATED',
                price: CONFIG.ticketPrice,
                encryptedCode: code,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            if(i%50===0) { bar.style.width=`${(i/count)*50}%`; txt.textContent=`Minting ${i}...`; await sleep(1); }
        }

        const batches = [];
        while(temp.length) batches.push(temp.splice(0, 400));

        for(let i=0; i<batches.length; i++) {
            const batch = db.batch();
            batches[i].forEach(t => batch.set(db.collection('tickets').doc(t.ticketId), t));
            txt.textContent = `Saving Batch ${i+1}/${batches.length}...`;
            await batch.commit();
            bar.style.width = `${50 + ((i+1)/batches.length*50)}%`;
        }
        txt.textContent = 'Done!';
        showNotification(`Created ${count} tickets.`);
    } catch(e) { console.error(e); alert(e.message); } 
    finally { btn.disabled = false; setTimeout(() => document.getElementById('progressContainer').style.display='none', 2000); }
}

async function clearDatabase() {
    if(!confirm("Delete all tickets?")) return;
    localStorage.removeItem('ekt_data');
    allTickets = [];
    const q = await db.collection('tickets').get();
    const batch = db.batch();
    q.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    updateDashboard(); renderTable();
}

// ================================================
// 7. PREMIUM DESIGN (Red + Watermarks)
// ================================================

// 1. Repeating Text Watermark (SVG)
// This creates a tiled background of "OFFICIAL ORIGINAL" rotated 45 degrees
const watermarkSVG = `data:image/svg+xml;utf8,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg transform='translate(50,50) rotate(-45)'%3E%3Ctext text-anchor='middle' font-family='Arial' font-size='10' fill='rgba(255,255,255,0.08)' font-weight='bold'%3EOFFICIAL ORIGINAL%3C/text%3E%3C/g%3E%3C/svg%3E`;

// 2. Guilloche Waves (Security Lines)
const guilloche = `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 Q 10 0 20 20 T 40 20' fill='none' stroke='rgba(255,215,0,0.1)' stroke-width='0.5'/%3E%3C/svg%3E`;

function createTicketFront(t) {
    return `
    <div style="width:${CONFIG.ticketWidth}px; height:${CONFIG.ticketHeight}px; 
        background: #0a0a0a; 
        border-radius: 16px; display: flex; overflow: hidden; position: relative; 
        font-family: 'Segoe UI', sans-serif; border: 1px solid #333;">
        
        <!-- LAYER 1: Guilloche Waves -->
        <div style="position:absolute; inset:0; background-image: url('${guilloche}'); opacity:1;"></div>
        
        <!-- LAYER 2: Repeating Text Watermark (Anti-Copy) -->
        <div style="position:absolute; inset:0; background-image: url('${watermarkSVG}');"></div>
        
        <!-- LEFT SIDE (Event Info) -->
        <div style="width: 72%; padding: 15px 20px; position: relative; border-right: 2px dashed rgba(212,175,55,0.5);
            display: flex; flex-direction: column; justify-content: space-between; z-index: 5;">
            
            <!-- Top Bar -->
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="font-size:9px; color:#d4af37; letter-spacing:2px; font-weight:bold; border:1px solid #d4af37; padding:2px 6px; border-radius:4px;">OFFICIAL PASS</div>
                <div style="font-size:10px; color:#888; font-family:monospace;">ID: ${t.ticketId}</div>
            </div>

            <!-- MAIN TITLE (RED) -->
            <div style="margin-top:5px;">
                <div style="font-size:46px; font-weight:900; line-height:0.85; letter-spacing:-1px;
                    background: linear-gradient(to bottom, #ff4d4d 0%, #cc0000 100%); 
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                    filter: drop-shadow(0px 2px 0px rgba(0,0,0,0.5));">
                    EKINTABULI
                </div>
                <div style="font-family: cursive; font-size:22px; color:#fff; margin-left:5px; opacity:0.9;">
                    Kya Christmas 2025
                </div>
            </div>

            <!-- Details Grid -->
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; margin-top:10px;">
                <div style="background:rgba(255,255,255,0.05); padding:5px; border-radius:6px;">
                    <div style="font-size:8px; color:#aaa;">DATE</div>
                    <div style="font-size:12px; color:#fff; font-weight:bold;">25 DEC</div>
                </div>
                <div style="background:rgba(255,255,255,0.05); padding:5px; border-radius:6px;">
                    <div style="font-size:8px; color:#aaa;">TIME</div>
                    <div style="font-size:12px; color:#fff; font-weight:bold;">6:00 PM</div>
                </div>
                <div style="background:rgba(255,255,255,0.05); padding:5px; border-radius:6px; border:1px solid #d4af37;">
                    <div style="font-size:8px; color:#d4af37;">PRICE</div>
                    <div style="font-size:12px; color:#d4af37; font-weight:bold;">10K UGX</div>
                </div>
            </div>
        </div>

        <!-- RIGHT SIDE (Stub & QR) -->
        <div style="width: 28%; background: #151515; position: relative; display:flex; flex-direction:column; 
            align-items:center; justify-content:center; z-index: 5;">
            
            <!-- Repeating Watermark continues here too -->
            <div style="position:absolute; inset:0; background-image: url('${watermarkSVG}'); opacity:0.5; pointer-events:none;"></div>

            <div style="font-size:12px; font-weight:900; color:#fff; letter-spacing:1px; margin-bottom:8px; z-index:2;">SCAN ME</div>
            
            <!-- QR Code Box (High Contrast) -->
            <div style="background:white; padding:4px; border-radius:6px; z-index:2;">
                <div id="qr-${t.ticketId}"></div>
            </div>
            
            <div style="font-family:monospace; font-size:10px; color:#666; font-weight:bold; margin-top:6px; z-index:2;">${t.ticketId}</div>

            <!-- Cutout Notches (Visual) -->
            <div style="position:absolute; top:-10px; left:-10px; width:20px; height:20px; background:#0f1015; border-radius:50%; z-index:10;"></div>
            <div style="position:absolute; bottom:-10px; left:-10px; width:20px; height:20px; background:#0f1015; border-radius:50%; z-index:10;"></div>
        </div>
    </div>`;
}

function createTicketBack(t) {
    return `
    <div style="width:${CONFIG.ticketWidth}px; height:${CONFIG.ticketHeight}px; 
        background: #0a0a0a; border-radius: 16px; overflow: hidden; position: relative;
        display: flex; align-items: center; justify-content: center; text-align: center;
        font-family: 'Segoe UI', sans-serif; color: #ccc; border: 1px solid #333;">
        
        <!-- FULL WATERMARK BACKGROUND -->
        <div style="position:absolute; inset:0; background-image: url('${watermarkSVG}'); opacity:0.15;"></div>

        <div style="z-index:2; width:85%;">
            <div style="color:#d4af37; font-weight:bold; font-size:12px; margin-bottom:10px; letter-spacing:2px; border-bottom:1px solid #333; padding-bottom:5px; display:inline-block;">TERMS & CONDITIONS</div>
            <div style="font-size:9px; line-height:1.8; text-align:left; color:#aaa;">
                1. Valid for one person only on 25th Dec 2025.<br>
                2. The QR code is unique security token. Scanning invalidates it.<br>
                3. Duplication is a criminal offense.<br>
                4. No refunds or exchanges allowed.<br>
            </div>
            <div style="margin-top:15px; font-size:9px; font-family:monospace; color:#444;">
                SECURE HASH: ${t.encryptedCode.substring(t.encryptedCode.length-12)}
            </div>
        </div>
    </div>`;
}

// 8. DOWNLOADS (Dual ZIP Fixed)
async function downloadZip() {
    if(!allTickets.length) return;
    const btn = document.getElementById('downloadZipBtn');
    btn.disabled = true; btn.innerHTML = 'Creating Zip...';
    const canvas = document.getElementById('ticketCanvas');

    try {
        const zip = new JSZip();
        const folder = zip.folder("Tickets_Front_Back");
        // Limit to 50 for safety, increase if needed
        const count = Math.min(allTickets.length, 100); 

        for(let i=0; i<count; i++) {
            const t = allTickets[i];
            
            // 1. FRONT
            canvas.innerHTML = createTicketFront(t); 
            new QRCode(document.getElementById('qr-'+t.ticketId), {
                text: getTicketLink(t), width: 75, height: 75,
                colorDark: "#000000", colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.Q
            });
            await sleep(20);
            let cvs = await html2canvas(canvas.firstElementChild, {scale: 2});
            folder.file(`${t.ticketId}_FRONT.png`, cvs.toDataURL('image/png').split(',')[1], {base64: true});

            // 2. BACK
            canvas.innerHTML = createTicketBack(t);
            await sleep(10);
            cvs = await html2canvas(canvas.firstElementChild, {scale: 2});
            folder.file(`${t.ticketId}_BACK.png`, cvs.toDataURL('image/png').split(',')[1], {base64: true});
            
            if(i%10===0) btn.innerHTML = `Zipping ${i}/${count}...`;
        }
        
        const content = await zip.generateAsync({type:"blob"});
        saveAs(content, "EKINTABULI_All_Tickets.zip");
        showNotification("Zip Downloaded!");
    } catch(e) { console.error(e); alert("Zip Error"); } 
    finally { btn.disabled=false; btn.innerHTML='📦 ZIP'; canvas.innerHTML=''; }
}

async function downloadDoubleSidedPdf() {
    if(!allTickets.length) return;
    const btn = document.getElementById('downloadPdfBtn');
    btn.disabled=true;
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const canvas = document.getElementById('ticketCanvas');
        const tW=60, tH=24, cols=3, rows=11, perPage=33;
        
        const chunks = [];
        for(let i=0; i<allTickets.length; i+=perPage) chunks.push(allTickets.slice(i, i+perPage));

        for(let p=0; p<chunks.length; p++) {
            const data = chunks[p];
            // Front
            if(p>0) doc.addPage();
            btn.innerHTML = `Page ${p+1} Front...`;
            let x=10, y=10, c=0;
            for(let t of data) {
                canvas.innerHTML = createTicketFront(t);
                new QRCode(document.getElementById('qr-'+t.ticketId), { text: getTicketLink(t), width:75, height:75, correctLevel: QRCode.CorrectLevel.Q });
                await sleep(10);
                const img = await html2canvas(canvas.firstElementChild, {scale:3});
                doc.addImage(img.toDataURL('image/png'), 'PNG', x, y, tW, tH);
                x+=tW+2; c++; if(c%cols===0){x=10; y+=tH+2;}
            }
            // Back
            doc.addPage();
            btn.innerHTML = `Page ${p+1} Back...`;
            x=10; y=10; c=0;
            for(let t of data) {
                canvas.innerHTML = createTicketBack(t);
                await sleep(10);
                const img = await html2canvas(canvas.firstElementChild, {scale:3});
                doc.addImage(img.toDataURL('image/png'), 'PNG', x, y, tW, tH);
                x+=tW+2; c++; if(c%cols===0){x=10; y+=tH+2;}
            }
        }
        doc.save('Tickets.pdf');
        showNotification("PDF Ready");
    } catch(e){console.error(e);} finally{btn.disabled=false; btn.innerHTML='📄 PDF (A4)'; canvas.innerHTML='';}
}

function exportCSV() {
    const rows = [["Ticket ID", "Status", "Price", "Created At"]];
    allTickets.forEach(t => rows.push([t.ticketId, t.status, t.price, t.createdAt?.seconds ? new Date(t.createdAt.seconds*1000).toISOString() : '']));
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "ticket_report.csv";
    link.click();
}

// 9. TABLE & PREVIEW (Filter Fixed)
function renderTable() {
    const tbody = document.getElementById('ticketTableBody');
    const searchVal = document.getElementById('searchTicket').value.toUpperCase();
    const filterVal = document.getElementById('filterStatus').value;

    // Filtering Logic (Calculated here to update UI instantly)
    filteredTickets = allTickets.filter(t => {
        const matchesSearch = t.ticketId.includes(searchVal);
        const matchesStatus = filterVal === "ALL" || t.status === filterVal;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredTickets.length / 20);
    const start = (currentPage-1)*20;
    const pageData = filteredTickets.slice(start, start+20);
    
    if(!pageData.length) { 
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">No tickets match your search.</td></tr>'; 
        document.getElementById('pagination').innerHTML = '';
        return; 
    }

    tbody.innerHTML = pageData.map(t => `
        <tr>
            <td><code>${t.ticketId}</code></td>
            <td><span class="badge" 
                style="padding:4px 8px; border-radius:12px; font-size:10px; 
                background:${t.status==='SOLD'?'#198754':t.status==='USED'?'#666':'#d4af3733'}; 
                color:${t.status==='SOLD'?'#fff':t.status==='USED'?'#ccc':'#d4af37'};">
                ${t.status}</span></td>
            <td>${formatCurrency(t.price)}</td>
            <td><button class="btn-secondary" onclick="showPreview('${t.ticketId}')">View</button></td>
        </tr>
    `).join('');
    
    let pagHTML = '';
    if(currentPage > 1) pagHTML += `<button onclick="changePage(-1)">Prev</button>`;
    pagHTML += `<span>Page ${currentPage} of ${totalPages || 1}</span>`;
    if(currentPage < totalPages) pagHTML += `<button onclick="changePage(1)">Next</button>`;
    document.getElementById('pagination').innerHTML = pagHTML;
}

function changePage(dir) { currentPage += dir; renderTable(); }

function showPreview(tid) {
    if(typeof tid !== 'string') return;
    const t = allTickets.find(x => x.ticketId === tid);
    const modal = document.getElementById('ticketPreviewModal');
    document.getElementById('ticketFrontPreview').innerHTML = createTicketFront(t);
    document.getElementById('ticketBackPreview').innerHTML = createTicketBack(t);
    modal.classList.add('active');
    setTimeout(() => {
        new QRCode(document.getElementById('qr-'+t.ticketId), {
            text: getTicketLink(t), width: 75, height: 75,
            colorDark: "#000000", colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.Q
        });
    }, 100);
}
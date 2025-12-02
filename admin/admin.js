/* ================================================
   EKINTABULI Admin Dashboard Styles
   ================================================ */

:root {
    --primary-gold: #D4AF37;
    --primary-dark: #8B4513;
    --success-green: #28a745;
    --danger-red: #dc3545;
    --warning-orange: #fd7e14;
    --info-blue: #17a2b8;
    --dark-bg: #1a1a2e;
    --darker-bg: #16213e;
    --card-bg: rgba(26, 26, 46, 0.95);
    --text-light: #ffffff;
    --text-muted: #adb5bd;
    --border-color: rgba(212, 175, 55, 0. 3);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Montserrat', sans-serif;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    min-height: 100vh;
    color: var(--text-light);
}

/* Header Styles */
.header {
    background: linear-gradient(135deg, var(--dark-bg) 0%, var(--darker-bg) 100%);
    padding: 20px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 3px solid var(--primary-gold);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    flex-wrap: wrap;
    gap: 15px;
}

.header h1 {
    font-family: 'Playfair Display', serif;
    font-size: 1.8rem;
    color: var(--primary-gold);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.header .subtitle {
    font-size: 0.9rem;
    color: var(--text-muted);
    display: block;
    margin-top: 5px;
}

. header-right {
    display: flex;
    align-items: center;
    gap: 15px;
    flex-wrap: wrap;
}

.event-info {
    color: var(--text-muted);
    font-size: 0.9rem;
}

/* Container */
.container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 30px 20px;
}

/* Connection Status */
.connection-status {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 20px;
    background: var(--card-bg);
    border-radius: 10px;
    margin-bottom: 25px;
    border: 1px solid var(--border-color);
}

.connection-status. connected . status-dot {
    background: var(--success-green);
    box-shadow: 0 0 10px var(--success-green);
}

. connection-status.disconnected .status-dot {
    background: var(--danger-red);
    box-shadow: 0 0 10px var(--danger-red);
}

. status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--warning-orange);
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0. 5; }
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.stat-box {
    background: var(--card-bg);
    border-radius: 15px;
    padding: 25px;
    display: flex;
    align-items: center;
    gap: 20px;
    border: 2px solid var(--border-color);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.stat-box::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--primary-gold), var(--primary-dark));
}

.stat-box:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(212, 175, 55, 0. 2);
}

. stat-box. success::before {
    background: linear-gradient(90deg, var(--success-green), #20c997);
}

.stat-box.warning::before {
    background: linear-gradient(90deg, var(--warning-orange), #ffc107);
}

.stat-box.danger::before {
    background: linear-gradient(90deg, var(--danger-red), #e83e8c);
}

. stat-icon {
    font-size: 2. 5rem;
}

. stat-content . number {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-gold);
    font-family: 'Playfair Display', serif;
}

. stat-content .label {
    color: var(--text-muted);
    font-size: 0.9rem;
    margin-top: 5px;
}

/* Cards */
.card {
    background: var(--card-bg);
    border-radius: 15px;
    margin-bottom: 25px;
    border: 2px solid var(--border-color);
    overflow: hidden;
}

.card-header {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0. 1) 0%, rgba(139, 69, 19, 0. 1) 100%);
    padding: 20px 25px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--primary-gold);
}

.card-body {
    padding: 25px;
}

.card-description {
    color: var(--text-muted);
    margin-bottom: 20px;
    line-height: 1.6;
}

/* Badges */
.badge, .live-badge {
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.badge {
    background: var(--primary-gold);
    color: var(--dark-bg);
}

.live-badge {
    background: rgba(220, 53, 69, 0. 2);
    color: var(--danger-red);
    animation: livePulse 2s infinite;
}

@keyframes livePulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

/* Generation Options */
.generation-options {
    display: flex;
    gap: 20px;
    margin-bottom: 25px;
    flex-wrap: wrap;
}

.option-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.option-group label {
    font-size: 0.9rem;
    color: var(--text-muted);
}

.option-group input {
    padding: 12px 15px;
    border-radius: 10px;
    border: 2px solid var(--border-color);
    background: rgba(0, 0, 0, 0. 3);
    color: var(--text-light);
    font-size: 1rem;
    width: 180px;
    transition: border-color 0. 3s;
}

.option-group input:focus {
    outline: none;
    border-color: var(--primary-gold);
}

/* Progress Bar */
.progress-container {
    margin-bottom: 25px;
}

.progress-bar {
    height: 25px;
    background: rgba(0, 0, 0, 0. 3);
    border-radius: 15px;
    overflow: hidden;
    border: 1px solid var(--border-color);
}

.progress-fill {
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, var(--primary-gold), var(--primary-dark));
    border-radius: 15px;
    transition: width 0. 3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--dark-bg);
    font-weight: 600;
    font-size: 0.85rem;
}

.progress-text {
    text-align: center;
    margin-top: 10px;
    color: var(--text-muted);
}

/* Buttons */
.btn {
    padding: 12px 25px;
    border-radius: 10px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.95rem;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.btn-primary {
    background: linear-gradient(135deg, var(--primary-gold), var(--primary-dark));
    color: white;
}

. btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(212, 175, 55, 0.4);
}

. btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-light);
    border: 2px solid var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
}

.btn-danger {
    background: var(--danger-red);
    color: white;
}

.btn-small {
    padding: 8px 15px;
    font-size: 0.85rem;
}

.btn-large {
    padding: 15px 35px;
    font-size: 1.1rem;
}

. btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

. button-group {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
}

/* Revenue Grid */
.revenue-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
}

.revenue-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 20px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    border: 1px solid var(--border-color);
}

.revenue-item. highlight {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(139, 69, 19, 0.15) 100%);
    border-color: var(--primary-gold);
}

.revenue-icon {
    font-size: 2rem;
}

.revenue-content {
    flex: 1;
}

.revenue-label {
    display: block;
    font-size: 0. 85rem;
    color: var(--text-muted);
    margin-bottom: 5px;
}

. revenue-value {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-light);
}

. revenue-value.large {
    font-size: 1.4rem;
    color: var(--primary-gold);
}

/* Filter Bar */
.filter-bar {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

. search-input, .filter-select {
    padding: 12px 15px;
    border-radius: 10px;
    border: 2px solid var(--border-color);
    background: rgba(0, 0, 0, 0.3);
    color: var(--text-light);
    font-size: 0.95rem;
    transition: border-color 0.3s;
}

.search-input {
    flex: 1;
    min-width: 250px;
}

.search-input:focus, .filter-select:focus {
    outline: none;
    border-color: var(--primary-gold);
}

. filter-select {
    min-width: 180px;
}

.filter-select option {
    background: var(--dark-bg);
    color: var(--text-light);
}

/* Table Styles */
.table-container {
    overflow-x: auto;
    border-radius: 10px;
    border: 1px solid var(--border-color);
}

table {
    width: 100%;
    border-collapse: collapse;
}

thead {
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(139, 69, 19, 0. 1) 100%);
}

th {
    padding: 15px;
    text-align: left;
    font-weight: 600;
    color: var(--primary-gold);
    border-bottom: 2px solid var(--border-color);
}

td {
    padding: 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0. 05);
    color: var(--text-light);
}

tr:hover {
    background: rgba(212, 175, 55, 0. 05);
}

. empty-state {
    text-align: center;
    padding: 50px 20px;
    color: var(--text-muted);
}

. empty-icon {
    font-size: 4rem;
    margin-bottom: 15px;
}

. empty-hint {
    font-size: 0.85rem;
    opacity: 0.7;
    margin-top: 10px;
}

/* Status Badges */
.status-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.status-generated { background: rgba(108, 117, 125, 0.2); color: #6c757d; }
.status-downloaded { background: rgba(23, 162, 184, 0.2); color: #17a2b8; }
.status-sold { background: rgba(253, 126, 20, 0.2); color: #fd7e14; }
.status-used { background: rgba(40, 167, 69, 0.2); color: #28a745; }

/* Scan Stats Grid */
.scan-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin-bottom: 25px;
}

.scan-stat {
    text-align: center;
    padding: 20px;
    background: rgba(0, 0, 0, 0. 2);
    border-radius: 12px;
    border: 1px solid var(--border-color);
}

.scan-stat. valid { border-color: var(--success-green); }
.scan-stat. invalid { border-color: var(--danger-red); }
. scan-stat.duplicate { border-color: var(--warning-orange); }

. scan-stat-number {
    display: block;
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-gold);
    font-family: 'Playfair Display', serif;
}

.scan-stat. valid .scan-stat-number { color: var(--success-green); }
. scan-stat.invalid .scan-stat-number { color: var(--danger-red); }
.scan-stat.duplicate . scan-stat-number { color: var(--warning-orange); }

. scan-stat-label {
    display: block;
    margin-top: 5px;
    font-size: 0.85rem;
    color: var(--text-muted);
}

/* Scan Logs */
.scan-logs-header {
    margin-bottom: 15px;
}

.scan-logs-header h3 {
    font-size: 1rem;
    color: var(--text-muted);
}

.scan-logs-container {
    max-height: 400px;
    overflow-y: auto;
}

.scan-log-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    background: rgba(0, 0, 0, 0. 2);
    border-radius: 10px;
    margin-bottom: 10px;
    border-left: 4px solid var(--border-color);
}

.scan-log-item. valid { border-left-color: var(--success-green); }
.scan-log-item.invalid { border-left-color: var(--danger-red); }
.scan-log-item.duplicate { border-left-color: var(--warning-orange); }

.scan-log-icon {
    font-size: 1. 5rem;
}

.scan-log-content {
    flex: 1;
}

.scan-log-ticket {
    font-weight: 600;
    color: var(--text-light);
}

.scan-log-time {
    font-size: 0. 85rem;
    color: var(--text-muted);
}

/* Modal */
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 1000;
    align-items: center;
    justify-content: center;
    padding: 20px;
    overflow-y: auto;
}

.modal. active {
    display: flex;
}

.modal-content {
    background: var(--card-bg);
    border-radius: 15px;
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    border: 2px solid var(--primary-gold);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    background: var(--card-bg);
}

. modal-header h2 {
    color: var(--primary-gold);
}

.modal-close {
    background: none;
    border: none;
    color: var(--text-light);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 5px 10px;
}

.modal-close:hover {
    color: var(--danger-red);
}

.modal-body {
    padding: 20px;
}

.ticket-preview-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.ticket-preview-wrapper h3 {
    color: var(--primary-gold);
    margin-top: 20px;
}

/* Pagination */
. pagination {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 20px;
    flex-wrap: wrap;
}

. pagination button {
    padding: 10px 15px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: rgba(0, 0, 0, 0.3);
    color: var(--text-light);
    cursor: pointer;
    transition: all 0. 3s;
}

.pagination button:hover {
    background: var(--primary-gold);
    color: var(--dark-bg);
}

.pagination button.active {
    background: var(--primary-gold);
    color: var(--dark-bg);
}

/* Notifications */
#notificationContainer {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.notification {
    padding: 15px 25px;
    border-radius: 10px;
    color: white;
    font-weight: 600;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease;
    display: flex;
    align-items: center;
    gap: 10px;
}

.notification.success {
    background: var(--success-green);
}

.notification.error {
    background: var(--danger-red);
}

.notification.warning {
    background: var(--warning-orange);
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* Responsive */
@media (max-width: 768px) {
    .header {
        flex-direction: column;
        text-align: center;
    }
    
    .header-right {
        flex-direction: column;
    }
    
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .button-group {
        flex-direction: column;
    }
    
    .btn-large {
        width: 100%;
        justify-content: center;
    }
}

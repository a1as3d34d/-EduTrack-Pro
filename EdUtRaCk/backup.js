class DataManager {
    constructor() {
      this.currentVersion = '2.1.0';
      this.minSupportedVersion = '2.0.0';
      this.initEventListeners();
    }
  
    initEventListeners() {
      // File input restore
      document.getElementById('restoreFile')?.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          this.validateAndRestore(file);
        }
      });
  
      // Drag and drop area
      const dropArea = document.getElementById('dropArea');
      if (dropArea) {
        dropArea.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropArea.classList.add('dragover');
        });
  
        dropArea.addEventListener('dragleave', () => {
          dropArea.classList.remove('dragover');
        });
  
        dropArea.addEventListener('drop', (e) => {
          e.preventDefault();
          dropArea.classList.remove('dragover');
          
          const file = e.dataTransfer.files[0];
          if (file && file.type === "application/json") {
            this.validateAndRestore(file);
          } else {
            this.showNotification('Please drop a valid JSON backup file', "error");
          }
        });
      }
    }
  
    async backupData() {
      try {
        const data = {
          students: JSON.parse(localStorage.getItem('students')) || [],
          attendance: JSON.parse(localStorage.getItem('attendance')) || [],
          activityLog: JSON.parse(localStorage.getItem('activityLog')) || [],
          lastBackup: new Date().toISOString(),
          version: this.currentVersion,
          checksum: await this.generateChecksum()
        };
  
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        
        // Generate filename with date and time
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
        
        link.href = url;
        link.download = `EduTrack_Backup_${timestamp}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        this.logActivity('Backup created', 'Downloaded system backup');
        this.showNotification('Backup created successfully!');
        
        return true;
      } catch (error) {
        console.error('Backup failed:', error);
        this.showNotification('Backup failed. Please try again.', 'error');
        return false;
      }
    }
  
    async generateChecksum() {
      // In a real implementation, this would generate a hash of the data
      // For example using the Web Crypto API:
      try {
        const data = {
          students: JSON.parse(localStorage.getItem('students')) || [],
          attendance: JSON.parse(localStorage.getItem('attendance')) || [],
          activityLog: JSON.parse(localStorage.getItem('activityLog')) || []
        };
        
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (error) {
        console.error('Checksum generation failed:', error);
        return null;
      }
    }
  
    async emailBackup() {
      try {
        // Create backup first
        const data = {
          students: JSON.parse(localStorage.getItem('students')) || [],
          attendance: JSON.parse(localStorage.getItem('attendance')) || [],
          activityLog: JSON.parse(localStorage.getItem('activityLog')) || [],
          lastBackup: new Date().toISOString(),
          version: this.currentVersion
        };
  
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        
        // For actual email implementation, you would:
        // 1. Use a mailto: link with the blob as attachment (limited browser support)
        // 2. Upload to a cloud service and email the link
        // 3. Use a backend service to handle the email
        
        // Placeholder implementation
        this.showNotification('Preparing backup for email...', 'info');
        
        // Simulate async email process
        setTimeout(() => {
          this.showNotification('Backup ready to email!', 'success');
          this.logActivity('Email backup', 'Backup prepared for email');
        }, 1500);
        
      } catch (error) {
        console.error('Email backup failed:', error);
        this.showNotification('Failed to prepare email backup', 'error');
      }
    }
  
    async validateAndRestore(file) {
      try {
        const fileContent = await this.readFileAsText(file);
        const data = JSON.parse(fileContent);
        
        // Validate backup structure
        if (!this.validateBackup(data)) {
          throw new Error("Invalid backup file structure");
        }
        
        // Verify version compatibility
        if (!this.isVersionCompatible(data.version)) {
          throw new Error(`Backup version ${data.version} is not compatible with current version ${this.currentVersion}`);
        }
        
        // Verify checksum if available
        if (data.checksum) {
          const currentChecksum = await this.generateChecksumForRestore(data);
          if (data.checksum !== currentChecksum) {
            throw new Error("Backup file integrity check failed");
          }
        }
        
        // Show confirmation with backup details
        this.showRestoreConfirmation(data);
        
      } catch (error) {
        console.error("Restore error:", error);
        this.showNotification(`Restore failed: ${error.message}`, "error");
      }
    }
  
    validateBackup(data) {
      return data && 
             Array.isArray(data.students) && 
             Array.isArray(data.attendance) && 
             Array.isArray(data.activityLog) &&
             data.version;
    }
  
    isVersionCompatible(backupVersion) {
      // Simple semver comparison - extend as needed
      const backupParts = backupVersion.split('.').map(Number);
      const minParts = this.minSupportedVersion.split('.').map(Number);
      
      for (let i = 0; i < Math.min(backupParts.length, minParts.length); i++) {
        if (backupParts[i] > minParts[i]) return true;
        if (backupParts[i] < minParts[i]) return false;
      }
      
      return backupParts.length >= minParts.length;
    }
  
    async generateChecksumForRestore(data) {
      // Generate checksum from the backup data to compare with stored checksum
      try {
        const encoder = new TextEncoder();
        const checkData = {
          students: data.students,
          attendance: data.attendance,
          activityLog: data.activityLog
        };
        const dataBuffer = encoder.encode(JSON.stringify(checkData));
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (error) {
        console.error('Checksum verification failed:', error);
        return null;
      }
    }
  
    readFileAsText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error("File reading failed"));
        reader.readAsText(file);
      });
    }
  
    showRestoreConfirmation(data) {
      const backupDate = data.lastBackup ? new Date(data.lastBackup).toLocaleString() : 'unknown date';
      const stats = {
        students: data.students.length,
        attendance: data.attendance.length,
        activities: data.activityLog.length,
        version: data.version
      };
      
      const confirmationMessage = `
        <div class="restore-details">
          <p><strong>Backup Date:</strong> ${backupDate}</p>
          <p><strong>Version:</strong> ${stats.version}</p>
          <div class="restore-stats">
            <div><i class="fas fa-users"></i> ${stats.students} Students</div>
            <div><i class="fas fa-calendar-check"></i> ${stats.attendance} Attendance Records</div>
            <div><i class="fas fa-history"></i> ${stats.activities} Activities</div>
          </div>
          <p class="warning-text"><i class="fas fa-exclamation-triangle"></i> This will overwrite all current data.</p>
        </div>
      `;
      
      showConfirmation(
        "Confirm Restore", 
        confirmationMessage, 
        () => this.performRestore(data)
      );
    }
  
    performRestore(data) {
      try {
        // Save original data for potential undo
        const originalData = {
          students: JSON.parse(localStorage.getItem('students')) || [],
          attendance: JSON.parse(localStorage.getItem('attendance')) || [],
          activityLog: JSON.parse(localStorage.getItem('activityLog')) || []
        };
        
        // Store original data temporarily (could be used for undo)
        sessionStorage.setItem('preRestoreData', JSON.stringify(originalData));
        
        // Update with new data
        localStorage.setItem('students', JSON.stringify(data.students));
        localStorage.setItem('attendance', JSON.stringify(data.attendance));
        localStorage.setItem('activityLog', JSON.stringify(data.activityLog));
        
        // Update application state
        students = data.students;
        attendance = data.attendance;
        activityLog = data.activityLog;
        
        // Refresh UI
        viewAllStudents();
        updateDashboard();
        updatePerformanceChart();
        
        this.showNotification('Data restored successfully!');
        this.logActivity('System restored', `Loaded data from backup (${data.lastBackup})`);
        
      } catch (error) {
        console.error("Restore failed:", error);
        this.showNotification('Data restore failed. Please try again.', "error");
      }
    }
  
    clearAllData() {
      showConfirmation(
        "Clear All Data", 
        `
        <div class="warning-content">
          <i class="fas fa-exclamation-circle"></i>
          <p>This will permanently delete ALL data including:</p>
          <ul>
            <li>Student records</li>
            <li>Attendance history</li>
            <li>Activity logs</li>
          </ul>
          <p>This action cannot be undone!</p>
        </div>
        `, 
        () => {
          // Create backup before clearing
          this.backupData().then(() => {
            // Clear data
            localStorage.setItem('students', JSON.stringify([]));
            localStorage.setItem('attendance', JSON.stringify([]));
            localStorage.setItem('activityLog', JSON.stringify([]));
            
            students = [];
            attendance = [];
            activityLog = [];
            
            // Refresh UI
            viewAllStudents();
            updateDashboard();
            updatePerformanceChart();
            
            this.showNotification('All data has been cleared. A backup was created automatically.');
            this.logActivity('System reset', 'All data cleared');
          });
        }
      );
    }
  
    showNotification(message, type = 'success') {
      // Your existing notification implementation
      console.log(`[${type}] ${message}`);
    }
  
    logActivity(action, details = '') {
      // Your existing activity logging implementation
      console.log(`[Activity] ${action}: ${details}`);
    }
  }
  
  // Initialize data manager
  const dataManager = new DataManager();
import React, { useState, useEffect, useCallback } from 'react';
import { FaHistory, FaClock, FaUsers, FaChartBar, FaBell, FaStopwatch, FaRobot, FaUser } from 'react-icons/fa';
import { useModeManagement, ModeHistoryEntry, ModeScheduleEntry, ModeStatistics, ActiveUser } from '../hooks/useModeManagement';

interface EnhancedModeManagementProps {
  userId: string;
  currentMode: string;
  onModeChange: (mode: 'bot' | 'manual') => void;
  onClose: () => void;
}

const EnhancedModeManagement: React.FC<EnhancedModeManagementProps> = ({
  userId,
  onModeChange,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('history');
  const modeManagement = useModeManagement();
  
  // States for different tabs
  const [modeHistory, setModeHistory] = useState<ModeHistoryEntry[]>([]);
  const [modeSchedules, setModeSchedules] = useState<ModeScheduleEntry[]>([]);
  const [modeStats, setModeStats] = useState<ModeStatistics | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [customDuration, setCustomDuration] = useState(30);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    startTime: '09:00',
    endTime: '17:00',
    mode: 'manual',
    recurring: false,
    daysOfWeek: [] as number[]
  });
  
  // Tab types
  type TabId = 'history' | 'schedule' | 'bulk' | 'stats' | 'notifications' | 'custom';
  
  // Tab content components
  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'history', label: 'History', icon: FaHistory },
    { id: 'schedule', label: 'Schedule', icon: FaClock },
    { id: 'bulk', label: 'Bulk Management', icon: FaUsers },
    { id: 'stats', label: 'Statistics', icon: FaChartBar },
    { id: 'notifications', label: 'Notifications', icon: FaBell },
    { id: 'custom', label: 'Custom Duration', icon: FaStopwatch }
  ];

  const loadTabData = useCallback(async () => {
    modeManagement.clearError();
    
    try {
      switch (activeTab) {
        case 'history':
          await loadModeHistory();
          break;
        case 'schedule':
          await loadModeSchedules();
          break;
        case 'stats':
          await loadModeStatistics();
          break;
        case 'bulk':
          await loadActiveUsers();
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Error loading tab data:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, modeManagement]);

  // Load data based on active tab
  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  const loadModeHistory = async () => {
    try {
      const data = await modeManagement.getModeHistory(userId);
      setModeHistory(data.history || []);
    } catch (err) {
      console.error('Error loading mode history:', err);
    }
  };

  const loadModeSchedules = async () => {
    try {
      const schedules = await modeManagement.getModeSchedules(userId);
      setModeSchedules(schedules || []);
    } catch (err) {
      console.error('Error loading mode schedules:', err);
    }
  };

  const loadModeStatistics = async () => {
    try {
      const stats = await modeManagement.getModeStatistics();
      setModeStats(stats);
    } catch (err) {
      console.error('Error loading mode statistics:', err);
    }
  };

  const loadActiveUsers = async () => {
    try {
      const data = await modeManagement.getActiveUsers();
      setActiveUsers(data.users || []);
    } catch (err) {
      console.error('Error loading active users:', err);
    }
  };

  const handleBulkModeChange = async (mode: 'bot' | 'manual') => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }
    
    try {
      await modeManagement.bulkChangeModes({
        users: selectedUsers,
        mode,
        changedBy: 'admin', // This should come from current user context
        reason: `Bulk mode change to ${mode}`,
        duration: mode === 'manual' ? 30 : undefined
      });
      
      alert(`Changed ${selectedUsers.length} users to ${mode} mode`);
      setSelectedUsers([]);
      
      // Refresh the active users list
      await loadActiveUsers();
    } catch (err) {
      console.error('Error in bulk mode change:', err);
    }
  };

  const handleScheduleMode = async () => {
    try {
      await modeManagement.createModeSchedule({
        from: userId,
        mode: scheduleForm.mode,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        recurring: scheduleForm.recurring,
        daysOfWeek: scheduleForm.daysOfWeek,
        createdBy: 'admin' // This should come from current user context
      });
      
      alert('Schedule created successfully');
      await loadModeSchedules();
      
      // Reset form
      setScheduleForm({
        startTime: '09:00',
        endTime: '17:00',
        mode: 'manual',
        recurring: false,
        daysOfWeek: []
      });
    } catch (err) {
      console.error('Error creating schedule:', err);
    }
  };

  const handleCustomDurationMode = async () => {
    try {
      await modeManagement.setCustomDuration({
        from: userId,
        duration: customDuration,
        changedBy: 'admin', // This should come from current user context
        reason: `Custom duration manual mode for ${customDuration} minutes`
      });
      
      onModeChange('manual');
      alert(`Manual mode activated for ${customDuration} minutes`);
    } catch (err) {
      console.error('Error setting custom duration:', err);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'history':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Mode History</h3>
            <div className="space-y-2">
              {modeHistory.map((entry) => (
                <div key={entry.id} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {entry.mode === 'manual' ? (
                        <FaUser className="text-blue-500" />
                      ) : (
                        <FaRobot className="text-green-500" />
                      )}
                      <span className="font-medium">{entry.mode.toUpperCase()}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date().toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Changed by: {entry.changedBy}
                    {entry.reason && (
                      <span className="block">Reason: {entry.reason}</span>
                    )}
                    {entry.duration && (
                      <span className="block">Duration: {entry.duration} minutes</span>
                    )}
                    {entry.forceMode && (
                      <span className="block">
                        <span className="px-1 py-0.5 bg-red-100 text-red-800 rounded text-xs">
                          FORCE MODE
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Mode Schedule</h3>              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Create New Schedule</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={scheduleForm.startTime}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={scheduleForm.endTime}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mode
                    </label>
                    <select 
                      value={scheduleForm.mode}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, mode: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="manual">Manual</option>
                      <option value="bot">Bot</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="recurring"
                      checked={scheduleForm.recurring}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, recurring: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="recurring" className="text-sm">
                      Recurring
                    </label>
                  </div>
                </div>
                <button
                  onClick={handleScheduleMode}
                  disabled={modeManagement.loading}
                  className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {modeManagement.loading ? 'Creating...' : 'Create Schedule'}
                </button>
              </div>
            <div className="space-y-2">
              {modeSchedules.map((schedule) => (
                <div key={schedule.id} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{schedule.mode.toUpperCase()}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        {schedule.startTime} - {schedule.endTime}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {schedule.recurring && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Recurring
                        </span>
                      )}
                      <button
                        className={`text-xs px-2 py-1 rounded ${
                          schedule.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {schedule.active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'bulk':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Bulk Mode Management</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Select Users</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activeUsers.map((user) => (
                  <div key={user.from} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={user.from}
                        checked={selectedUsers.includes(user.from)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.from]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(u => u !== user.from));
                          }
                        }}
                        className="mr-2"
                      />
                      <label htmlFor={user.from} className="text-sm">
                        {user.from}
                      </label>
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className={`px-2 py-1 rounded ${
                        user.effectiveMode === 'manual' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.effectiveMode}
                      </span>
                      {user.forceModeManual && (
                        <span className="ml-1 px-1 py-0.5 bg-red-100 text-red-800 rounded text-xs">
                          FORCE
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => handleBulkModeChange('bot')}
                  disabled={modeManagement.loading || selectedUsers.length === 0}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                >
                  Set to Bot Mode
                </button>
                <button
                  onClick={() => handleBulkModeChange('manual')}
                  disabled={modeManagement.loading || selectedUsers.length === 0}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  Set to Manual Mode
                </button>
              </div>
            </div>
          </div>
        );

      case 'stats':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Mode Statistics</h3>
            {modeStats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{modeStats.totalUsers}</div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{modeStats.botModeUsers}</div>
                  <div className="text-sm text-gray-600">Bot Mode Users</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{modeStats.manualModeUsers}</div>
                  <div className="text-sm text-gray-600">Manual Mode Users</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{modeStats.forceModeUsers}</div>
                  <div className="text-sm text-gray-600">Force Mode Users</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{modeStats.averageManualDuration}m</div>
                  <div className="text-sm text-gray-600">Avg Manual Duration</div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{modeStats.modeChangesToday}</div>
                  <div className="text-sm text-gray-600">Mode Changes Today</div>
                </div>
              </div>
            )}
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Mode Notifications</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">Enable Notifications</span>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {notificationsEnabled && (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input type="checkbox" id="mode-change" className="mr-2" defaultChecked />
                    <label htmlFor="mode-change" className="text-sm">
                      Notify when mode changes
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="force-mode" className="mr-2" defaultChecked />
                    <label htmlFor="force-mode" className="text-sm">
                      Notify when force mode is activated
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="manual-timeout" className="mr-2" defaultChecked />
                    <label htmlFor="manual-timeout" className="text-sm">
                      Notify when manual mode timeout expires
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'custom':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Custom Mode Duration</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manual Mode Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(parseInt(e.target.value) || 30)}
                  className="w-full p-2 border rounded-md"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Duration: {customDuration} minutes ({Math.floor(customDuration / 60)}h {customDuration % 60}m)
                </p>
              </div>
              <button
                onClick={handleCustomDurationMode}
                disabled={modeManagement.loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {modeManagement.loading ? 'Activating...' : 'Activate Manual Mode'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Enhanced Mode Management</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Error Message */}
        {modeManagement.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{modeManagement.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {modeManagement.loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedModeManagement;

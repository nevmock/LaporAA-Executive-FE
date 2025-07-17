"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { FaWhatsapp, FaCheck, FaExclamationCircle, FaFileAlt, FaCog, FaClipboardCheck, FaCheckCircle, FaTimesCircle, FaRobot } from "react-icons/fa";
import { Data } from "../../../../lib/types";
import axios from "../../../../utils/axiosInstance";
import { TindakanActionProps } from "../../../../components/pengaduan/laporan/tindakan";
import ActionButtons from "../../../../components/pengaduan/laporan/ActionButtons";
import { Tooltip } from "../../../../components/Tooltip";
import { useBotModeWithTab } from "../../../../hooks/useBotMode";
import { BotModeDebugPanel } from "../../../../components/BotModeIndicator";
import EnvironmentDebug from "../../../../components/EnvironmentDebug";

// Dynamic imports
const EnhancedModeManagement = dynamic(() => import("../../../../components/EnhancedModeManagement"), { 
  loading: () => <div>Loading...</div>, 
  ssr: false 
});

const FileManager = dynamic(() => import("../../../../components/FileManager"), { 
  loading: () => <div>Loading...</div>, 
  ssr: false 
});

// Loading spinner (lazy)
const LoadingPage = dynamic(() => import("../../../../components/LoadingPage"), { ssr: false });
const MemoTindakan = dynamic(() => import("../../../../components/pengaduan/laporan/tindakan"), { 
  loading: () => <div>Loading...</div>, 
  ssr: false 
});
const MemoMessage = dynamic(() => import("../../../../components/pengaduan/laporan/message"), { 
  loading: () => <div>Loading...</div>, 
  ssr: false 
});

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function ChatPage() {
  const params = useParams() as { sessionId?: string };
  const sessionId = params?.sessionId;
  const router = useRouter();

  // State
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pesan" | "tindakan">("tindakan");
  const [tindakanActionProps, setTindakanActionProps] = useState<TindakanActionProps | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [showEnhancedModeManagement, setShowEnhancedModeManagement] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);
  
  // Force mode state - menggunakan pattern yang sama seperti di tableSection
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [forceModeStates, setForceModeStates] = useState<Record<string, boolean>>({});
  const [loadingForceMode, setLoadingForceMode] = useState<Record<string, boolean>>({});
  
  // Bot Mode Management - Re-enabled with proper error handling
  const botMode = useBotModeWithTab({
    userId: data?.from || '',
    activeTab,
    messageTabKey: 'pesan',
    debug: process.env.NODE_ENV === 'development'
  });
  
  // Add error handling for bot mode
  useEffect(() => {
    if (botMode.error) {
      console.error('Bot mode error:', botMode.error);
      // Don't show alert to avoid user disruption, just log the error
    }
  }, [botMode.error]);
  
  // Manual mode change handler for Message component with debouncing
  const modeChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [changingMode, setChangingMode] = useState(false);
  
  const handleModeChange = async (newMode: "bot" | "manual") => {
    console.log(`Mode change requested: ${newMode}`);
    
    // Prevent multiple rapid calls
    if (changingMode) {
      console.log('Mode change already in progress, skipping...');
      return;
    }
    
    // Clear any existing timeout
    if (modeChangeTimeoutRef.current) {
      clearTimeout(modeChangeTimeoutRef.current);
    }
    
    setChangingMode(true);
    
    try {
      if (newMode === 'manual') {
        await botMode.setManualMode(30); // 30 minutes timeout
      } else {
        await botMode.changeMode('bot');
      }
      console.log(`Mode successfully changed to: ${newMode}`);
    } catch (error) {
      console.error('Failed to change mode:', error);
      alert('Failed to change mode. Please try again.');
    } finally {
      // Add small delay before allowing next mode change
      modeChangeTimeoutRef.current = setTimeout(() => {
        setChangingMode(false);
      }, 1000);
    }
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (modeChangeTimeoutRef.current) {
        clearTimeout(modeChangeTimeoutRef.current);
      }
    };
  }, []);

  // Toggle force mode - menggunakan hook botMode untuk konsistensi
  const toggleForceMode = async (from: string, currentForceMode: boolean) => {
    if (!botMode || !botMode.setForceMode) {
      console.error('Bot mode service not available');
      return;
    }

    if (loadingForceMode[from]) return; // Hindari multiple calls

    try {
      setLoadingForceMode(prev => ({ ...prev, [from]: true }));

      const newForceMode = !currentForceMode;
      
      console.log(`Toggling force mode for ${from}: ${currentForceMode} -> ${newForceMode}`);

      // Gunakan hook botMode.setForceMode untuk konsistensi
      await botMode.setForceMode(newForceMode);

      // Update state force mode lokal (untuk UI)
      setForceModeStates(prev => ({
        ...prev,
        [from]: newForceMode
      }));

      console.log(`Force mode ${newForceMode ? 'enabled' : 'disabled'} for ${from}`);
    } catch (err) {
      console.error("Gagal ubah force mode:", err);
      // Show user-friendly error message
      alert("Terjadi kesalahan saat mengubah mode bot. Silakan coba lagi.");
    } finally {
      setLoadingForceMode(prev => ({ ...prev, [from]: false }));
    }
  };

  // This function is passed to tindakan component to get action props and break render loop
  const handleActionProps = useCallback((props: TindakanActionProps): React.ReactNode => {
    // Use requestAnimationFrame to break out of the current render cycle
    // and prevent tight render loops
    requestAnimationFrame(() => {
      setTindakanActionProps(currentProps => {
        if (!currentProps) return props;
        
        // Only update if critical properties change
        const hasImportantChanges = 
          currentProps.currentStepIndex !== props.currentStepIndex ||
          currentProps.isButtonDisabled !== props.isButtonDisabled ||
          currentProps.isSaving !== props.isSaving ||
          currentProps.isLoading !== props.isLoading;
          
        return hasImportantChanges ? props : currentProps;
      });
    });
    
    // IMPORTANT: Return null (a valid ReactNode), not an object
    // This prevents the "Objects are not valid as React children" error
    return null;
  }, []);

  // Debug panel toggle (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
          setShowDebugPanel(prev => !prev);
        }
      };
      
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, []);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");
    setRole(userRole);
    if (!token) router.push("/login");
  }, [router]);

  // Fetch data
  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    axios.get(`${API_URL}/reports/${sessionId}`)
      .then(res => setData(res.data))
      .catch(() => {
        setData(null);
        setError("Gagal mengambil data laporan.");
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Load force mode status - sinkronisasi dengan hook botMode
  useEffect(() => {
    if (!data?.from || !botMode.isReady) return;

    // Sinkronkan state lokal dengan hook botMode
    setForceModeStates(prev => ({
      ...prev,
      [data.from]: botMode.forceMode
    }));
  }, [data?.from, botMode.isReady, botMode.forceMode]);

  // Helper: ProgressBar
  const renderProgressBar = () => {
    if (!data?.tindakan) return null;
    const statusList = [
      "Perlu Verifikasi",
      "Verifikasi Situasi",
      "Verifikasi Kelengkapan Berkas",
      "Proses OPD Terkait",
      "Selesai Penanganan",
      "Selesai Pengaduan",
      "Ditutup",
    ];
    const statusColors: Record<string, string> = {
      "Perlu Verifikasi": "#FF3131",
      "Verifikasi Situasi": "#5E17EB",
      "Verifikasi Kelengkapan Berkas": "#FF9F12",
      "Proses OPD Terkait": "#FACD15",
      "Selesai Penanganan": "#60A5FA",
      "Selesai Pengaduan": "#4ADE80",
      "Ditutup": "#000",
    };
    
    // Status icons mapping with responsive sizing
    const statusIcons = {
      "Perlu Verifikasi": <FaExclamationCircle className="text-lg md:text-lg" />,
      "Verifikasi Situasi": <FaCheck className="text-lg md:text-lg" />,
      "Verifikasi Kelengkapan Berkas": <FaFileAlt className="text-lg md:text-lg" />,
      "Proses OPD Terkait": <FaCog className="text-lg md:text-lg" />,
      "Selesai Penanganan": <FaClipboardCheck className="text-lg md:text-lg" />,
      "Selesai Pengaduan": <FaCheckCircle className="text-lg md:text-lg" />,
      "Ditutup": <FaTimesCircle className="text-lg md:text-lg" />,
    };
    
    const getStatusColor = (status: string) => statusColors[status] || "#D1D5DB";
    const currentStepIndex = statusList.indexOf(data.tindakan.status || "Perlu Verifikasi");
    const isStatusDitutup = data.tindakan.status === "Ditutup";
    
    // Calculate precise positioning for progress bar
    const progressWidth = isStatusDitutup 
      ? "100%" 
      : `${(currentStepIndex / (statusList.length - 1)) * 100}%`;
    
    // Gradient for progress bar (black for Ditutup, green gradient otherwise)
    const progressBarStyle = isStatusDitutup
      ? { backgroundColor: "#000", width: progressWidth }
      : { width: progressWidth };
      
    const progressBarClass = isStatusDitutup
      ? "absolute top-1/2 left-0 h-3 bg-black rounded-full z-10 transition-all duration-300"
      : "absolute top-1/2 left-0 h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full z-10 transition-all duration-300";
    
    return (
      <div className="flex items-center gap-2 md:gap-3 w-full">
        <div className="flex-1 relative h-8 flex items-center">
          <div className="absolute top-1/2 left-0 right-0 h-2 md:h-3 bg-gray-200 rounded-full z-0" style={{ transform: 'translateY(-50%)' }} />
          <div className={progressBarClass.replace('h-3', 'h-2 md:h-3')} style={{ ...progressBarStyle, transform: 'translateY(-50%)' }} />
          <div className="flex justify-between relative z-20 w-full">
            {statusList.map((status, idx) => {
              const isDone = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const color = getStatusColor(status);
              const icon = statusIcons[status as keyof typeof statusIcons];
              
              // Special styling for Ditutup status
              const stepColor = isStatusDitutup && status === "Ditutup" 
                ? "#000" 
                : isDone || isCurrent ? color : '#E5E7EB';
                
              const textColor = isDone || isCurrent ? '#fff' : '#6B7280';
              const borderClass = isCurrent 
                ? isStatusDitutup ? 'border-black' : 'border-green-600' 
                : 'border-gray-300';
                
              // Tooltip content
              const tooltipText = `${status} (Langkah ${idx + 1} dari ${statusList.length})`;
              
              return (
                <div key={status} className="flex flex-col items-center min-w-0">
                  <Tooltip text={tooltipText}>
                    <div 
                      className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold border-2 ${borderClass} shadow-sm cursor-pointer hover:shadow-md transition-all`} 
                      style={{ backgroundColor: stepColor, color: textColor }}
                    >
                      {icon}
                    </div>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </div>
        <span 
          className="text-xs md:text-sm font-semibold px-2 md:px-3 py-1 md:py-1.5 rounded bg-gray-100 border whitespace-nowrap text-black" 
          style={{borderColor: statusColors[data.tindakan.status] }}
        >
          {data.tindakan.status}
        </span>
      </div>
    );
  };

  // Avatar helper
  const renderAvatar = () => {
    const name = data?.user?.name || '';
    const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
        {initials}
      </div>
    );
  };

  if (!sessionId) return null;
  if (loading) return <div>Loading...</div>;
  if (error) return (
    <div className="flex flex-col items-center justify-center h-full text-red-600">
      <p className="mb-2">{error}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-gray-200 rounded">Reload</button>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden" style={{ overflowY: 'hidden' }}>
      {/* CONTAINER 1: HEADER WITH NAVIGATION */}
      <header className="w-full bg-white border-b shadow-sm z-40">
        {/* User info section */}
        <div className="flex flex-col md:flex-row items-start md:items-center px-4 md:px-8 py-3 justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push("/pengaduan")}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition border border-gray-200 shadow"
              aria-label="Kembali"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                className="w-6 h-6 text-gray-600">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            {renderAvatar()}
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-gray-900 truncate text-base leading-tight">{data?.user?.name}</span>
              <span className="text-xs text-gray-500 truncate">+{data?.from}</span>
            </div>
          </div>
          <div className="w-full md:w-auto md:flex-1 flex justify-start md:justify-end mt-2 md:mt-0">{renderProgressBar()}</div>
        </div>
        
        {/* Navigation tabs */}
        <nav className="flex h-[35px] border-b px-4 md:px-8 bg-white justify-between items-center">
          <div className="flex">
            {['tindakan', 'pesan'].map((tab) => (
              <button
                key={tab}
                className={`py-2 md:py-3 px-4 h-[35px] md:px-6 font-semibold flex justify-center items-center gap-2 transition-all rounded-t-md focus:outline-none
                  ${activeTab === tab
                    ? tab === 'pesan'
                      ? 'border-b-4 border-green-600 text-green-700 bg-green-50 shadow-sm'
                      : 'border-b-4 border-gray-800 text-gray-900 bg-gray-100 shadow-sm'
                    : tab === 'pesan'
                      ? 'text-green-600 bg-green-50 hover:bg-green-100'
                      : 'text-gray-500 bg-gray-50 hover:bg-gray-100'
                  }`}
                onClick={() => setActiveTab(tab as 'pesan' | 'tindakan')}
                style={{ minWidth: 100 }}
              >
                {tab === 'pesan' && <FaWhatsapp className="text-lg" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Force Mode Button - Show on both tabs, styled like navigation tab */}
          {(role === "Bupati" || role === "SuperAdmin" || role === "Admin") && data?.from && (
            <div className="h-[35px]">
              {loadingForceMode[data.from] ? (
                <div className="h-[35px] py-2 md:py-3 px-4 md:px-6 font-semibold flex justify-center items-center gap-2 bg-gray-50 rounded-t-md">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                  <span className="text-xs text-gray-500">Loading...</span>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    if (activeTab === 'pesan') return; // Disable click pada tab pesan
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Force mode button clicked, activeTab:', activeTab);
                    toggleForceMode(data.from, botMode.forceMode);
                  }}
                  className={`h-[35px] py-2 md:py-3 px-4 md:px-6 font-semibold flex justify-center items-center gap-2 transition-all rounded-t-md focus:outline-none
                    ${activeTab === 'pesan' 
                      ? 'cursor-not-allowed opacity-50' 
                      : 'hover:opacity-80 cursor-pointer'
                    }
                    ${(activeTab === 'pesan' || botMode.forceMode)
                      ? 'border-b-4 border-green-600 text-green-700 bg-green-50 shadow-sm' 
                      : 'border-b-4 border-gray-400 text-gray-600 bg-gray-50'
                    }`}
                  title={
                    activeTab === 'pesan' 
                      ? 'Mode Manual aktif di tab Pesan. Ubah di tab Tindakan.' 
                      : (botMode.forceMode ? 'Bot Mode: Manual (Click to Auto)' : 'Bot Mode: Auto (Click to Manual)')
                  }
                  style={{ minWidth: 120 }}
                  type="button"
                  disabled={activeTab === 'pesan'}
                >
                  {(activeTab === 'pesan' || botMode.forceMode) ? (
                    <>
                      Mode Manual
                      <FaWhatsapp className="text-lg" />
                      
                    </>
                  ) : (
                    <>
                      <FaRobot className="text-lg" />
                      Mode Bot On
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </nav>
      </header>
      
      {/* CONTAINER 2: MAIN CONTENT - SCROLLABLE */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto" style={{ overflowX: 'hidden' }}>
          <div className="h-full px-3 py-3">
            {activeTab === 'pesan' ? (
              <div className="h-full relative">
                <MemoMessage 
                  from={data?.from || ""} 
                  mode={botMode.mode} 
                  onModeChange={handleModeChange}
                  forceMode={botMode.forceMode}
                />
                {/* Smart Mode Indicator with Force Mode display and Manual Toggle */}
                <div className="absolute top-2 right-4 z-20 flex items-center gap-2">
                  {/* Mode Indicator */}
                  <div className={`px-3 py-2 rounded-lg text-sm font-medium shadow-sm ${
                    botMode.mode === 'manual' 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <FaRobot className={botMode.mode === 'manual' ? 'text-green-600' : 'text-gray-600'} />
                      <span>{botMode.mode === 'manual' ? 'Manual' : 'Bot'}</span>
                      {botMode.forceMode && (
                        <span className="px-1.5 py-0.5 bg-red-500 text-white rounded text-xs font-bold">
                          FORCE
                        </span>
                      )}
                      {botMode.isChanging && (
                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                  </div>
                  
                  {/* Manual Mode Toggle Button */}
                  {!botMode.forceMode && !botMode.isChanging && (
                    <button
                      onClick={() => {
                        const newMode = botMode.mode === 'manual' ? 'bot' : 'manual';
                        handleModeChange(newMode);
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                        botMode.mode === 'manual'
                          ? 'bg-gray-500 hover:bg-gray-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                      title={botMode.mode === 'manual' ? 'Switch to Bot Mode' : 'Switch to Manual Mode (30 min)'}
                    >
                      {botMode.mode === 'manual' ? 'Switch to Bot' : 'Manual Mode'}
                    </button>
                  )}
                  
                  {/* Force Mode Toggle Button (for admin) */}
                  {role === 'admin' && (
                    <button
                      onClick={() => toggleForceMode(data?.from || '', botMode.forceMode)}
                      disabled={loadingForceMode[data?.from || '']}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                        botMode.forceMode
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-orange-500 hover:bg-orange-600 text-white'
                      } ${loadingForceMode[data?.from || ''] ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={botMode.forceMode ? 'Disable Force Mode' : 'Enable Force Mode (Override all auto-switching)'}
                    >
                      {loadingForceMode[data?.from || ''] ? (
                        <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        botMode.forceMode ? 'Disable Force' : 'Force Mode'
                      )}
                    </button>
                  )}
                  
                  {/* Enhanced Mode Management Button (for admin) */}
                  {role === 'admin' && (
                    <button
                      onClick={() => setShowEnhancedModeManagement(true)}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm bg-purple-500 hover:bg-purple-600 text-white"
                      title="Advanced Mode Management"
                    >
                      <FaCog className="inline mr-1" />
                      Advanced
                    </button>
                  )}
                  
                  {/* File Manager Button */}
                  {(role === "Bupati" || role === "SuperAdmin" || role === "Admin") && (
                    <button
                      onClick={() => setShowFileManager(true)}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm bg-blue-500 hover:bg-blue-600 text-white"
                      title="File Manager"
                    >
                      <FaFileAlt className="inline mr-1" />
                      Files
                    </button>
                  )}
                </div>
              </div>
            ) : (
              data && sessionId ? (
                <div className="h-full">
                  <MemoTindakan
                    key={`tindakan-${sessionId}-${data?.tindakan?.status || 'initial'}`}
                    tindakan={data?.tindakan || null}
                    sessionId={sessionId}
                    processed_by={data?.processed_by}
                    reportData={data}
                    actionProps={handleActionProps}
                    role={role}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <LoadingPage />
                </div>
              )
            )}
          </div>
        </div>
      </main>
      
      {/* CONTAINER 3: ACTION BUTTONS FOOTER */}
      {activeTab === 'tindakan' && tindakanActionProps && (
        <footer className="w-full bg-white border-t z-30 px-4 md:px-8 py-3 flex justify-center shadow-lg" style={{ flexShrink: 0 }}>
          <ActionButtons {...tindakanActionProps} />
        </footer>
      )}

      {/* Debug Panel - Re-enabled for development */}
      {showDebugPanel && process.env.NODE_ENV === 'development' && (
        <BotModeDebugPanel
          mode={botMode.mode}
          isReady={botMode.isReady}
          isChanging={botMode.isChanging}
          error={botMode.error}
          cacheStats={null}
          onRefresh={botMode.refreshMode}
          onClearCache={() => {
            // Clear cache using the service
            import('../../../../services/botModeService').then(({ getBotModeService }) => {
              const service = getBotModeService();
              if (service) {
                service.clearCache(data?.from);
              }
            });
          }}
          onChangeMode={handleModeChange}
        />
      )}

      {/* Enhanced Mode Management Modal */}
      {showEnhancedModeManagement && (
        <EnhancedModeManagement
          userId={data?.from || ''}
          currentMode={botMode.mode}
          onModeChange={handleModeChange}
          onClose={() => setShowEnhancedModeManagement(false)}
        />
      )}
      
      {/* File Manager Modal */}
      {showFileManager && (
        <FileManager
          onClose={() => setShowFileManager(false)}
          selectMode={false}
          userId={data?.from}
        />
      )}
      
      {/* Environment Debug - Development only */}
      <EnvironmentDebug />
    </div>
  );
}
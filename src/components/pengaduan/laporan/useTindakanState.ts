import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TindakanClientState } from "../../../lib/types";
import axios from "../../../utils/axiosInstance";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export const STATUS_LIST = [
  "Perlu Verifikasi",
  "Verifikasi Situasi",
  "Verifikasi Kelengkapan Berkas",
  "Proses OPD Terkait",
  "Selesai Penanganan",
  "Selesai Pengaduan",
  "Ditutup",
];

export function useTindakanState(tindakan: TindakanClientState) {
  const [formData, setFormData] = useState<TindakanClientState>({} as TindakanClientState);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [notif, setNotif] = useState<string | null>(null);
  const [saveSuccessModalVisible, setSaveSuccessModalVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLaporModal, setShowLaporModal] = useState(false);
  const [showBackModal, setShowBackModal] = useState(false);
  const [pendingNextStatus, setPendingNextStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSelesaiModal, setShowSelesaiModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selesaiReason, setSelesaiReason] = useState("");
  const [confirmedVerifikasi2, setConfirmedVerifikasi2] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (tindakan) {
      try {
        // The processed_by data is passed separately from the TindakanComponent props
        // In the TindakanComponent constructor, it receives "processed_by: rawProcessedBy"
        // So in useTindakanState, we only need to handle the tindakan object itself
        
        // Just create a copy of the tindakan object - the processed_by field will be managed
        // and set by the TindakanComponent when it calls setFormData
        const formattedTindakan = {...tindakan};
        
        setFormData(formattedTindakan);
        const stepIndex = STATUS_LIST.indexOf(tindakan.status || "Perlu Verifikasi");
        setCurrentStepIndex(stepIndex >= 0 ? stepIndex : 0);
      } catch (error) {
        console.error("Error processing tindakan data:", error);
        // Continue with basic initialization to prevent UI from breaking
        setFormData(tindakan);
        const stepIndex = STATUS_LIST.indexOf(tindakan.status || "Perlu Verifikasi");
        setCurrentStepIndex(stepIndex >= 0 ? stepIndex : 0);
      }
    }
  }, [tindakan]);

  const validateCurrentStep = useCallback(() => {
    const status = STATUS_LIST[currentStepIndex];
    let requiredFields: (keyof TindakanClientState)[] = [];
    if (status === "Verifikasi Situasi") requiredFields = ["situasi"];
    else if (status === "Verifikasi Kelengkapan Berkas") requiredFields = ["trackingId", "url", "status_laporan"];
    else if (status === "Proses OPD Terkait") requiredFields = ["kesimpulan", "opd"];
    return requiredFields.every((field) => field in formData ? !!formData[field] : true);
  }, [currentStepIndex, formData]);

  const updateProcessedBy = useCallback(async () => {
    try {
      console.log("Updating processed_by...");
      
      if (!formData.report) {
        console.error("Missing report ID in formData");
        return Promise.reject(new Error("Missing report ID"));
      }
      
      // First check for user_id in localStorage as confirmed by the user
      const user_id = localStorage.getItem('user_id');
      console.log("Found user_id in localStorage:", user_id);
      
      // Validate that it's a MongoDB ObjectId (24-character hex string)
      if (user_id && /^[0-9a-fA-F]{24}$/.test(user_id)) {
        console.log("Using valid user_id from localStorage:", user_id);
        
        const response = await axios.patch(`${API_URL}/tindakan/${formData.report}/processed-by`, {
          userLoginId: user_id
        });
        
        console.log("Update processed_by successful:", response.status);
        return response;
      }
      
      console.log("No valid user_id in localStorage, trying alternatives");
      
      // Fallback - try other possible places for the user ID
      let userLoginId: string | null = null;
      let isValidObjectId = false;
      
      try {
        // Check in userData
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          
          // Check various possible locations for the ObjectId
          const candidateId = parsedUserData._id || 
                       (parsedUserData.user && parsedUserData.user._id) || 
                       parsedUserData.userId || 
                       parsedUserData.id;
          
          if (candidateId && typeof candidateId === 'string' && /^[0-9a-fA-F]{24}$/.test(candidateId)) {
            userLoginId = candidateId;
            isValidObjectId = true;
          }
        }
        
        // Try other storage locations
        if (!isValidObjectId) {
          const possibleKeys = ['userId', 'id', 'user_id', 'admin_id'];
          
          for (const key of possibleKeys) {
            const value = localStorage.getItem(key);
            if (value && /^[0-9a-fA-F]{24}$/.test(value)) {
              userLoginId = value;
              isValidObjectId = true;
              console.log(`Found valid ID in localStorage.${key}:`, value);
              break;
            }
          }
          
          if (!isValidObjectId) {
            const user = localStorage.getItem('user');
            if (user) {
              try {
                const parsedUser = JSON.parse(user);
                const candidateId = parsedUser._id || parsedUser.id;
                if (candidateId && typeof candidateId === 'string' && /^[0-9a-fA-F]{24}$/.test(candidateId)) {
                  userLoginId = candidateId;
                  isValidObjectId = true;
                }
              } catch (e) {
                console.error("Failed to parse 'user' from localStorage:", e);
              }
            }
          }
        }
      } catch (localStorageError) {
        console.error("Error accessing localStorage:", localStorageError);
      }
      
      if (!isValidObjectId || !userLoginId) {
        console.log("Could not find a valid MongoDB ObjectId for the user");
        // Don't show error notification since this is a fallback attempt
        return { status: "skipped", message: "No valid ObjectId found" };
      }
      
      console.log(`Sending PATCH request to ${API_URL}/tindakan/${formData.report}/processed-by with userLoginId:`, userLoginId);
      
      const response = await axios.patch(`${API_URL}/tindakan/${formData.report}/processed-by`, {
        userLoginId
      });
      
      console.log("Update processed_by successful:", response.status);
      return response;
    } catch (err) {
      console.error("Error updating processed_by:", err);
      if (err instanceof Error) {
        console.error("Error message:", err.message);
      }
      // Don't reject - we'll continue with the main flow
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      return { status: "error", message: errorMessage };
    }
  }, [formData]); // setNotif is stable and doesn't need to be in dependencies

  const saveData = useCallback(async (nextStatus?: string) => {
    try {
      // Add detailed logging to track operation
      console.log("Starting saveData operation...");
      
      // Check for required data
      if (!formData.report) {
        console.error("Missing report ID in formData");
        setNotif("❌ Gagal menyimpan: ID laporan tidak tersedia");
        return Promise.reject(new Error("Missing report ID"));
      }
      
      // Get user from localStorage with safety
      let userId;
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          userId = parsedUserData.name || parsedUserData.nama_admin || localStorage.getItem('nama_admin');
        } else {
          userId = localStorage.getItem('nama_admin');
        }
      } catch (localStorageError) {
        console.error("Error accessing localStorage:", localStorageError);
      }
      
      if (!userId) {
        console.error("Missing user ID");
        setNotif("❌ Gagal menyimpan: ID pengguna tidak tersedia");
        return Promise.reject(new Error("Missing user ID"));
      }
      
      console.log("Preparing data for save operation");
      
      // Simplified data handling
      const updatedData = {
        ...formData,
        updatedAt: new Date().toISOString(),
        status: formData.situasi === "Darurat" ? "Selesai Pengaduan" : nextStatus || formData.status
      };
      
      // Only set processed_by if it doesn't already exist
      if (!updatedData.processed_by) {
        updatedData.processed_by = userId;
      }
      
      console.log(`Sending PUT request to ${API_URL}/tindakan/${formData.report}`);
      
      const response = await axios.put(`${API_URL}/tindakan/${formData.report}`, updatedData);
      console.log("Save operation successful, response status:", response.status);
      
      // If the API returns processed_by data, use it directly
      if (response.data && response.data.processed_by) {
        updatedData.processed_by = response.data.processed_by;
      }
      
      // Update state with the new data
      setFormData(updatedData);
      setNotif("✅ Data berhasil disimpan");
      
      return response;
    } catch (err) {
      console.error("Error in saveData:", err);
      // More detailed error messaging
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setNotif(`❌ Gagal menyimpan data: ${errorMessage}`);
      return Promise.reject(err);
    } finally {
      setTimeout(() => setNotif(null), 5000);
    }
  }, [formData]); // API_URL is a constant and doesn't need to be in dependencies

  const handleNextStep = useCallback(async () => {
    // if (!validateCurrentStep()) {
    //   alert("Harap lengkapi semua data terlebih dahulu.");
    //   return;
    // }
    
    const nextIndex = currentStepIndex + 1;
    const nextStatus = STATUS_LIST[nextIndex];
    setIsLoading(true);
    
    try {
      // If we're moving from "Perlu Verifikasi" to "Verifikasi Situasi" (step 1 to 2),
      // attempt to update the processed_by field but don't block if it fails
      if (currentStepIndex === 0 && nextIndex === 1) {
        console.log("Attempting to update processed_by for step transition 1->2");
        try {
          const processorResult = await updateProcessedBy();
          if (processorResult.status === 200) {
            console.log("Successfully updated processed_by");
          } else {
            console.log("Skipped updating processed_by:", processorResult);
          }
        } catch (err) {
          // This shouldn't happen now that updateProcessedBy doesn't reject promises
          console.warn("Unexpected error in updateProcessedBy, continuing anyway:", err);
        }
      }
      
      console.log(`Saving data with next status: ${nextStatus}`);
      await saveData(nextStatus);
      
      // Jangan update state local, langsung reload halaman
      console.log(`Successfully saved step ${nextIndex}, reloading page...`);
      // window.location.reload(); // Ini akan dipanggil dari ActionButtons
    } catch (err) {
      console.error("Error in handleNextStep:", err);
      setNotif(`❌ Gagal memproses: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err; // Re-throw error agar ActionButtons bisa handle loading state
    } finally {
      setIsLoading(false);
    }
  }, [currentStepIndex, saveData, updateProcessedBy]); // validateCurrentStep and setNotif are stable

  const handlePreviousStep = useCallback(async () => {
    // Show confirmation modal instead of directly going back
    setShowBackModal(true);
  }, []);

  const confirmPreviousStep = useCallback(async () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex < 0) return;
    
    try {
      setIsLoading(true);
      const prevStatus = STATUS_LIST[prevIndex];
      await saveData(prevStatus);
      
      // Jangan update state local, langsung reload halaman
      console.log(`Successfully saved previous step ${prevIndex}, reloading page...`);
      window.location.reload(); // Reload to reflect changes
      setShowBackModal(false);
    } catch (error) {
      console.error("Error going back to previous step:", error);
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
      alert(`Gagal kembali ke step sebelumnya: ${errorMessage}`);
      setIsLoading(false); // Reset loading state on error
    }
    // Jangan set loading false jika sukses karena halaman akan reload
  }, [currentStepIndex, saveData]);

  return {
    formData, setFormData,
    currentStepIndex, setCurrentStepIndex,
    notif, setNotif,
    saveSuccessModalVisible, setSaveSuccessModalVisible,
    showModal, setShowModal,
    activePhotoIndex, setActivePhotoIndex,
    showConfirmModal, setShowConfirmModal,
    showLaporModal, setShowLaporModal,
    showBackModal, setShowBackModal,
    pendingNextStatus, setPendingNextStatus,
    isLoading, setIsLoading,
    isSaving, setIsSaving,
    showRejectModal, setShowRejectModal,
    showSelesaiModal, setShowSelesaiModal,
    rejectReason, setRejectReason,
    selesaiReason, setSelesaiReason,
    confirmedVerifikasi2, setConfirmedVerifikasi2,
    saveData, handleNextStep, handlePreviousStep, confirmPreviousStep,
    validateCurrentStep, updateProcessedBy,
    router
  };
}

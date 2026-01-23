
import { StaffMember } from '../types';
import { API_CONFIG } from '../config/apiConfig';
import { addLog } from './logger';

/**
 * Utility to find staff data in deeply nested objects from Make.com
 */
const extractStaffFromResponse = (result: any): StaffMember[] => {
  if (!result) return [];

  // 1. If it's already an array, return it
  if (Array.isArray(result)) return result;

  // 2. Specific check for the user's reported structure: data.data.member
  // Or common variants: data.member, data.items, etc.
  let target = result;
  
  // Drill down through 'data' wrappers
  if (target.data) target = target.data;
  if (target.data) target = target.data;
  
  // Check for common property names
  const memberData = target.member || target.members || target.items || target.result || target;

  if (Array.isArray(memberData)) {
    return memberData.map((item: any) => item.member || item).filter(Boolean);
  } else if (memberData && typeof memberData === 'object') {
    // If it's a single object (like the "System" user)
    if (memberData.username || memberData.fullName) {
      return [memberData];
    }
  }

  return [];
};

/**
 * Shared synchronization function used by both Login and Admin panels
 */
export const syncStaffDataFromServer = async (): Promise<StaffMember[]> => {
  const url = localStorage.getItem('system_make_webhook_url') || API_CONFIG.MAKE_STAFF_URL;
  
  if (!url || !url.startsWith('http')) {
    throw new Error("Webhook URL is missing or invalid. Please check configuration.");
  }

  addLog({ 
    type: 'REMOTE', 
    status: 'PENDING', 
    action: 'SYNC_STAFF', 
    message: 'Connecting to Make.com...' 
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'SYNC_STAFF', 
        timestamp: new Date().toISOString()
      }),
      mode: 'cors'
    });
    
    if (!response.ok) throw new Error(`Server Error: ${response.status}`);

    const rawText = await response.text();
    
    // Log the raw response for debugging in the Settings > Logs view
    addLog({ 
      type: 'REMOTE', 
      status: 'SUCCESS', 
      action: 'RAW_RESPONSE', 
      message: rawText.substring(0, 500)
    });

    const result = JSON.parse(rawText);
    const processedList = extractStaffFromResponse(result);

    if (processedList.length > 0) {
      localStorage.setItem('app_staff_list_v1', JSON.stringify(processedList));
      // Notify other tabs/components that data has changed
      window.dispatchEvent(new Event('app_data_updated'));
      
      addLog({ 
        type: 'REMOTE', 
        status: 'SUCCESS', 
        action: 'SYNC_STAFF', 
        message: `Successfully synchronized ${processedList.length} staff members.` 
      });
      return processedList;
    } else {
      throw new Error("No valid staff data found in server response.");
    }
  } catch (error: any) {
    addLog({ 
      type: 'REMOTE', 
      status: 'ERROR', 
      action: 'SYNC_STAFF', 
      message: error.message 
    });
    throw error;
  }
};

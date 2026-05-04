import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  onSnapshot,
  orderBy,
  Timestamp,
  serverTimestamp,
  arrayUnion
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { Lead, Client, Activity, LeadStatus } from "../types";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Team Services
export const teamService = {
  getTeam: async () => {
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "users");
      return [];
    }
  },
  addUser: async (userData: any) => {
    try {
      await setDoc(doc(db, "users", userData.uid), {
        ...userData,
        permissions: userData.permissions || [],
        createdAt: serverTimestamp()
      });
      await activityService.logAction({
        user: 'System',
        action: 'added new team member',
        target: userData.displayName || userData.email,
        type: 'update'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "users");
    }
  },
  updateUser: async (uid: string, updates: any) => {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  },
  sendNotification: async (data: any) => {
    try {
      await addDoc(collection(db, "notifications"), {
        ...data,
        readBy: [],
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "notifications");
    }
  },
  markNotificationRead: async (id: string, userId: string) => {
    try {
      const ref = doc(db, "notifications", id);
      await updateDoc(ref, {
        readBy: arrayUnion(userId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  },
  adminCreateUser: async (userData: any) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }
    
    return response.json();
  }
};

// Client Services
export const clientService = {
  getClients: async () => {
    try {
      const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    } catch (error) {
      return [];
    }
  },
  convertLeadToClient: async (lead: Lead) => {
    try {
      const clientData = {
        name: lead.company,
        leadId: lead.id,
        status: 'Onboarding',
        payment: 'Pending',
        teamMember: lead.assignedTo || 'Unassigned',
        ownerId: lead.assignedTo || auth.currentUser?.uid || 'System',
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, "clients"), clientData);
      await updateDoc(doc(db, "leads", lead.id), { status: 'Closed Won' });
      await activityService.logAction({
        action: 'CONVERTED_TO_CLIENT',
        entity: 'lead',
        entityId: lead.id,
        details: { company: lead.company, clientId: docRef.id }
      });
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, "clients");
    }
  }
};

// Leads Services
export const leadsService = {
  getLeads: async (userId?: string, role?: string) => {
    try {
      const leadsRef = collection(db, "leads");
      let q = query(leadsRef, orderBy("updatedAt", "desc"));
      
      if (role === 'Intern' && userId) {
        q = query(leadsRef, where("assignedTo", "==", userId), orderBy("updatedAt", "desc"));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "leads");
      return [];
    }
  },

  addLead: async (lead: Omit<Lead, "id">) => {
    try {
      const data = {
        ...lead,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        notes: lead.notes || []
      };
      const docRef = await addDoc(collection(db, "leads"), data);
      await activityService.logAction({
        action: 'CREATED',
        entity: 'lead',
        entityId: docRef.id,
        details: { title: lead.company, owner: lead.name }
      });
      return { id: docRef.id, ...data };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "leads");
    }
  },

  updateLead: async (id: string, updates: Partial<Lead>) => {
    try {
      const leadRef = doc(db, "leads", id);
      const data = { ...updates, updatedAt: serverTimestamp() };
      await updateDoc(leadRef, data);
      await activityService.logAction({
        action: 'UPDATED',
        entity: 'lead',
        entityId: id,
        details: updates
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${id}`);
    }
  },

  deleteLead: async (id: string) => {
    try {
      await deleteDoc(doc(db, "leads", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `leads/${id}`);
    }
  }
};

// Activity Logs (Simplified internal logging)
export const activityService = {
  logAction: async (action: any) => {
    try {
      await addDoc(collection(db, "activityLogs"), {
        ...action,
        userId: auth.currentUser?.uid,
        userName: auth.currentUser?.displayName || auth.currentUser?.email,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error logging action:", error);
    }
  }
};

// Task Services
export const taskService = {
  getTasks: async (filters?: { relatedId?: string, assignedTo?: string }) => {
    const token = await auth.currentUser?.getIdToken();
    const params = new URLSearchParams(filters as any).toString();
    const response = await fetch(`/api/tasks?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },
  createTask: async (taskData: any) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(taskData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create task');
    }
    return response.json();
  },
  updateTask: async (id: string, updates: any) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  }
};

// Audit Services
export const auditService = {
  getAuditLogs: async (filters?: { entityId?: string, limit?: number }) => {
    const token = await auth.currentUser?.getIdToken();
    const params = new URLSearchParams(filters as any).toString();
    const response = await fetch(`/api/audit?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch audit logs');
    return response.json();
  }
};

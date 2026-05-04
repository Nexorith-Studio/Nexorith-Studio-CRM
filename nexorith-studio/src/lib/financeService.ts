import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  orderBy, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { handleFirestoreError, OperationType } from './services';
import { activityService } from './services';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: any;
  recordedBy: string;
  relatedTo?: string;
}

export const financeService = {
  async addTransaction(data: Omit<Transaction, 'id' | 'recordedBy'>) {
    if (!auth.currentUser) throw new Error('Not authenticated');
    
    try {
      const transactionData = {
        ...data,
        recordedBy: auth.currentUser.uid,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'transactions'), transactionData);
      
      await activityService.logAction({
        action: 'CREATED_TRANSACTION',
        entity: 'transaction',
        entityId: docRef.id,
        details: { type: data.type, amount: data.amount, category: data.category }
      });
      
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    }
  },

  subscribeToTransactions(callback: (transactions: Transaction[]) => void) {
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      callback(transactions);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'transactions');
    });
  },

  async deleteTransaction(id: string) {
    try {
      await deleteDoc(doc(db, 'transactions', id));
      await activityService.logAction({
        action: 'DELETED_TRANSACTION',
        entity: 'transaction',
        entityId: id,
        details: { status: 'deleted' }
      });
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
    }
  }
};

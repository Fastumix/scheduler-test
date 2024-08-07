import React, { useState, useEffect } from 'react';
import { Paper } from '@mui/material';
import {
  Scheduler,
  DayView,
  WeekView,
  MonthView,
  Appointments,
  AppointmentForm,
  AppointmentTooltip,
  EditRecurrenceMenu,
  AllDayPanel,
  Toolbar,
  ViewSwitcher,
  DateNavigator,
} from '@devexpress/dx-react-scheduler-material-ui';
import {
  ViewState,
  EditingState,
  IntegratedEditing,
} from '@devexpress/dx-react-scheduler';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import * as plLocale from './pl.json';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
  const [appointments, setAppointments] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAppointments();
  }, []);
  
  const fetchAppointments = async () => {
    try {
      const appointmentsCollection = collection(db, 'appointments');
      const appointmentsSnapshot = await getDocs(appointmentsCollection);
      const appointmentsList = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: new Date(doc.data().startDate),
        endDate: new Date(doc.data().endDate)
      }));
      setAppointments(appointmentsList);
    } catch (error) {
      console.error("Błąd podczas pobierania spotkań:", error);
    }
  };

  const handleChanges = async ({ added, changed, deleted }) => {
    try {
      let updatedAppointments = [...appointments];
  
      if (added) {
        const newAppointment = {
          ...added,
          startDate: added.startDate ? added.startDate.toISOString() : null,
          endDate: added.endDate ? added.endDate.toISOString() : null
        };
        const docRef = await addDoc(collection(db, "appointments"), newAppointment);
        updatedAppointments.push({ id: docRef.id, ...newAppointment });
      }
  
      if (changed) {
        for (const id in changed) {
          const index = updatedAppointments.findIndex(appointment => appointment.id === id);
          if (index > -1) {
            const updatedAppointment = {
              ...updatedAppointments[index],
              ...changed[id],
              startDate: changed[id].startDate ? new Date(changed[id].startDate).toISOString() : updatedAppointments[index].startDate,
              endDate: changed[id].endDate ? new Date(changed[id].endDate).toISOString() : updatedAppointments[index].endDate
            };
            await updateDoc(doc(db, "appointments", id), updatedAppointment);
            updatedAppointments[index] = updatedAppointment;
          }
        }
      }
  
      if (deleted !== undefined) {
        await deleteDoc(doc(db, "appointments", deleted));
        updatedAppointments = updatedAppointments.filter(appointment => appointment.id !== deleted);
      }
  
      setAppointments(updatedAppointments);
    } catch (error) {
      console.error("Błąd:", error);
    }
  };

  return (
    <Paper>
      <Scheduler 
        data={appointments}
        locale="pl-PL"
        messages={plLocale}
      >
        <ViewState
          currentDate={currentDate}
          onCurrentDateChange={setCurrentDate}
        />
        <EditingState onCommitChanges={handleChanges} />
        <IntegratedEditing />
        <Toolbar />
        <DateNavigator />
        <ViewSwitcher />
        <DayView startDayHour={9} endDayHour={18} />
        <WeekView startDayHour={9} endDayHour={18} />
        <MonthView />
        <AllDayPanel />
        <EditRecurrenceMenu />
        <Appointments />
        <AppointmentTooltip
          showOpenButton
          showDeleteButton
          showCloseButton
        />
        <AppointmentForm
          readOnly={false}
          messages={plLocale}
        />
      </Scheduler>
    </Paper>
  );
}

export default App;
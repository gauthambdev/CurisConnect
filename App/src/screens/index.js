// Assuming you have an index.js file that exports all your screens
export { default as StartScreen } from './StartScreen';
export { default as LoginScreen } from './LoginScreen';
export { default as RegisterScreen } from './RegisterScreen';
export { default as ResetPasswordScreen } from './ResetPasswordScreen';
export { default as DoctorDashboard } from './doctor/DoctorDashboard';
export { default as PatientDashboard } from './patient/PatientDashboard';
export { default as AdminDashboard } from './admin/AdminDashboard';

// patient
export { default as UploadDocScreen } from './patient/UploadDocScreen';
export { default as BookAppointments } from './patient/BookAppointments';
export { default as MedicalHistory } from './patient/MedicalHistory';
export { default as ProfileScreen } from './patient/ProfileScreen';
export { default as QuickDiagnosis} from './patient/QuickDiagnosis';
export { default as UpcomingAppointments} from './patient/UpcomingAppointments';
export { default as PastAppointments } from './patient/PastAppointments';
export { default as Feedback} from './patient/Feedback';
export { default as Pharmacies} from './patient/Pharmacies';
export { default as Hospitals} from './patient/Hospitals';

// doctor
export { default as DocUpcomingAppointments } from './doctor/DocUpcomingAppointments';
export { default as ViewPatients } from './doctor/ViewPatients';
export { default as DocDiagnoses} from './doctor/DocDiagnoses';
export { default as PatientDocs} from './doctor/PatientDocs';
export { default as DocUploadDocScreen} from './doctor/DocUploadDocScreen';
export { default as DocProfileScreen} from './doctor/DocProfileScreen';
export { default as DocPastAppointments } from './doctor/DocPastAppointments';
export { default as DocFeedback } from './doctor/DocFeedback';

//admin
export { default as AddAdmin} from './admin/AddAdmin';
export { default as AddHospital} from './admin/AddHospital';
export { default as AddUser} from './admin/AddUser';
export { default as AddDoctor} from './admin/AddDoctor';
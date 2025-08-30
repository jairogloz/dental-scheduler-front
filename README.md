# Dental Scheduler Frontend

A modern React + TypeScript + Vite application for managing dental appointments with advanced patient search capabilities.

## 🚀 Features

### Patient Management

- **Smart Patient Search**: Autocomplete search with 300ms debouncing
- **Add New Patients**: Quick patient creation modal with validation
- **Real-time Results**: Search patients by name with highlighted matches
- **Keyboard Navigation**: Full arrow key and Enter/Escape support

### Appointment Scheduling

- **Calendar Integration**: Visual appointment management with doctor-based color coding
- **Time Slot Management**: 15-minute interval scheduling
- **Resource Management**: Unit and clinic assignment
- **Mobile Responsive**: Optimized for mobile devices

### Authentication & Security

- **Supabase Integration**: Secure JWT-based authentication
- **Automatic Token Refresh**: Seamless session management
- **Organization-based Access**: Multi-tenant support

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: CSS Modules + React-Select + React-DatePicker
- **HTTP Client**: Axios with interceptors for auth
- **Authentication**: Supabase Auth
- **Calendar**: React-Big-Calendar
- **State Management**: React Hooks + Context

## 📦 Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Configure your environment variables:
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

## 🏃‍♂️ Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

## 🏗️ Project Structure

```
src/
├── api/
│   ├── entities/
│   │   ├── Patient.ts       # Patient API calls and types
│   │   ├── Doctor.ts        # Doctor management
│   │   └── Appointment.ts   # Appointment CRUD
│   └── utils.ts
├── components/
│   ├── PatientSearch/       # 🆕 Patient search components
│   │   ├── PatientSearchAutocomplete.tsx
│   │   ├── AddPatientModal.tsx
│   │   └── index.ts
│   ├── Modal/
│   │   └── Appointment/
│   │       └── AppointmentModal.tsx  # 🔄 Updated with patient search
│   └── Sidebar.tsx
├── lib/
│   ├── apiClient.ts         # 🔄 Axios-based HTTP client
│   └── supabase.ts          # 🔄 Enhanced auth configuration
└── styles/
    └── Modal.css
```

## 🔧 API Integration

### Patient Search

```typescript
GET /api/v1/patients/search?q=searchTerm&limit=100
```

### Create Patient

```typescript
POST /api/v1/patients
{
  "name": "Patient Name",
  "phone": "+1234567890"  // optional
}
```

## 🎨 Component Usage

### Patient Search Autocomplete

```tsx
import { PatientSearchAutocomplete } from "./components/PatientSearch";

<PatientSearchAutocomplete
  selectedPatient={selectedPatient}
  onPatientSelect={(patient) => setSelectedPatient(patient)}
  onAddNewPatient={() => setShowAddModal(true)}
  disabled={false}
  placeholder="Search patients..."
/>;
```

### Add Patient Modal

```tsx
import { AddPatientModal } from "./components/PatientSearch";

<AddPatientModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onPatientCreated={(patient) => handlePatientCreated(patient)}
/>;
```

## 🚀 Recent Updates

### v2.0.0 - Patient Search Feature

- ✅ **Smart Autocomplete**: Real-time patient search with debouncing
- ✅ **Add New Patient**: Modal for quick patient creation
- ✅ **Enhanced UX**: Keyboard navigation, loading states, error handling
- ✅ **Mobile Responsive**: Touch-friendly design
- ✅ **Accessibility**: ARIA labels, screen reader support
- ✅ **Robust API Client**: Axios with automatic token refresh

### Previous Features

- ✅ **Doctor-based Calendar**: Color-coded appointments by doctor
- ✅ **Enhanced Visual Separation**: Borders and shadows for overlapping events
- ✅ **Collapsible Sidebar**: Dark theme navigation with mobile support
- ✅ **Header Dropdown**: User profile menu with logout functionality

## 🔐 Authentication Flow

1. User logs in via Supabase Auth
2. JWT tokens automatically include organization_id (if configured)
3. Axios interceptors handle token refresh automatically
4. API calls include valid Bearer tokens

## 📱 Mobile Support

- Responsive design for all screen sizes
- Touch-friendly interactions
- Auto-collapse sidebar on mobile
- Optimized modal layouts

## 🎯 Development Guidelines

### Code Style

- Use TypeScript for all new components
- Follow React functional component patterns
- Use CSS Modules for styling
- Implement proper error boundaries

### API Integration

- Use the centralized `apiClient` for all HTTP requests
- Handle loading and error states consistently
- Implement proper TypeScript types for all API responses
- Use debouncing for search functionality (300ms recommended)

## 📄 License

This project is proprietary software for dental practice management.

---

Built with ❤️ for modern dental practices

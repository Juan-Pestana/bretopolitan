# Gym Scheduler - Development Tasks

## Phase 1: Project Setup & Infrastructure

### Task 1.1: Initialize Next.js Project

**Description**: Set up the Next.js project with TypeScript, configure folder structure, and install base dependencies.

**User Story**: As a developer, I need a properly configured Next.js project so that I can start building features with a solid foundation.

**Acceptance Criteria**:

- Next.js 14+ project initialized with TypeScript
- Folder structure created: `/app`, `/components`, `/lib`, `/types`
- ESLint and Prettier configured
- Git repository initialized with `.gitignore`

---

### Task 1.2: Set Up Supabase Project

**Description**: Create a Supabase project, configure authentication, and set up environment variables.

**User Story**: As a developer, I need a Supabase backend configured so that I can store data and authenticate users.

**Acceptance Criteria**:

- Supabase project created
- Email/password authentication enabled
- Environment variables set up (`.env.local`)
- Supabase client initialized in Next.js
- Connection test successful

---

### Task 1.3: Create Database Schema

**Description**: Design and implement the database tables for users, bookings, and recurring patterns.

**User Story**: As a developer, I need a well-structured database so that I can store user and booking information reliably.

**Schema**:

```sql
-- users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  flat_number TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('neighbor', 'trainer', 'admin')) DEFAULT 'neighbor',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_parent_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  CONSTRAINT valid_time_slots CHECK (
    EXTRACT(MINUTE FROM start_time) IN (0, 30) AND
    EXTRACT(MINUTE FROM end_time) IN (0, 30)
  )
);

-- Indexes for performance
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_recurring_parent ON bookings(recurring_parent_id);
```

**Acceptance Criteria**:

- All tables created with proper constraints
- Foreign keys and indexes configured
- Test data inserted successfully

---

### Task 1.4: Configure Row-Level Security (RLS)

**Description**: Set up Supabase RLS policies to enforce access control at the database level.

**User Story**: As a developer, I need database-level security so that users can only access and modify their own data.

**Policies**:

- Users can read their own profile
- Users can read all bookings (to see availability)
- Users can insert/delete only their own bookings
- Admins can perform all operations
- Trainers can delete their own bookings (including recurring instances)

**Acceptance Criteria**:

- RLS enabled on all tables
- Policies tested for each user role
- Unauthorized access attempts blocked

---

## Phase 2: Authentication & User Management

### Task 2.1: Build Authentication Pages

**Description**: Create sign-up, login, and logout functionality with email/password.

**User Story**: As a neighbor, I want to register with my email and flat number so that I can access the gym booking system.

**Pages**:

- `/sign-up` - Registration form (email, password, flat number)
- `/login` - Login form
- Logout functionality in header/nav

**Acceptance Criteria**:

- User can register with email, password, and flat number
- User can log in with email and password
- User can log out
- Form validation with error messages
- Profile automatically created in `profiles` table on sign-up

---

### Task 2.2: Implement Protected Routes

**Description**: Create middleware or layout protection to restrict access to authenticated users only.

**User Story**: As a system administrator, I want unauthenticated users redirected to login so that only authorized users can access the booking system.

**Acceptance Criteria**:

- Unauthenticated users redirected to `/login`
- Authenticated users can access dashboard and booking pages
- Session persists across page refreshes
- Redirect to original destination after login

---

### Task 2.3: Create User Profile Page

**Description**: Build a page where users can view their profile information and role.

**User Story**: As a user, I want to see my profile details so that I can verify my flat number and role.

**Acceptance Criteria**:

- Display email, flat number, and role
- Read-only for regular users
- Basic styling with user-friendly layout

---

## Phase 3: Core Booking System (Neighbors)

### Task 3.1: Build Calendar View Component

**Description**: Create a weekly calendar grid showing 30-minute time slots from 6:00 AM to 10:00 PM.

**User Story**: As a neighbor, I want to see a weekly calendar view so that I can identify available time slots for the gym.

**Acceptance Criteria**:

- 7-day view (current week)
- 30-minute time slots (6 AM - 10 PM)
- Color-coded slots:
  - Green: Available
  - Blue: Own booking
  - Gray: Booked by others
  - Orange: Trainer slots
- Responsive design for mobile and desktop

---

### Task 3.2: Implement Date Range Restriction

**Description**: Ensure neighbors can only view and book slots within 7 days from today.

**User Story**: As a neighbor, I can only see and book gym slots up to 7 days in advance so that everyone has fair access.

**Acceptance Criteria**:

- Calendar shows only days 0-6 from current date
- Navigation forward disabled beyond day 7
- API endpoints reject bookings beyond 7 days
- Clear error message if user attempts to bypass restriction

---

### Task 3.3: Create Booking Modal/Form

**Description**: Build a modal or form where users can select start time and duration to create a booking.

**User Story**: As a neighbor, I want to click an available slot and choose my session duration so that I can reserve the gym.

**Acceptance Criteria**:

- Click available slot to open booking form
- Select duration: 30 min, 60 min, 90 min (dropdown)
- Show end time automatically
- "Confirm Booking" button
- Loading state during submission
- Success/error feedback

---

### Task 3.4: Implement Booking Creation Logic

**Description**: Create API route to handle booking creation with validation for neighbor rules.

**User Story**: As a neighbor, when I submit a booking request, the system validates all rules before confirming my reservation.

**Validation Rules**:

- Start time + duration ≤ current date + 7 days
- Duration ≤ 90 minutes
- No existing booking for this user on the same calendar day
- No overlapping bookings in the time range
- Start/end times on :00 or :30

**Acceptance Criteria**:

- POST endpoint `/api/bookings` created
- All validation rules enforced
- Database transaction used to prevent race conditions
- Appropriate error messages returned for each validation failure
- Successful booking returns booking details

---

### Task 3.5: Display User's Bookings

**Description**: Show a list/section of the user's current and upcoming bookings.

**User Story**: As a neighbor, I want to see my upcoming gym reservations so that I can keep track of when I've booked the space.

**Acceptance Criteria**:

- "My Bookings" section on dashboard
- Shows all future bookings for logged-in user
- Displays date, time range, and duration
- Sorted chronologically
- Empty state message if no bookings

---

### Task 3.6: Implement Booking Cancellation

**Description**: Allow users to cancel their own bookings with a confirmation dialog.

**User Story**: As a neighbor, I want to cancel my gym reservation if I can't attend so that others can use that time slot.

**Acceptance Criteria**:

- "Cancel" button on each booking
- Confirmation modal: "Are you sure?"
- DELETE endpoint `/api/bookings/:id`
- Authorization check: user can only cancel own bookings
- Booking removed from database
- Calendar updates immediately
- Success message displayed

---

### Task 3.7: Prevent Double Bookings

**Description**: Implement database constraints and application logic to prevent overlapping bookings.

**User Story**: As a neighbor, I expect the system to prevent conflicts so that I never arrive at the gym to find someone else already there.

**Implementation**:

- Database unique constraint or exclusion constraint on time ranges
- Application-level check before insert
- Transaction with lock to handle concurrent requests

**Acceptance Criteria**:

- Two users cannot book overlapping times
- Clear error message if slot becomes unavailable
- Race condition testing passed

---

### Task 3.8: Enforce One Booking Per Day Rule

**Description**: Validate that neighbors have no more than one booking per calendar day.

**User Story**: As a neighbor, I can only make one gym reservation per day so that everyone has fair access to the facility.

**Acceptance Criteria**:

- Check for existing bookings on same calendar day before creating new booking
- Calendar day based on building's timezone
- Clear error message: "You already have a booking on this day"
- Check applies only to neighbors, not trainers

---

## Phase 4: Admin Functionality

### Task 4.1: Create Admin Dashboard

**Description**: Build an admin-only page to manage users and bookings.

**User Story**: As an admin, I want a dedicated dashboard so that I can manage trainer schedules and oversee all bookings.

**Acceptance Criteria**:

- Route `/admin` accessible only to admin role users
- Sections: "Manage Trainers", "All Bookings", "User Management"
- Navigation between sections
- Non-admin users redirected with error message

---

### Task 4.2: Trainer Booking Functionality (REVISED)

**Description**: Trainers can book their own gym time slots, similar to neighbors but with relaxed restrictions.

**User Story**: As a trainer, I want to book gym slots for my training sessions so that I can schedule time with my clients.

**Booking Rules for Trainers**:

- ✅ Can book up to 4 weeks (28 days) in advance (vs 7 days for neighbors)
- ✅ Can book multiple slots per day (no daily limit like neighbors)
- ✅ Maximum 90 minutes per booking (same as neighbors)
- ✅ Must book in 30-minute increments (:00 or :30)
- ✅ Gym hours: 6:00 AM - 10:00 PM
- ✅ No overlapping bookings (same as all users)

**Acceptance Criteria**:

- ✅ Trainers can access the booking calendar
- ✅ Trainers can book slots within 4-week window
- ✅ Trainers can create multiple bookings per day
- ✅ Calendar navigation limited to 4-week range for trainers
- ✅ Validation enforces trainer-specific rules

**Status**: COMPLETED - Implemented in API validation and CalendarView component

---

### Task 4.3: NOT APPLICABLE (REMOVED)

**Previous Description**: Implement Recurring Booking Generation

**Reason for Removal**: Based on the revised use case, trainers book their own time slots individually rather than having admins create recurring schedules for them. This simplifies the system and gives trainers more flexibility.

If recurring bookings are needed in the future, this task can be re-implemented as an optional feature.

---

### Task 4.4: Enable Viewing All Bookings

**Description**: Create admin view showing all bookings across all users.

**User Story**: As an admin, I want to see all gym bookings so that I can monitor usage and resolve conflicts if needed.

**Acceptance Criteria**:

- Table/list of all bookings
- Columns: User, Flat Number, Date, Time, Duration, Type (regular/recurring)
- Filter by date range
- Search by user name or flat number
- Pagination if many bookings

---

### Task 4.5: Allow Admin to Delete Any Booking

**Description**: Give admins the ability to cancel any booking (for emergencies or conflicts).

**User Story**: As an admin, I want to cancel any booking so that I can handle emergencies or building maintenance.

**Acceptance Criteria**:

- "Delete" button on all bookings in admin view
- Confirmation modal with reason field (optional)
- DELETE endpoint accepts admin authorization
- Booking removed from database
- If recurring child deleted, only that instance removed (not entire series)

---

### Task 4.6: Manage User Roles

**Description**: Allow admin to view all users and change their roles.

**User Story**: As an admin, I want to assign trainer or admin roles to users so that they have appropriate system access.

**Acceptance Criteria**:

- User list table: email, flat number, role
- Dropdown to change role (neighbor, trainer, admin)
- PUT endpoint `/api/admin/users/:id/role`
- Role updated in `profiles` table
- Changes reflected immediately

---

## Phase 5: Trainer Functionality

### Task 5.1: Display Trainer's Recurring Schedule

**Description**: Show trainers their upcoming recurring bookings in a clear format.

**User Story**: As a trainer, I want to see all my scheduled sessions so that I know when I'm expected at the gym.

**Acceptance Criteria**:

- "My Schedule" page for trainers
- Groups bookings by recurring series
- Shows pattern: "Every Monday & Wednesday, 7:00-8:30 AM"
- Lists next 12 weeks of instances
- Different visual style from neighbor bookings

---

### Task 5.2: Enable Trainer to Cancel Single Instance

**Description**: Allow trainers to cancel a single occurrence of their recurring schedule.

**User Story**: As a trainer, I want to cancel a specific session (e.g., I'm sick on one Tuesday) so that my clients know I won't be there.

**Acceptance Criteria**:

- "Cancel This Session" button on individual instances
- Confirmation modal
- DELETE removes only that child booking
- Slot becomes available for neighbors
- Other instances unaffected

---

### Task 5.3: Enable Trainer to Cancel Entire Series

**Description**: Allow trainers to cancel all future bookings in a recurring series.

**User Story**: As a trainer, I want to cancel all my future sessions if I stop working with clients so that the gym space becomes available.

**Acceptance Criteria**:

- "Cancel All Future Sessions" button on recurring series view
- Confirmation modal with warning
- DELETE removes parent + all future child bookings (keeps past bookings for records)
- All future slots become available
- Success message

---

## Phase 6: UI/UX Enhancements

### Task 6.1: Add Loading States

**Description**: Implement spinners and skeleton screens for asynchronous operations.

**User Story**: As a user, I want visual feedback when the app is loading so that I know the system is working.

**Acceptance Criteria**:

- Loading spinner on calendar while fetching bookings
- Skeleton screen for booking list
- Button disabled state during form submission
- Loading overlay on modal during booking creation

---

### Task 6.2: Implement Error Handling & Messages

**Description**: Create consistent error messaging and error boundary components.

**User Story**: As a user, I want clear error messages when something goes wrong so that I understand what happened and what to do next.

**Acceptance Criteria**:

- Toast notifications for success/error
- Specific error messages for each validation failure
- Error boundary component catches React errors
- Network error handling (timeout, offline)
- User-friendly language (no technical jargon)

---

### Task 6.3: Make Calendar Responsive

**Description**: Optimize calendar view for mobile devices.

**User Story**: As a user, I want to use the booking system on my phone so that I can reserve the gym on the go.

**Acceptance Criteria**:

- Calendar readable on mobile screens (320px+)
- Touch-friendly tap targets
- Horizontal scroll for weekly view if needed
- Mobile-optimized booking modal
- Tested on iOS and Android

---

### Task 6.4: Add Timezone Handling

**Description**: Ensure all times are displayed and stored in the building's timezone.

**User Story**: As a user, I want booking times to match my local time so that I don't accidentally book the wrong slot.

**Acceptance Criteria**:

- All times stored in UTC in database
- Times displayed in building's timezone (configurable)
- Daylight saving time handled correctly
- Timezone shown in UI

---

### Task 6.5: Improve Visual Design

**Description**: Apply consistent styling, colors, and branding across the app.

**User Story**: As a user, I want an attractive and professional-looking app so that it's pleasant to use.

**Acceptance Criteria**:

- Design system established (colors, fonts, spacing)
- Tailwind CSS utility classes used consistently
- Accessible color contrast (WCAG AA)
- Hover/active states on interactive elements
- Cohesive look and feel

---

## Phase 7: Testing & Deployment

### Task 7.1: Write Unit Tests for Utilities

**Description**: Test booking validation logic, date calculations, and helper functions.

**User Story**: As a developer, I want unit tests so that I can refactor with confidence.

**Test Coverage**:

- Booking overlap detection
- 7-day advance validation
- Time slot validation (:00 and :30)
- Recurring booking date generation

**Acceptance Criteria**:

- Jest configured
- Test files in `__tests__` folders
- All utility functions covered
- All tests pass

---

### Task 7.2: Write Integration Tests for API Routes

**Description**: Test API endpoints with various scenarios and edge cases.

**User Story**: As a developer, I want integration tests so that I can catch bugs before deployment.

**Test Cases**:

- Create booking: success, validation errors, conflicts
- Cancel booking: own booking, unauthorized attempt
- Recurring bookings: creation, cancellation
- Role-based access control

**Acceptance Criteria**:

- Test database or mocks set up
- All endpoints tested
- Edge cases covered
- All tests pass

---

### Task 7.3: Perform User Acceptance Testing

**Description**: Conduct end-to-end testing with real users (neighbors, trainers, admin).

**User Story**: As a product owner, I want real users to test the system so that I can identify usability issues before launch.

**Acceptance Criteria**:

- Test plan document created
- 3+ users from each role test the system
- Feedback collected and documented
- Critical bugs fixed
- UAT sign-off obtained

---

### Task 7.4: Set Up Vercel Deployment

**Description**: Configure production deployment pipeline on Vercel.

**User Story**: As a developer, I want automated deployment so that changes go live quickly and reliably.

**Acceptance Criteria**:

- Vercel project connected to Git repository
- Environment variables configured in Vercel
- Production Supabase instance set up
- Build succeeds
- Application accessible at production URL

---

### Task 7.5: Configure Production Database

**Description**: Set up production Supabase instance with proper backups and security.

**User Story**: As a system administrator, I want a secure and backed-up database so that user data is protected.

**Acceptance Criteria**:

- Production Supabase project created
- Database schema migrated
- RLS policies applied
- Daily backups enabled
- Connection pooling configured
- Performance monitoring set up

---

### Task 7.6: Create User Documentation

**Description**: Write guides for neighbors, trainers, and admins on how to use the system.

**User Story**: As a user, I want clear instructions so that I can use the booking system without confusion.

**Documents**:

- Getting Started Guide (registration, first booking)
- Neighbor Guide (booking, cancelling)
- Trainer Guide (viewing schedule, cancellations)
- Admin Guide (creating trainer schedules, managing users)

**Acceptance Criteria**:

- All guides written in simple language
- Screenshots included
- Published in app (help section) or as PDF
- Contact info for support provided

---

## Phase 8: Post-Launch

### Task 8.1: Monitor Performance & Errors

**Description**: Set up monitoring and alerting for production issues.

**User Story**: As a developer, I want to know immediately if the app is down or experiencing errors so that I can respond quickly.

**Acceptance Criteria**:

- Error tracking tool integrated (e.g., Sentry)
- Uptime monitoring configured
- Email/SMS alerts for critical issues
- Dashboard for key metrics (bookings/day, active users)

---

### Task 8.2: Gather User Feedback

**Description**: Create a mechanism for users to submit feedback and feature requests.

**User Story**: As a user, I want to suggest improvements so that the app better meets my needs.

**Acceptance Criteria**:

- Feedback form in app (or email link)
- Feedback stored or forwarded to admin
- Users receive acknowledgment
- Feedback reviewed weekly

---

### Task 8.3: Plan Iteration 2

**Description**: Based on feedback, prioritize enhancements for the next release.

**Potential Features**:

- Email notifications
- Waiting list
- Cancellation grace period
- Holiday closures
- Usage reports
- Mobile app

**Acceptance Criteria**:

- Feedback analyzed and categorized
- Top 3-5 features prioritized
- Rough estimates created
- Roadmap communicated to stakeholders

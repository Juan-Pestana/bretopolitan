# Gym Scheduler - Project Overview

## Project Description

A web-based scheduling application for managing reservations of a shared gym space in a residential building. The system supports three user roles (neighbors, trainers, and admins) with different booking capabilities and restrictions.

## Tech Stack

- **Frontend Framework**: Next.js
- **Backend/Database**: Supabase (PostgreSQL + Authentication + Row-Level Security)
- **Deployment**: Vercel
- **Authentication**: Email/Password via Supabase Auth

## User Roles

### 1. Neighbor (Regular User)

Standard residents who want to use the gym space for personal workouts.

### 2. Trainer

Professionals hired by neighbors who need recurring weekly slots to train their clients.

### 3. Admin

Building manager or designated person who manages trainer schedules and oversees the system.

---

## Booking Rules & Limitations

### For Neighbors

| Rule                 | Limitation                                         |
| -------------------- | -------------------------------------------------- |
| **Advance Booking**  | Maximum 7 days in advance from today               |
| **Session Duration** | Maximum 1.5 hours (90 minutes)                     |
| **Daily Limit**      | One reservation per calendar day                   |
| **Time Slots**       | Must use 30-minute blocks (starting at :00 or :30) |
| **Cancellation**     | Can cancel their own reservations at any time      |

**Example**: On Monday October 6th, a neighbor can book slots from October 6th through October 13th, but not October 14th or beyond.

### For Trainers

| Rule                 | Limitation                                                      |
| -------------------- | --------------------------------------------------------------- |
| **Advance Booking**  | Managed by admin only (up to 12 weeks)                          |
| **Session Duration** | No maximum limit                                                |
| **Daily Limit**      | Multiple sessions per day allowed                               |
| **Time Slots**       | Must use 30-minute blocks (starting at :00 or :30)              |
| **Recurring Slots**  | Fixed weekly schedule (e.g., every Monday 6:00-7:00 AM)         |
| **Cancellation**     | Can cancel individual slot instances or entire recurring series |

**Note**: Trainers cannot self-create bookings; admin must set up their recurring schedules.

### For Admins

| Capability                   | Description                                                             |
| ---------------------------- | ----------------------------------------------------------------------- |
| **Create Trainer Schedules** | Set up recurring weekly slots for trainers up to 12 weeks ahead         |
| **Manage All Bookings**      | View, modify, or delete any reservation                                 |
| **User Management**          | Approve, edit, or remove user accounts if needed                        |
| **Override Rules**           | Can create bookings that bypass neighbor restrictions for special cases |

---

## Key Features

### Authentication & Registration

- Email and password-based authentication
- User profile includes:
  - Email address
  - Flat number (apartment/unit number)
  - Role (assigned: neighbor by default, trainer/admin by admin)

### Booking System

- **Calendar View**: Weekly grid showing all available and booked time slots
- **30-Minute Intervals**: All bookings snap to :00 or :30 minute marks
- **Visual Distinction**: Different colors/styles for:
  - Available slots
  - Own bookings
  - Other neighbors' bookings
  - Trainer recurring slots
- **Conflict Prevention**: Database-level constraints prevent double bookings

### Recurring Bookings (Trainers Only)

- Admin creates a recurring pattern (e.g., "Every Tuesday and Thursday, 7:00-8:30 AM")
- System generates individual booking instances for up to 12 weeks
- Trainers can:
  - Cancel a single instance (e.g., skip one Tuesday)
  - Cancel the entire series
- Series do not auto-extend; admin must manually renew after 12 weeks

### Cancellation

- Users can cancel their own bookings
- Trainers can cancel individual recurring instances or full series
- Cancelled slots immediately become available for others

---

## Business Rules

### Validation Rules

1. **Overlapping Prevention**: No two bookings can overlap in time
2. **Future Limit for Neighbors**: Cannot book beyond 7 days from current date
3. **Time Block Alignment**: Start times must be at :00 or :30
4. **Duration Multiples**: All bookings must be in 30-minute increments
5. **One Per Day (Neighbors)**: Only one booking per calendar day (midnight to midnight)
6. **Flat Number Uniqueness**: Each flat number can only be registered once

### Data Integrity

- Bookings must reference a valid user
- Start time must be before end time
- Recurring bookings must have a parent-child relationship
- Deletion of recurring parent should cascade to all children (if series cancelled)

---

## User Flows

### Neighbor Books a Session

1. Neighbor logs in
2. Views calendar (can see next 7 days)
3. Selects an available slot
4. Chooses duration (up to 1.5 hours)
5. Confirms booking
6. System validates: not more than 7 days ahead, no existing booking that day, slot available
7. Booking confirmed

### Admin Creates Trainer Schedule

1. Admin logs in
2. Navigates to "Manage Trainers"
3. Selects trainer
4. Defines recurring pattern:
   - Day(s) of week
   - Start time
   - End time
   - Number of weeks (up to 12)
5. System generates individual bookings
6. Trainer can now see their schedule

### Trainer Cancels a Session

1. Trainer logs in
2. Views their bookings
3. Selects a specific date or "entire series"
4. Confirms cancellation
5. Slot(s) become available immediately

---

## Future Enhancements (Out of Scope for MVP)

- Email notifications for upcoming reservations
- Reminder system (24 hours before booking)
- Waiting list for popular time slots
- Reporting dashboard for admin (usage statistics)
- Grace period for cancellations (e.g., no cancellations within 2 hours)
- Holiday/maintenance closure management
- Mobile app version

---

## Success Metrics

- No double-bookings or conflicts
- Clear visibility of availability for all users
- Fair access: no single user monopolizes the gym
- Reduced administrative overhead for managing trainer schedules
- Easy cancellation process with immediate slot release

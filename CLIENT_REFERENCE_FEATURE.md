# Client Reference Feature - Summary

## Overview

Added an optional `client_reference` field to bookings, allowing trainers to note which client they'll be training during a booking session.

## Changes Made

### 1. Database Schema (`add-client-reference.sql`)

Added a new optional text column to the `bookings` table:

```sql
ALTER TABLE bookings
ADD COLUMN client_reference TEXT;
```

**To apply**: Run this SQL script in your Supabase SQL Editor.

### 2. API Updates (`src/app/api/bookings/route.ts`)

- **Request parsing**: Added `client_reference` to the body destructuring
- **Database insert**: Included `client_reference` in the booking insert operation
- Field is optional and will be stored as `null` if not provided

### 3. Booking Modal (`src/components/BookingModal.tsx`)

- **New state**: Added `clientReference` state variable
- **Trainer-only field**: Shows an input field for "Client" only when `userRole === 'trainer'`
- **Form submission**: Includes `client_reference` in the API request
- **Reset on close**: Clears the field when modal closes
- **UI**: Simple text input with 100 character limit and helpful placeholder

### 4. Dashboard Display (`src/app/dashboard/page.tsx`)

- **Type definition**: Added `client_reference?: string | null` to the `Booking` interface
- **Display logic**: Shows client reference in "My Bookings" card items
- **Styling**: Displays in blue text below the duration information
- **Conditional rendering**: Only shows when `client_reference` exists

## User Experience

### For Trainers

1. When creating a booking, trainers see an optional "Client" field
2. They can enter a client name or reference (e.g., "John Doe", "Client #123")
3. The field is optional - can be left blank
4. In "My Bookings" card, the client reference appears below the time/duration info

### For Neighbors & Admins

- The client reference field does **not** appear in their booking modal
- They won't see this field when creating bookings

### Calendar View

- Client references are **not displayed** on the calendar events
- This keeps the calendar clean and focused on time slots
- References are only visible in the "My Bookings" list

## Field Specifications

- **Type**: Text (optional)
- **Max length**: 100 characters
- **Default**: NULL
- **Visible to**: Only the booking owner (in their "My Bookings" list)
- **Available for**: Trainers only (in booking form)

## Example Usage

A trainer's booking in "My Bookings" might look like:

```
Fri, Jan 12
9:00 AM - 10:00 AM
60 minutes
Client: Sarah Johnson
[Cancel]
```

## Database Migration

**Important**: You need to run the SQL migration before testing:

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `add-client-reference.sql`
3. Click Run

The column will be added to all existing bookings as `NULL`, which is fine since it's optional.

## Testing Checklist

- [ ] Run the database migration
- [ ] Log in as a trainer
- [ ] Create a booking with a client reference
- [ ] Create a booking without a client reference
- [ ] Verify client reference appears in "My Bookings" card
- [ ] Verify client reference does NOT appear in calendar view
- [ ] Log in as a neighbor
- [ ] Verify client field does NOT appear in booking modal
- [ ] Cancel a trainer booking with client reference

## Future Enhancements (Optional)

If needed in the future, you could:

- Add client management system (store actual client records)
- Link bookings to client database entries
- Show trainer's client list as a dropdown
- Add client analytics/reports for trainers
- Export booking history with client references

## Cleanup

After confirming everything works, you can delete:

- `add-client-reference.sql` (after running it in Supabase)
- `CLIENT_REFERENCE_FEATURE.md` (this file)

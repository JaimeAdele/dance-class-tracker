# Manual Testing Guide

This document provides comprehensive test cases for manual testing of the Class Attendance Tracker application.

## Table of Contents
- [Student Management Tests](#student-management-tests)
- [Package Management Tests](#package-management-tests)
- [Integration Tests](#integration-tests)
- [Edge Cases and Error Handling](#edge-cases-and-error-handling)

---

## Student Management Tests

### Prerequisites
- Be logged in as an instructor or owner
- Navigate to the Instructor Dashboard
- Locate the "Student Management" section

### Test 1: Create Student Account

**Test Case 1.1: Create with All Fields**
1. Click "Add Student" button
2. Fill in all fields:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john.doe.test@example.com"
   - Phone: "555-123-4567"
   - Password: "TestPass123"
   - Confirm Password: "TestPass123"
3. Click "Create"
4. **Expected:** Success message, student appears in list immediately
5. **Verify:** Student shows with name "Doe, John", email, phone, 0 active packages, 0 classes

**Test Case 1.2: Create with Required Fields Only**
1. Click "Add Student" button
2. Fill in only required fields:
   - First Name: "Jane"
   - Last Name: "Smith"
   - Email: "jane.smith.test@example.com"
   - Password: "TestPass456"
   - Confirm Password: "TestPass456"
3. Leave phone blank
4. Click "Create"
5. **Expected:** Success, student appears with "-" for phone
6. **Verify:** All other fields populated correctly

**Test Case 1.3: Email Validation**
1. Click "Add Student"
2. Enter invalid email: "notanemail"
3. Fill other required fields
4. Click "Create"
5. **Expected:** Error message "Please enter a valid email address"
6. **Verify:** Form not submitted, stays open

**Test Case 1.4: Password Validation**
1. Click "Add Student"
2. Enter password less than 8 characters: "Short1"
3. Fill other required fields
4. Click "Create"
5. **Expected:** Error message about password length
6. **Verify:** Form not submitted

**Test Case 1.5: Password Mismatch**
1. Click "Add Student"
2. Password: "TestPass123"
3. Confirm Password: "TestPass456"
4. Fill other required fields
5. Click "Create"
6. **Expected:** Error "Passwords do not match"
7. **Verify:** Form not submitted

**Test Case 1.6: Duplicate Email**
1. Click "Add Student"
2. Use email from Test 1.1: "john.doe.test@example.com"
3. Fill other required fields
4. Click "Create"
5. **Expected:** Error "A user with this email already exists"
6. **Verify:** Form not submitted

**Test Case 1.7: Required Field Validation**
1. Click "Add Student"
2. Leave First Name blank
3. Fill other fields
4. Click "Create"
5. **Expected:** Error "First name is required"
6. Repeat for Last Name, Email, Password
7. **Verify:** Each shows appropriate error

### Test 2: Edit Student Information

**Test Case 2.1: Edit Name**
1. Find student "Doe, John" in list
2. Click "Edit" button
3. **Verify:** Dialog shows current information
4. **Verify:** Email is read-only (displayed as text, not input)
5. **Verify:** No password fields shown
6. Change First Name to "Jonathan"
7. Click "Update"
8. **Expected:** Success, list updates to "Doe, Jonathan"
9. **Verify:** Email unchanged

**Test Case 2.2: Edit Phone**
1. Edit student "Smith, Jane" (created without phone)
2. Add Phone: "555-987-6543"
3. Click "Update"
4. **Expected:** Success, phone appears in list
5. Edit same student again
6. Clear phone field
7. Click "Update"
8. **Expected:** Phone shows as "-" in list

**Test Case 2.3: Edit Multiple Fields**
1. Edit any student
2. Change First Name, Last Name, and Phone
3. Click "Update"
4. **Expected:** All changes saved
5. **Verify:** Search still works with new name

**Test Case 2.4: Cancel Edit**
1. Edit any student
2. Make changes to fields
3. Click "Cancel"
4. **Expected:** Dialog closes, no changes saved
5. **Verify:** Student data unchanged in list

### Test 3: Delete Student

**Test Case 3.1: Delete Student Without Packages**
1. Find student with 0 active packages
2. Click "Delete" button
3. **Expected:** Confirmation dialog appears
4. **Verify:** Shows student name and email
5. **Verify:** No warning about active packages
6. Click "OK" to confirm
7. **Expected:** Student removed from list immediately
8. **Verify:** Student count decreases

**Test Case 3.2: Delete Student With Active Packages**
1. Create a student and assign them a package (see Package Management tests)
2. Click "Delete" on that student
3. **Expected:** Confirmation dialog with WARNING
4. **Verify:** Message says "This student has active packages. Deleting will also delete their packages and attendance records."
5. Click "Cancel"
6. **Expected:** Student not deleted
7. Click "Delete" again, confirm
8. **Expected:** Student and their packages deleted
9. **Verify:** Package no longer appears in Package Management

**Test Case 3.3: Cancel Delete**
1. Click "Delete" on any student
2. Click "Cancel" in confirmation
3. **Expected:** Dialog closes, student not deleted
4. **Verify:** Student still in list

### Test 4: Search and Filter

**Test Case 4.1: Search by First Name**
1. In search box, type first name of existing student (e.g., "John")
2. **Expected:** List filters to show only matching students
3. **Verify:** Count shows "Showing X of Y students"
4. Clear search
5. **Expected:** Full list returns

**Test Case 4.2: Search by Last Name**
1. Search for last name (e.g., "Doe")
2. **Expected:** Matching students shown
3. **Verify:** Search is case-insensitive

**Test Case 4.3: Search by Email**
1. Search for email or part of email
2. **Expected:** Matching students shown
3. Test partial email (e.g., "john.doe")
4. **Expected:** Still finds student

**Test Case 4.4: Search with No Results**
1. Search for non-existent name: "ZZZNotFound"
2. **Expected:** Empty state message "No students match your search."
3. **Verify:** No students shown
4. Clear search
5. **Expected:** Students return

**Test Case 4.5: Sort by Name**
1. Select "Sort by Name" from dropdown
2. **Expected:** Students sorted alphabetically by last name
3. **Verify:** "Doe, John" comes before "Smith, Jane"

**Test Case 4.6: Sort by Date Added**
1. Select "Sort by Date Added"
2. **Expected:** Most recently added students appear first
3. **Verify:** Newest student at top

### Test 5: Display and UI

**Test Case 5.1: Empty State**
1. If no students exist, verify empty state
2. **Expected:** Message "No students found. Create your first student account above."
3. **Verify:** Table not shown, helpful message displayed

**Test Case 5.2: Package Summary Display**
1. Create student with no packages
2. **Verify:** Shows 0 active packages, 0 classes (gray color)
3. Assign package with 10 classes
4. **Verify:** Shows 1 active package, 10 classes (green color)
5. Mark attendance to reduce to 2 classes remaining
6. **Verify:** Classes show in red color

**Test Case 5.3: Unlimited Package Display**
1. Assign unlimited package to student
2. **Expected:** Classes Remaining shows "Unlimited" in purple

**Test Case 5.4: Loading State**
1. Refresh page
2. **Expected:** Spinner shows while loading
3. **Verify:** List appears after loading

**Test Case 5.5: Mobile Responsive**
1. Resize browser to mobile width (< 768px)
2. **Verify:** Table scrolls horizontally if needed
3. **Verify:** All buttons accessible
4. **Verify:** Search and sort stack vertically

---

## Package Management Tests

### Prerequisites
- Be logged in as an instructor or owner
- Navigate to Instructor Dashboard
- Have at least one student created
- Have at least one package type created

### Test 6: Assign Package to Student

**Test Case 6.1: Assign Fixed Count Package**
1. Click "Assign Package" button in Package Management section
2. Select student from dropdown
3. Select package type "10 Class Package" (or similar fixed count)
4. Enter Purchase Date (today)
5. Enter Amount Paid: "150.00"
6. Select Payment Method: "cash"
7. Enter Payment ID: "CASH-001" (optional)
8. Click "Assign Package"
9. **Expected:** Success, package appears in student's row
10. **Verify:** Classes Remaining shows correct count (10)
11. **Verify:** Expiration date calculated correctly based on package type

**Test Case 6.2: Assign Unlimited Package**
1. Assign unlimited package to student
2. **Expected:** Package created successfully
3. **Verify:** Classes Remaining shows "Unlimited"
4. **Verify:** Expiration date set based on package duration

**Test Case 6.3: Assign Multiple Packages to Same Student**
1. Assign first package to student
2. Assign second package to same student
3. **Expected:** Both packages appear
4. **Verify:** Total classes remaining is sum of both
5. **Verify:** Active packages count is 2

**Test Case 6.4: Required Field Validation**
1. Click "Assign Package"
2. Leave student blank, fill other fields
3. Click "Assign"
4. **Expected:** Error "Please select a student"
5. Repeat for package type, amount paid
6. **Verify:** Each required field validated

**Test Case 6.5: Amount Paid Validation**
1. Try to assign package with negative amount
2. **Expected:** Validation error or prevented
3. Try with non-numeric value
4. **Expected:** Field validation error

### Test 7: Edit Package

**Test Case 7.1: Edit Payment Information**
1. Expand student row to see packages
2. Click "Edit" on a package
3. **Verify:** Form pre-filled with current data
4. Change Amount Paid to "175.00"
5. Change Payment Method to "venmo"
6. Change Payment ID to "VENMO-123"
7. Click "Update"
8. **Expected:** Package updated successfully
9. **Verify:** New payment info displayed

**Test Case 7.2: Edit Classes Remaining**
1. Edit package
2. Change Classes Remaining (e.g., from 10 to 8)
3. Click "Update"
4. **Expected:** Classes remaining updated
5. **Verify:** Total in student row updates
6. **Verify:** Color coding updates if threshold crossed

**Test Case 7.3: Edit Expiration Date**
1. Edit package
2. Change expiration date to future date
3. Click "Update"
4. **Expected:** Expiration updated
5. **Verify:** Package still shows as active
6. Change to past date
7. **Expected:** Status changes to "expired"

**Test Case 7.4: Cannot Edit Package Type or Student**
1. Edit package
2. **Verify:** Package Type is read-only or not editable
3. **Verify:** Student is not changeable
4. **Verify:** Only payment details, classes, and dates editable

**Test Case 7.5: Cancel Edit**
1. Edit package
2. Make changes
3. Click "Cancel"
4. **Expected:** Changes not saved
5. **Verify:** Original data unchanged

### Test 8: Delete Package

**Test Case 8.1: Delete Package with Confirmation**
1. Find package in student's package list
2. Click "Delete"
3. **Expected:** Confirmation dialog shows:
   - Student name
   - Package type name
   - Classes remaining
   - Warning "This action cannot be undone"
4. Click "Cancel"
5. **Expected:** Package not deleted
6. Click "Delete" again, confirm
7. **Expected:** Package removed
8. **Verify:** Student's total classes updated
9. **Verify:** Active package count decreased

**Test Case 8.2: Delete Last Package**
1. Delete all packages from a student
2. **Expected:** Student shows 0 active packages, 0 classes
3. **Verify:** No errors occur

### Test 9: Package Filters and Views

**Test Case 9.1: Filter All Students**
1. Select "All Students" filter
2. **Expected:** Shows all students regardless of package status
3. **Verify:** Students with and without packages shown

**Test Case 9.2: Filter Active Packages**
1. Select "With Active Packages" filter
2. **Expected:** Only students with active packages shown
3. **Verify:** Students with 0 packages hidden

**Test Case 9.3: Filter Low Balance**
1. Create student with package having ≤4 classes
2. Select "Low Balance" filter
3. **Expected:** Only students with ≤4 classes shown
4. **Verify:** Students with 5+ classes hidden

**Test Case 9.4: Filter Expiring Soon**
1. Create package expiring within 14 days
2. Select "Expiring Soon" filter
3. **Expected:** Students with packages expiring ≤14 days shown
4. **Verify:** Non-expiring packages hidden

**Test Case 9.5: Expand/Collapse Package Details**
1. Click arrow next to student name
2. **Expected:** Package list expands showing all packages
3. **Verify:** Shows package name, classes, expiration, status
4. Click arrow again
5. **Expected:** Packages collapse

### Test 10: Package Status Indicators

**Test Case 10.1: Active Package Status**
1. Create package with classes remaining > 0 and not expired
2. **Expected:** Status badge shows "Active" in green
3. **Verify:** Student name shows in green or yellow based on balance

**Test Case 10.2: Expired Package Status**
1. Edit package to have expiration date in past
2. **Expected:** Status badge shows "Expired" in yellow
3. **Verify:** Does not count in active packages

**Test Case 10.3: Depleted Package Status**
1. Use package until classes_remaining = 0
2. **Expected:** Status badge shows "Depleted" in gray
3. **Verify:** Does not count in active packages

**Test Case 10.4: Expiration Warnings**
1. Package expiring today
2. **Expected:** "Expires today" in red
3. Package expiring tomorrow
4. **Expected:** "Expires tomorrow" in red
5. Package expiring in 5 days
6. **Expected:** "Expires in 5 days" in red
7. Package expiring in 10 days
8. **Expected:** "Expires in 10 days" in yellow
9. Package expiring in 30 days
10. **Expected:** Shows date in gray

---

## Integration Tests

### Test 11: Student + Package Workflow

**Test Case 11.1: New Student Onboarding**
1. Create new student "Test User"
2. **Verify:** Shows 0 packages, 0 classes
3. Assign package to student
4. **Verify:** Package appears immediately
5. **Verify:** Classes count updates
6. Edit student name
7. **Verify:** Package still associated correctly

**Test Case 11.2: Package Expiration Flow**
1. Assign package with 7-day expiration
2. **Verify:** Status "active", expiration warning shown
3. Edit expiration to yesterday
4. Refresh page
5. **Expected:** Package shows as "expired"
6. **Verify:** Does not count in active packages
7. **Verify:** Classes still visible

**Test Case 11.3: Multi-Package Student**
1. Assign 3 different packages to one student
2. **Expected:** All 3 packages shown when expanded
3. **Verify:** Total classes is sum of all active packages
4. **Verify:** Active package count is correct
5. Edit one package
6. **Verify:** Only that package changes
7. Delete one package
8. **Verify:** Totals recalculate correctly

**Test Case 11.4: Search with Packages**
1. Search for student with packages
2. **Expected:** Package count visible in search results
3. Expand student
4. **Expected:** Packages load and display
5. Edit package while search active
6. **Expected:** Updates correctly without losing search

---

## Edge Cases and Error Handling

### Test 12: Network and Error Handling

**Test Case 12.1: Slow Network**
1. Throttle network in browser DevTools
2. Create student
3. **Expected:** Loading state shows
4. **Verify:** Eventually completes or times out gracefully

**Test Case 12.2: Offline Mode**
1. Disconnect network
2. Try to create student
3. **Expected:** Error message about connectivity
4. Reconnect
5. Retry
6. **Expected:** Success

**Test Case 12.3: Session Timeout**
1. Leave app open for extended period
2. Try to create/edit student
3. **Expected:** Handles expired session gracefully
4. **Verify:** Redirects to login if needed

### Test 13: Business Rules

**Test Case 13.1: Role-Based Access**
1. Log in as instructor
2. **Verify:** Can access student management
3. Log in as student
4. **Verify:** Cannot access student management
5. **Verify:** Only sees own packages

**Test Case 13.2: Business Isolation**
1. Create student in Business A
2. Log in as instructor from Business B
3. **Expected:** Cannot see Business A's students
4. **Verify:** RLS prevents cross-business access

**Test Case 13.3: Data Integrity**
1. Delete student with packages
2. **Verify:** Packages are deleted (cascade)
3. Query database directly if possible
4. **Verify:** No orphaned records

### Test 14: UI/UX Edge Cases

**Test Case 14.1: Very Long Names**
1. Create student with 50-character first and last name
2. **Expected:** Accepts (within limit)
3. **Verify:** Displays correctly in table
4. Try 51 characters
5. **Expected:** Validation error

**Test Case 14.2: Special Characters**
1. Create student with name "O'Brien-Smith"
2. **Expected:** Accepts special characters
3. **Verify:** Search finds with apostrophe and hyphen
4. Create with Unicode: "José García"
5. **Expected:** Handles correctly

**Test Case 14.3: Many Students Performance**
1. Create 50+ students
2. **Expected:** List performs well
3. **Verify:** Search responsive
4. **Verify:** Pagination or virtual scrolling if implemented

**Test Case 14.4: Many Packages Per Student**
1. Assign 10+ packages to one student
2. **Expected:** All displayed when expanded
3. **Verify:** Scrolling works
4. **Verify:** No layout issues

### Test 15: Validation Edge Cases

**Test Case 15.1: Email Edge Cases**
- "test+alias@example.com" (with + symbol)
- "test@subdomain.example.com" (subdomain)
- "test@example.co.uk" (multi-part TLD)
- All should be accepted

**Test Case 15.2: Phone Edge Cases**
- "555-123-4567" (with dashes)
- "(555) 123-4567" (with parens)
- "5551234567" (no formatting)
- "555 123 4567" (with spaces)
- All should be accepted

**Test Case 15.3: Monetary Edge Cases**
1. Amount: "0.00" - Should accept
2. Amount: "999999.99" - Should accept
3. Amount: "10.5" - Should format to "10.50"
4. Amount: "10.999" - Should round or reject

---

## Test Data Cleanup

After completing tests, clean up test data:

1. Delete all test students (emails ending in .test@example.com)
2. Delete associated packages
3. Delete any test package types created
4. Verify database is clean
5. Check for orphaned records

---

## Regression Testing Checklist

When making changes to student or package management, re-run:

### Critical Path Tests
- [ ] Test 1.1: Create student with all fields
- [ ] Test 2.1: Edit student name
- [ ] Test 3.1: Delete student without packages
- [ ] Test 6.1: Assign fixed count package
- [ ] Test 7.1: Edit payment information
- [ ] Test 8.1: Delete package
- [ ] Test 11.1: New student onboarding workflow

### Data Integrity Tests
- [ ] Test 3.2: Delete student with packages (cascade)
- [ ] Test 11.3: Multi-package calculations
- [ ] Test 13.3: No orphaned records

### UI/UX Tests
- [ ] Test 4.1-4.6: All search and filter tests
- [ ] Test 9.1-9.5: All package filter tests
- [ ] Test 5.5: Mobile responsive

---

## Bug Reporting Template

If you find issues during testing, document them with:

```
**Bug Title:** [Short description]

**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshots:**
[If applicable]

**Environment:**
- Browser:
- Device:
- User Role:
- Test Data:

**Severity:** [Critical/High/Medium/Low]

**Notes:**
[Any additional context]
```

---

## Testing Sign-Off

Once all tests pass, complete this checklist:

- [ ] All Student Management tests passed (Test 1-5)
- [ ] All Package Management tests passed (Test 6-10)
- [ ] All Integration tests passed (Test 11)
- [ ] All Edge Case tests passed (Test 12-15)
- [ ] Mobile responsive verified
- [ ] Performance acceptable with realistic data volume
- [ ] No console errors
- [ ] No database integrity issues
- [ ] Test data cleaned up

**Tested By:** _______________
**Date:** _______________
**Sign-Off:** _______________

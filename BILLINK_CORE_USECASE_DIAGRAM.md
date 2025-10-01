# Billink System - Core Use Case Diagram

## Core Use Case Diagram with Include and Extend Relationships

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                    BILLINK SYSTEM                           │
                    └─────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │   ADMIN    │ │  ENCODER    │ │  FINANCE    │
            │            │ │             │ │  OFFICER    │
            └─────────────┘ └─────────────┘ └─────────────┘
                    │               │               │
                    ▼               ▼               ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │   CASHIER   │ │  CUSTOMER   │ │             │
            │             │ │             │ │             │
            └─────────────┘ └─────────────┘ └─────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CORE USE CASES                                        │
│                                                                                 │
│  UC1: User Login        UC2: Manage Customers    UC3: Process Bills            │
│  UC4: Process Payments  UC5: Generate Reports   UC6: Manage Employees          │
│  UC7: System Settings   UC8: View Dashboard     UC9: Meter Reading            │
│  UC10: Payment Proof Review                                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           INCLUDE RELATIONSHIPS                                │
│                                                                                 │
│  UC1 <<include>> UC11: Validate Credentials                                     │
│  UC2 <<include>> UC12: Validate Customer Data                                  │
│  UC3 <<include>> UC13: Calculate Bill Amount                                   │
│  UC4 <<include>> UC14: Validate Payment                                        │
│  UC5 <<include>> UC15: Generate Report Data                                    │
│  UC6 <<include>> UC16: Validate Employee Data                                  │
│  UC7 <<include>> UC17: Validate Settings                                       │
│  UC8 <<include>> UC18: Load Dashboard Data                                     │
│  UC9 <<include>> UC19: Validate Meter Reading                                   │
│  UC10 <<include>> UC20: Validate Payment Proof                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           EXTEND RELATIONSHIPS                                 │
│                                                                                 │
│  UC1 <<extend>> UC21: Password Reset (when forgot password)                   │
│  UC1 <<extend>> UC22: Account Lockout (when multiple failed attempts)          │
│  UC2 <<extend>> UC23: Customer Registration (when new customer)                │
│  UC3 <<extend>> UC24: Bill Dispute (when customer disputes bill)               │
│  UC4 <<extend>> UC25: Payment Refund (when payment error)                       │
│  UC5 <<extend>> UC26: Export Report (when user wants to export)                │
│  UC6 <<extend>> UC27: Employee Termination (when employee leaves)              │
│  UC7 <<extend>> UC28: System Maintenance (when system needs update)             │
│  UC8 <<extend>> UC29: Real-time Notifications (when updates available)        │
│  UC9 <<extend>> UC30: Meter Reading Correction (when reading error)           │
│  UC10 <<extend>> UC31: Payment Proof Rejection (when proof invalid)            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ROLE-SPECIFIC ACCESS                                    │
│                                                                                 │
│  ADMIN:                                                                         │
│  ✓ UC1: User Login           ✓ UC2: Manage Customers        ✓ UC6: Manage Employees │
│  ✓ UC3: Process Bills       ✓ UC5: Generate Reports        ✓ UC7: System Settings │
│  ✓ UC8: View Dashboard      ✓ UC10: Payment Proof Review                       │
│                                                                                 │
│  ENCODER:                                                                       │
│  ✓ UC1: User Login           ✓ UC3: Process Bills           ✓ UC5: Generate Reports │
│  ✓ UC8: View Dashboard       ✓ UC9: Meter Reading                               │
│                                                                                 │
│  FINANCE OFFICER:                                                              │
│  ✓ UC1: User Login           ✓ UC4: Process Payments        ✓ UC5: Generate Reports │
│  ✓ UC8: View Dashboard       ✓ UC10: Payment Proof Review                       │
│                                                                                 │
│  CASHIER:                                                                       │
│  ✓ UC1: User Login           ✓ UC4: Process Payments        ✓ UC5: Generate Reports │
│  ✓ UC8: View Dashboard       ✓ UC10: Payment Proof Review                       │
│                                                                                 │
│  CUSTOMER:                                                                      │
│  ✓ UC1: User Login           ✓ UC4: Process Payments        ✓ UC5: Generate Reports │
│  ✓ UC8: View Dashboard                                                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Detailed Core Use Case Descriptions

### Primary Use Cases:

**UC1: User Login**
- **Primary Actor:** All Users
- **Goal:** Authenticate user and grant system access
- **Preconditions:** User has valid credentials
- **Main Flow:** 
  1. User enters email and password
  2. System validates credentials
  3. System redirects to appropriate dashboard
- **Postconditions:** User is authenticated and logged in
- **Includes:** UC11 (Validate Credentials)
- **Extends:** UC21 (Password Reset), UC22 (Account Lockout)

**UC2: Manage Customers**
- **Primary Actor:** Admin
- **Goal:** Manage customer accounts and information
- **Preconditions:** Admin is authenticated
- **Main Flow:**
  1. Admin accesses customer management
  2. Admin views customer list
  3. Admin performs customer operations (add/edit/delete)
- **Postconditions:** Customer data is updated
- **Includes:** UC12 (Validate Customer Data)
- **Extends:** UC23 (Customer Registration)

**UC3: Process Bills**
- **Primary Actor:** Encoder, Admin
- **Goal:** Create and process customer bills
- **Preconditions:** Meter readings are available
- **Main Flow:**
  1. Select customer
  2. Enter meter readings
  3. Calculate consumption and amount
  4. Generate bill
- **Postconditions:** Bill is created and stored
- **Includes:** UC13 (Calculate Bill Amount)
- **Extends:** UC24 (Bill Dispute)

**UC4: Process Payments**
- **Primary Actor:** Cashier, Customer
- **Goal:** Process customer payments
- **Preconditions:** Valid bill exists
- **Main Flow:**
  1. Select bill for payment
  2. Enter payment details
  3. Process payment
  4. Update bill status
- **Postconditions:** Payment is recorded
- **Includes:** UC14 (Validate Payment)
- **Extends:** UC25 (Payment Refund)

**UC5: Generate Reports**
- **Primary Actor:** All Users (role-specific)
- **Goal:** Generate system reports
- **Preconditions:** User is authenticated
- **Main Flow:**
  1. Select report type
  2. Set report parameters
  3. Generate report
  4. Display results
- **Postconditions:** Report is generated
- **Includes:** UC15 (Generate Report Data)
- **Extends:** UC26 (Export Report)

**UC6: Manage Employees**
- **Primary Actor:** Admin
- **Goal:** Manage employee accounts and roles
- **Preconditions:** Admin is authenticated
- **Main Flow:**
  1. Access employee management
  2. View employee list
  3. Perform employee operations
- **Postconditions:** Employee data is updated
- **Includes:** UC16 (Validate Employee Data)
- **Extends:** UC27 (Employee Termination)

**UC7: System Settings**
- **Primary Actor:** Admin
- **Goal:** Configure system parameters
- **Preconditions:** Admin is authenticated
- **Main Flow:**
  1. Access system settings
  2. Modify configuration
  3. Save changes
- **Postconditions:** Settings are updated
- **Includes:** UC17 (Validate Settings)
- **Extends:** UC28 (System Maintenance)

**UC8: View Dashboard**
- **Primary Actor:** All Users
- **Goal:** Access role-specific dashboard
- **Preconditions:** User is authenticated
- **Main Flow:**
  1. User logs in
  2. System loads appropriate dashboard
  3. User views relevant information
- **Postconditions:** Dashboard is displayed
- **Includes:** UC18 (Load Dashboard Data)
- **Extends:** UC29 (Real-time Notifications)

**UC9: Meter Reading**
- **Primary Actor:** Encoder
- **Goal:** Input meter readings for billing
- **Preconditions:** Encoder is authenticated
- **Main Flow:**
  1. Select customer
  2. Enter current meter reading
  3. Validate reading
  4. Save reading
- **Postconditions:** Meter reading is recorded
- **Includes:** UC19 (Validate Meter Reading)
- **Extends:** UC30 (Meter Reading Correction)

**UC10: Payment Proof Review**
- **Primary Actor:** Admin, Cashier, Finance Officer
- **Goal:** Review and approve payment proofs
- **Preconditions:** Payment proof is submitted
- **Main Flow:**
  1. Access payment proof
  2. Review proof details
  3. Approve or reject
  4. Update status
- **Postconditions:** Payment proof status is updated
- **Includes:** UC20 (Validate Payment Proof)
- **Extends:** UC31 (Payment Proof Rejection)

### Include Use Cases (Supporting Functions):

**UC11: Validate Credentials**
- **Purpose:** Verify user login credentials
- **Flow:** Check username/password → Return validation result

**UC12: Validate Customer Data**
- **Purpose:** Ensure customer information is valid
- **Flow:** Check required fields → Validate format → Return result

**UC13: Calculate Bill Amount**
- **Purpose:** Calculate bill amount based on consumption
- **Flow:** Get consumption → Apply rates → Calculate total

**UC14: Validate Payment**
- **Purpose:** Verify payment information
- **Flow:** Check payment details → Validate amount → Return result

**UC15: Generate Report Data**
- **Purpose:** Process and format report data
- **Flow:** Query database → Format data → Return results

**UC16: Validate Employee Data**
- **Purpose:** Ensure employee information is valid
- **Flow:** Check required fields → Validate format → Return result

**UC17: Validate Settings**
- **Purpose:** Ensure system settings are valid
- **Flow:** Check configuration → Validate values → Return result

**UC18: Load Dashboard Data**
- **Purpose:** Retrieve dashboard information
- **Flow:** Query relevant data → Format for display → Return data

**UC19: Validate Meter Reading**
- **Purpose:** Ensure meter reading is valid
- **Flow:** Check reading format → Validate range → Return result

**UC20: Validate Payment Proof**
- **Purpose:** Verify payment proof is valid
- **Flow:** Check proof format → Validate content → Return result

### Extend Use Cases (Optional Functions):

**UC21: Password Reset**
- **Trigger:** User clicks "Forgot Password"
- **Flow:** Enter email → Send reset link → User resets password

**UC22: Account Lockout**
- **Trigger:** Multiple failed login attempts
- **Flow:** Detect failed attempts → Lock account → Notify user

**UC23: Customer Registration**
- **Trigger:** New customer needs account
- **Flow:** Fill form → Submit → Admin approval → Account created

**UC24: Bill Dispute**
- **Trigger:** Customer disputes bill amount
- **Flow:** Submit dispute → Admin review → Bill correction

**UC25: Payment Refund**
- **Trigger:** Payment processing error
- **Flow:** Detect error → Process refund → Update records

**UC26: Export Report**
- **Trigger:** User wants to export report
- **Flow:** Select format → Generate file → Download

**UC27: Employee Termination**
- **Trigger:** Employee leaves company
- **Flow:** Update status → Revoke access → Archive records

**UC28: System Maintenance**
- **Trigger:** System needs update
- **Flow:** Schedule maintenance → Notify users → Apply updates

**UC29: Real-time Notifications**
- **Trigger:** System updates available
- **Flow:** Detect updates → Send notifications → Update display

**UC30: Meter Reading Correction**
- **Trigger:** Reading input error
- **Flow:** Detect error → Allow correction → Update records

**UC31: Payment Proof Rejection**
- **Trigger:** Invalid payment proof
- **Flow:** Review proof → Reject → Notify customer

This focused use case diagram shows only the core functionalities with their essential include and extend relationships, making it easier to understand the main system operations and their dependencies.

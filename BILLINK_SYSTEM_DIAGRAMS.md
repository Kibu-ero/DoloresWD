# Billink System - HIPO Diagrams and Use Case Diagrams

## 1. ADMIN ROLE - HIPO Diagram

```
Figure: Hierarchical Input-Process-Output Model (Admin Access)

                    Log in
                      |
                      ●
                      |
                Admin Dashboard
                      |
        ┌─────────────┼─────────────┐
        |             |             |
        ▼             ▼             ▼
   Manage         Manage         Manage
  Customers        Bills        Employees
        |             |             |
        ▼             ▼             ▼
   Customer      Bill Creation   Employee
 Registration    & Processing   Management
 & Approval      & Tracking    & Roles
        |             |             |
        ▼             ▼             ▼
   Customer      Payment         Employee
 Information    Processing      Information
 & Status       & Status       & Permissions
        |             |             |
        ▼             ▼             ▼
   Customer      Payment         Employee
 Database       Database        Database
 Updates        Updates         Updates
        |             |             |
        ▼             ▼             ▼
   Customer      Payment         Employee
 Notifications   Receipts       Notifications
 & Alerts       & Reports       & Alerts

        ┌─────────────┼─────────────┐
        |             |             |
        ▼             ▼             ▼
   Reports and    Settings      Log out
   Audit Logs         |
        |             ▼
        ▼        Billing Rates
   Collection         |
   Summary            ▼
        |        Notifications
        ▼             |
   Outstanding         ▼
   Balances      Notification
        |         Settings
        ▼             |
   Revenue            ▼
   Report        Settings
        |         Database
        ▼             |
   Monthly            ▼
   Statistics    Configuration
        |         Updates
        ▼             |
   Audit Logs          ▼
   & Tracking    System Settings
        |         & Preferences
        ▼             |
   Transaction         ▼
   Logs          Settings
        |         Notifications
        ▼             |
   Customer            ▼
   Ledger        Settings
        |         Database
        ▼             |
   Daily              ▼
   Collector      Settings
   Billing        Updates
   Sheet               |
        ▼             ▼
   Report         Settings
   Generation     Notifications
        |         & Alerts
        ▼
   Report
   Database
   Updates
        |
        ▼
   Report
   Notifications
   & Alerts
```

## 2. ENCODER ROLE - HIPO Diagram

```
Figure: Hierarchical Input-Process-Output Model (Encoder Access)

                    Log in
                      |
                      ●
                      |
                Encoder Dashboard
                      |
        ┌─────────────┼─────────────┐
        |             |             |
        ▼             ▼             ▼
   Input          Generate        Reports
  Readings          Bills
        |             |             |
        ▼             ▼             ▼
   Meter          Bill Creation   Collection
  Reading         & Processing    Summary
  Entry           & Tracking
        |             |             |
        ▼             ▼             ▼
   Customer      Payment         Outstanding
 Selection       Processing      Balances
 & Validation    & Status
        |             |             |
        ▼             ▼             ▼
   Previous      Payment         Monthly
   Reading       Database        Statistics
   Retrieval     Updates
        |             |             |
        ▼             ▼             ▼
   Current      Payment         Meter
   Reading      Receipts        Reading
   Entry        & Reports       Input
        |             |             |
        ▼             ▼             ▼
   Consumption   Payment         Report
   Calculation   Notifications   Generation
        |         & Alerts
        ▼             |
   Bill Amount         ▼
   Calculation   Payment
        |         Database
        ▼             |
   Due Date           ▼
   Setting       Payment
        |         Notifications
        ▼             |
   Bill Status         ▼
   Updates       Payment
        |         Alerts
        ▼
   Bill
   Database
   Updates
        |
        ▼
   Bill
   Notifications
   & Alerts
```

## 3. FINANCE OFFICER ROLE - HIPO Diagram

```
Figure: Hierarchical Input-Process-Output Model (Finance Officer Access)

                    Log in
                      |
                      ●
                      |
            Finance Manager Dashboard
                      |
        ┌─────────────┼─────────────┐
        |             |             |
        ▼             ▼             ▼
   Approve        View Reports    Export
  Payments                        Logs
        |             |             |
        ▼             ▼             ▼
   Payment         Collection     Audit
  Approval         Summary       Logs
  Process          & Analysis    Export
        |             |             |
        ▼             ▼             ▼
   Payment         Outstanding    Transaction
  Validation       Balances      Logs
  & Verification   Analysis      Export
        |             |             |
        ▼             ▼             ▼
   Payment         Revenue         Customer
  Database         Report         Ledger
  Updates          Analysis      Export
        |             |             |
        ▼             ▼             ▼
   Payment         Monthly         Daily
  Notifications    Statistics     Collector
  & Alerts         Analysis       Billing
        |             |           Sheet
        ▼             ▼             |
   Payment         Approval         ▼
  Status          Logs           Report
  Updates         Analysis       Generation
        |             |             |
        ▼             ▼             ▼
   Payment         Transaction    Report
  Receipts         Logs          Database
  & Reports       Analysis       Updates
        |             |             |
        ▼             ▼             ▼
   Payment         Customer        Report
  Database         Ledger         Notifications
  Updates          Analysis       & Alerts
        |             |             |
        ▼             ▼             ▼
   Payment         Customer        Report
  Notifications    Database       Database
  & Alerts         Updates        Updates
        |             |             |
        ▼             ▼             ▼
   Payment         Customer        Report
  Status           Notifications  Notifications
  Tracking         & Alerts       & Alerts
```

## 4. CASHIER ROLE - HIPO Diagram

```
Figure: Hierarchical Input-Process-Output Model (Cashier Access)

                    Log in
                      |
                      ●
                      |
               Cashier Dashboard
                      |
        ┌─────────────┼─────────────┐
        |             |             |
        ▼             ▼             ▼
   Receive         Payment        Generate
  Payments         Proofs         Reports
        |             |             |
        ▼             ▼             ▼
   Payment         Payment         Collection
  Processing       Proof          Summary
  & Validation     Review         & Analysis
        |             |             |
        ▼             ▼             ▼
   Payment         Payment         Outstanding
  Amount           Proof          Balances
  Validation       Approval       Analysis
        |             |             |
        ▼             ▼             ▼
   Payment         Payment         Revenue
  Method           Proof          Report
  Selection        Database       Analysis
        |             |             |
        ▼             ▼             ▼
   Payment         Payment         Monthly
  Receipt          Proof          Statistics
  Generation       Notifications  Analysis
        |             |             |
        ▼             ▼             ▼
   Payment         Payment         Transaction
  Database         Proof          Logs
  Updates          Status         Analysis
        |             |             |
        ▼             ▼             ▼
   Payment         Payment         Customer
  Notifications    Proof          Ledger
  & Alerts         Database       Analysis
        |             |             |
        ▼             ▼             ▼
   Payment         Payment         Daily
  Status           Proof          Collector
  Updates          Notifications  Billing
        |             |           Sheet
        ▼             ▼             |
   Payment         Payment         ▼
  Receipts         Proof          Report
  & Reports        Alerts         Generation
        |             |             |
        ▼             ▼             ▼
   Payment         Payment         Report
  Database         Proof          Database
  Updates          Status         Updates
        |             |             |
        ▼             ▼             ▼
   Payment         Payment         Report
  Notifications    Proof          Notifications
  & Alerts         Database       & Alerts
        |             |             |
        ▼             ▼             ▼
   Payment         Payment         Report
  Status           Proof          Database
  Tracking         Updates        Updates
```

## 5. CUSTOMER ROLE - HIPO Diagram

```
Figure: Hierarchical Input-Process-Output Model (Customer Access)

                    Log in
                      |
                      ●
                      |
              Customer Dashboard
                      |
        ┌─────────────┼─────────────┐
        |             |             |
        ▼             ▼             ▼
   View Bills      Submit        View
  & Statements    Payment        Reports
        |             |             |
        ▼             ▼             ▼
   Bill          Payment         Billing
  Display        Processing      History
  & Details      & Validation   & Analysis
        |             |             |
        ▼             ▼             ▼
   Bill          Payment         Payment
  Information    Method          History
  & Status       Selection      & Analysis
        |             |             |
        ▼             ▼             ▼
   Bill          Payment         Outstanding
  Notifications  Proof          Balance
  & Alerts       Upload         Analysis
        |             |             |
        ▼             ▼             ▼
   Bill          Payment         Proof of
  Database       Proof          Payment
  Updates        Validation     & Analysis
        |             |             |
        ▼             ▼             ▼
   Bill          Payment         Customer
  Status         Proof          Information
  Updates        Database       & Profile
        |             |             |
        ▼             ▼             ▼
   Bill          Payment         Customer
  Notifications  Proof          Database
  & Alerts       Notifications  Updates
        |             |             |
        ▼             ▼             ▼
   Bill          Payment         Customer
  Receipts       Proof          Notifications
  & Reports     Status          & Alerts
        |             |             |
        ▼             ▼             ▼
   Bill          Payment         Customer
  Database       Proof          Profile
  Updates        Database       Updates
        |             |             |
        ▼             ▼             ▼
   Bill          Payment         Customer
  Notifications  Proof          Notifications
  & Alerts       Notifications  & Alerts
        |             |             |
        ▼             ▼             ▼
   Bill          Payment         Customer
  Status         Proof          Profile
  Tracking       Status         Updates
```

## 6. USE CASE DIAGRAM

```
Figure: Billink System Use Case Diagram

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

CORE USE CASES:
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  UC1: User Authentication    UC2: Manage Customers    UC3: Process Bills      │
│  UC4: Process Payments       UC5: Generate Reports   UC6: Manage Employees   │
│  UC7: System Settings        UC8: Audit Trail        UC9: View Dashboard      │
│  UC10: Payment Proof Review   UC11: Meter Reading     UC12: Bill Approval      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

INCLUDE RELATIONSHIPS:
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  UC1 <<include>> UC13: Validate Credentials                                     │
│  UC2 <<include>> UC14: Validate Customer Data                                  │
│  UC3 <<include>> UC15: Calculate Bill Amount                                   │
│  UC4 <<include>> UC16: Validate Payment                                        │
│  UC5 <<include>> UC17: Generate Report Data                                    │
│  UC6 <<include>> UC18: Validate Employee Data                                  │
│  UC7 <<include>> UC19: Validate Settings                                       │
│  UC8 <<include>> UC20: Log Activity                                            │
│  UC9 <<include>> UC21: Load Dashboard Data                                     │
│  UC10 <<include>> UC22: Validate Payment Proof                                 │
│  UC11 <<include>> UC23: Validate Meter Reading                                  │
│  UC12 <<include>> UC24: Validate Bill Data                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

EXTEND RELATIONSHIPS:
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  UC1 <<extend>> UC25: Password Reset (when forgot password)                    │
│  UC1 <<extend>> UC26: Account Lockout (when multiple failed attempts)          │
│  UC2 <<extend>> UC27: Customer Registration (when new customer)                │
│  UC3 <<extend>> UC28: Bill Dispute (when customer disputes bill)               │
│  UC4 <<extend>> UC29: Payment Refund (when payment error)                       │
│  UC5 <<extend>> UC30: Export Report (when user wants to export)                 │
│  UC6 <<extend>> UC31: Employee Termination (when employee leaves)              │
│  UC7 <<extend>> UC32: System Maintenance (when system needs update)            │
│  UC8 <<extend>> UC33: Security Alert (when suspicious activity)                 │
│  UC9 <<extend>> UC34: Real-time Notifications (when updates available)         │
│  UC10 <<extend>> UC35: Payment Proof Rejection (when proof invalid)            │
│  UC11 <<extend>> UC36: Meter Reading Correction (when reading error)           │
│  UC12 <<extend>> UC37: Bill Revision (when bill needs correction)              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

ROLE-SPECIFIC USE CASES:
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  ADMIN:                                                                         │
│  - UC2: Manage Customers    - UC6: Manage Employees    - UC7: System Settings│
│  - UC5: Generate Reports    - UC8: Audit Trail         - UC9: View Dashboard  │
│  - UC10: Payment Proof Review                                                   │
│                                                                                 │
│  ENCODER:                                                                       │
│  - UC11: Meter Reading      - UC3: Process Bills       - UC5: Generate Reports  │
│  - UC9: View Dashboard                                                         │
│                                                                                 │
│  FINANCE OFFICER:                                                              │
│  - UC12: Bill Approval      - UC5: Generate Reports    - UC8: Audit Trail     │
│  - UC9: View Dashboard      - UC4: Process Payments                           │
│                                                                                 │
│  CASHIER:                                                                       │
│  - UC4: Process Payments    - UC10: Payment Proof Review  - UC5: Generate Reports│
│  - UC9: View Dashboard                                                         │
│                                                                                 │
│  CUSTOMER:                                                                      │
│  - UC9: View Dashboard      - UC5: Generate Reports    - UC4: Process Payments│
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 7. DETAILED USE CASE DESCRIPTIONS

### Core Use Cases:

**UC1: User Authentication**
- Primary Actor: All Users
- Goal: Authenticate user and grant access to system
- Preconditions: User has valid credentials
- Main Flow: User enters credentials → System validates → User gains access
- Postconditions: User is authenticated and redirected to appropriate dashboard

**UC2: Manage Customers**
- Primary Actor: Admin
- Goal: Manage customer accounts and information
- Preconditions: Admin is authenticated
- Main Flow: Admin selects customer management → Views customer list → Performs actions
- Postconditions: Customer data is updated in system

**UC3: Process Bills**
- Primary Actor: Encoder, Admin
- Goal: Create and process customer bills
- Preconditions: Meter readings are available
- Main Flow: Select customer → Enter readings → Calculate consumption → Generate bill
- Postconditions: Bill is created and stored in system

**UC4: Process Payments**
- Primary Actor: Cashier, Customer
- Goal: Process customer payments
- Preconditions: Valid bill exists
- Main Flow: Select bill → Enter payment details → Process payment → Update status
- Postconditions: Payment is recorded and bill status updated

**UC5: Generate Reports**
- Primary Actor: All Users (role-specific reports)
- Goal: Generate system reports
- Preconditions: User is authenticated
- Main Flow: Select report type → Set parameters → Generate report → Display results
- Postconditions: Report is generated and displayed

### Include Use Cases:

**UC13: Validate Credentials**
- Included by: UC1
- Purpose: Verify user login credentials
- Flow: Check username/password against database → Return validation result

**UC14: Validate Customer Data**
- Included by: UC2
- Purpose: Ensure customer information is valid
- Flow: Check required fields → Validate data format → Return validation result

**UC15: Calculate Bill Amount**
- Included by: UC3
- Purpose: Calculate bill amount based on consumption
- Flow: Get consumption → Apply rates → Calculate amount → Return total

### Extend Use Cases:

**UC25: Password Reset**
- Extends: UC1
- Trigger: User clicks "Forgot Password"
- Flow: Enter email → Send reset link → User resets password

**UC27: Customer Registration**
- Extends: UC2
- Trigger: New customer needs account
- Flow: Fill registration form → Submit → Admin approval → Account created

**UC28: Bill Dispute**
- Extends: UC3
- Trigger: Customer disputes bill amount
- Flow: Customer submits dispute → Admin reviews → Bill corrected if needed

This comprehensive documentation covers all user roles, their functionalities, and the relationships between different use cases in your Billink system.

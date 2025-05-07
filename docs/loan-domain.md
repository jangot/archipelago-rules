<style>
  /* use this to force non-dark mode even when IDE is using Dark Mode*/
  .mermaid {
    display: flex;                    /* turn on flex layout */
    justify-content: center;          /* center children horizontally */
    background-color: white !important;
    
  }
  .mermaid svg {
    width: auto !important;           /* don’t force it to fill the parent */
  }

</style>
### Loan Domain (WIP)


## Entities Relationship

**Relationship Explanation:**

- **Loan** connects to **ApplicationUser** twice: once as a **lender**, once as a **borrower**.
- **Loan** references a **Biller**.
- **Loan** references **PaymentAccount** (for both lender and borrower accounts).
- **Loan** has a collection of **LoanPayments**.
- **LoanInvitee** references **Loan**.
- **LoanPayment** references **Loan** and has a collection of **Transfers**.
- **Transfer** references **PaymentAccount** for its source/destination, and an (optional) **LoanPayment**.
- **PaymentAccount** belongs to **ApplicationUser** (the account owner).
- **Biller** references **ApplicationUser** as the creator (createdBy).

---

```mermaid
---
config:
  class:
    hideEmptyMembersBox: true
    theme: base
---
erDiagram
    IApplicationUser ||--o{ ILoan : "lender / borrower"
    ILoanInvitee }o--|| ILoan : "loan"
    ILoan ||--o| IBiller : "biller"
    IApplicationUser ||--o{ IBiller : "createdBy"
    ILoan ||--o{ ILoanPayment : "payments"
    ILoanPayment ||--o{ ITransfer : "transfers"
    ILoanPayment }o--|| ILoan : "loan"
    ILoan o|--|| IPaymentAccount : "lenderAccount"
    ILoan o|--|| IPaymentAccount : "borrowerAccount"
    ITransfer o|--|| IPaymentAccount : "sourceAccount"
    ITransfer o|--|| IPaymentAccount : "destinationAccount"
    IPaymentAccount }|--|| IApplicationUser : "owner"

    %% Entity attributes (optional)
    IApplicationUser {
      string id PK
      string firstName
      string email
    }
    ILoan {
      string id PK
      number amount
      string lenderId FK
      string borrowerId FK
      string billerId FK
      string lenderAccountId FK
      string borrowerAccountId FK
    }
    ILoanInvitee {
      string id PK
      string loanId FK
    }
    IBiller {
      string id PK
      string name
      string createdById FK
    }
    ILoanPayment {
      string id PK
      string loanId FK
    }
    ITransfer {
      string id PK
      string sourceAccountId FK
      string destinationAccountId FK
      string loanPaymentId FK
    }
    IPaymentAccount {
      string id PK
      string ownerId FK
    }
```

---



```mermaid
---
config:
  class:
    hideEmptyMembersBox: true
    theme: base
---
classDiagram
namespace Core {
    class IApplicationUser {
        id: string
        firstName: string
        lastName: string
        dateOfBirth: string
        email: string
        phoneNumber: string
        createdAt: Date
        deletedAt: Date
        registrationStatus: RegistrationStatus
        onboardStatus: string
        addressLine1: string
        addressLine2: string
        city: string
        state: string
        zipCode: string
        verificationType: VerificationType
        secret: string
        secretExpiresAt: Date
        verificationStatus: VerificationStatus
        verificationAttempts: number
        verificationLockedUntil: Date
    }

    class ILoan {
        id: string
        amount: number
        lenderId: string
        borrowerId: string
        type: LoanType
        state: LoanState
        closureType: LoanClosure
        relationship: string
        reason: string
        note: string
        attachment: string
        deeplink: string
        billerId: string
        billingAccountNumber: string
        paymentsCount: number
        paymentFrequency: LoanPaymentFrequency
        feeMode: LoanFeeMode
        feeAmount: number
        lenderAccountId: string
        borrowerAccountId: string
        createdAt: Date
        updatedAt: Date
        acceptedAt: Date
    }

    class ILoanInvitee {
        id: string
        loanId: string
        type: LoanInviteeType
        firstName: string
        lastName: string
        email: string
        phone: string
    }

    class IBiller {
        id: string
        name: string
        type: BillerType
        createdAt: Date
        updatedAt: Date
        createdById: string
    }

    class ILoanPayment {
        id: string
        amount: number
        loanId: string
        paymentIndex: number
        type: LoanPaymentType
        stage: number
        state: LoanPaymentState
        createdAt: Date
        updatedAt: Date
        executionDate: Date
        originalExecutionDate: Date
    }

    class ITransfer {
        id: string
        amount: number
        state: TransferState
        errorData: string
        createdAt: Date
        updatedAt: Date
        sourceAccountId: string
        destinationAccountId: string
        sourceAccountType: string
        destinationAccountType: string
        loanPaymentId: string
    }

    class IPaymentAccount {
        id: string
        ownerId: string
        type: PaymentAccountType
        provider: PaymentAccountProvider
    }
    }

    %% Relationships

    %% ILoan <-> IApplicationUser (lender / borrower)
    ILoan "1" --> "0..1" IApplicationUser : lender
    ILoan "1" --> "0..1" IApplicationUser : borrower

    %% ILoan <-> ILoanInvitee (invitee)
    ILoan "1" --> "1" ILoanInvitee : invitee

    %% ILoan <-> IBiller (biller)
    ILoan "1" --> "0..1" IBiller : biller

    %% ILoan <-> IPaymentAccount (lender/borrower account)
    ILoan "1" --> "0..1" IPaymentAccount : lenderAccount
    ILoan "1" --> "0..1" IPaymentAccount : borrowerAccount

    %% ILoan <-> ILoanPayment (payments)
    ILoan "1" --> "0..*" ILoanPayment : payments

    %% IBiller <-> IApplicationUser (createdBy)
    IBiller "1" --> "0..1" IApplicationUser : createdBy

    %% ILoanInvitee <-> ILoan (loan)
    ILoanInvitee "1" --> "1" ILoan : loan

    %% ILoanPayment <-> ILoan (loan)
    ILoanPayment "1" --> "1" ILoan : loan

    %% ILoanPayment <-> ITransfer (transfers)
    ILoanPayment "1" --> "0..*" ITransfer : transfers

    %% ITransfer <-> ILoanPayment (loanPayment)
    ITransfer "1" --> "0..1" ILoanPayment : loanPayment

    %% ITransfer <-> IPaymentAccount (source/destination)
    ITransfer "1" --> "0..1" IPaymentAccount : sourceAccount
    ITransfer "1" --> "0..1" IPaymentAccount : destinationAccount

    %% IPaymentAccount <-> IApplicationUser (owner)
    IPaymentAccount "1" --> "1" IApplicationUser : owner  
```

## Loan States
### General information
  - **Created**: Loan initial information provided (amount, plan, type), optional - Biller info
  - **Requested**: (Borrower side) Borrower provided payment method information, waiting to set target User
  - **Offered**: (Lender side) Lender provided payment method information, waiting to set target User
  - **BorrowerAssigned**: Loan Offer has Borrower User assigned
  - **LenderAssigned**: Loan Request has Lender User assigned
  - **Accepted**: Target User Accepted the Loan
  - **Funding**: Funds transfer from Lender to Zirtue started
  - **FundingPaused**: Funds transfer from Lender to Zirtue paused
  - **Funded**: Funds transfer from Lender to Zirtue completed
  - **Disbursing**: Funds transfer from Zirtue to Borrower \ Biller started
  - **DisbursingPaused**: Funds transfer from Zirtue to Borrower \ Biller paused
  - **Disbursed**: Funds transfer from Zirtue to Borrower \ Biller completed
  - **Repaying**: Borrower started to repay the loan
  - **RepaymentPaused**: Borrower paused the repayment
  - **Repaid**: Borrower repaid Loan
  - **Closed**: Loan is closed

  ```mermaid
  flowchart TD
    Created
    Requested
    Offered
    BorrowerAssigned
    LenderAssigned
    Accepted
    Funding
    FundingPaused
    Funded
    Disbursing
    DisbursingPaused
    Disbursed
    Repaying
    RepaymentPaused
    Repaid
    Closed

    Created -- "Borrower submits request" --> Requested
    Created -- "Lender submits offer" --> Offered

    Requested -- "Set Lender User" --> LenderAssigned
    Offered -- "Set Borrower User" --> BorrowerAssigned

    LenderAssigned -- "Target User accepts" --> Accepted
    BorrowerAssigned -- "Target User accepts" --> Accepted

    Accepted --> Funding
    Funding -- "Complete" --> Funded
    Funding <-- "Pause / Resume" --> FundingPaused

    

    Funded --> Disbursing
    Disbursing <-- "Pause / Resume" --> DisbursingPaused
    Disbursing -- "Complete" --> Disbursed

    Disbursed --> Repaying
    Repaying <-- "Pause / Resume" --> RepaymentPaused
    Repaying -- "Repayment complete" --> Repaid

    Repaid --> Closed
  ```

---

  ### State change conditions
  TBD

  ---

  ### Loan State change on Error
  TBD

  ---
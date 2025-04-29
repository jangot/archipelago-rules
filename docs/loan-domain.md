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
  body {
    background: white;
    font-color: black;
  }
  h3 {
    color: #2a2a2a;
    margin-top: 1.5em;
    margin-bottom: 1.5em;
    text-align: center;
}
</style>
### Loan Domain (WIP)

```mermaid
---
config:
  title: Loan Domain
  class:
    hideEmptyMembersBox: true
    theme: base
---
classDiagram
namespace Core {
  %% enumeration types represented as classes just for Design purposes
  class LoanType {
    <<enumeration>>
    Personal
    DirectBillPay
    RepaymentRequest
  }

  class LoanState {
    <<enumeration>>
    Created
    Requested
    Offered
    Accepted
    Funding
    FundingPaused
    Funded
    Disbursing
    DisburisngPaused
    Disbursed
    Repaying
    RepaymentPaused
    Repaid
    Closed
  }

  class LoanClosure {
    <<enumeration>>
    PaidOut
    Declined
    Deactivated
    Forgiven
    Cancelled
  }

  class LoanPaymentFrequency {
    <<enumeration>>
    Monthly
    Semimonthly
    Weekly
  }

  class LoanFeeMode {
    <<enumeration>>
    Standard
  }

  class BillerType {
    <<enumeration>>
    Network
    Custom
    Personal
  }

  class Loan {
    <<Entity>>
    +uuid id
    +decimal amount

    +uuid lenderId
    +uuid borrowerId
    +LoanType type
    +boolean isLendLoan
    +LoanState state
    +LoanClosure closureType?
    +string relationship?
    +string reason?
    +string note?
    +string attachment?
    +string deeplink?
    +string targetUserUri?
    +string targetUserFirstName?
    +string targetUserLastName?

    +uuid billerId?
    +string billingAccountNumber?

    +int paymentsCount
    +LoanPaymentFrequency paymentFrequency
    +LoanFeeMode feeMode?
    +decimal feeAmount?
    +decimal paymentAmount?

    +int currentPaymentIndex?
    +Date nextPaymentDate?
    
    +uuid lenderAccountId?
    +uuid borrowerAccountId?
    +Date createdAt
    +Date updatedAt?
    +Date acceptedAt?
  }

  class Biller {
    <<Entity>>
    +uuid id
    +string name
    +BillerType type
    +Date createdAt
    +Date updatedAt?
  }
}
  %% Associations and dependencies
  Loan "1" --> "0..1" Biller : association
  LoanType "1" <.. "1" Loan : dependency
  LoanState "1" <.. "1" Loan : dependency
  LoanClosure "1" <.. "1" Loan : dependency
  LoanPaymentFrequency "1" <.. "1" Loan : dependency
  LoanFeeMode "1" <.. "1" Loan : dependency
  BillerType "1" <.. "1" Biller : dependency
  ```

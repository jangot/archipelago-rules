## P2P (Personal Loan) and DBP (Direct Bill Pay)

### Basic Flow
```mermaid
flowchart LR
    Loan[Loan Accepted] --> Funding
    Loan --> Fee
    Funding --> Disbursement
    Disbursement --> Repayment
```

---

### Zero Fee Flow
```mermaid
flowchart LR
    Loan[Loan Accepted] --> Funding
    Loan -.0 fee.-> Fee(Fee)
    Funding --> Disbursement
    Disbursement --> Repayment
```

---

### Same Payment Provider Flow
```mermaid
flowchart LR
    Loan[Loan Accepted] -.bypass.-> Funding(Funding)
    Loan --> Fee
    Funding -.bypass.-> Disbursement
    Disbursement --> Repayment
```

---

### Same Payment Provider and Zero Fee Flow
```mermaid
flowchart LR
    Loan[Loan Accepted] -.bypass.-> Funding(Funding)
    Loan -.0 fee.-> Fee(Fee)
    Funding -.bypass.-> Disbursement
    Disbursement --> Repayment
```

## RR (Repayment Requset)
Not a priority right now, but allows to check general functionality by supporting flow preiosuly requested (in Zirtue Legacy).
The general difference - there is no `Funding` and `Disbursement` stages at all - Users want to setup only `Repayment` phase.

### Fee Paid by Lender Flow
```mermaid
flowchart LR
    Loan[Loan Accepted] -.bypass.-> Funding(Funding)
    Loan --> Fee
    Funding -.bypass.-> Disbursement(Disbursement)    
    Disbursement -.bypass.-> Repayment
```
---

### Fee Paid by Borrower Flow
```mermaid
flowchart LR
    Loan[Loan Accepted] -.bypass.-> Funding(Funding)
    
    Funding -.bypass.-> Disbursement(Disbursement)    
    Disbursement -.bypass.-> Repayment
    Fee --> Repayment
```

---
---

# Loan Payments Router

## Overview
Idea of `Loan Payments Router` - is to have a logic that allows to build all transfers chain required to process `A -> B` payment. 

In some cases it is possible that single transfer will not be enough to complete the **Payment**. 
For example: **Lender** has **Checkbook ACH** account while **Borrower** has **Fiserv Debit Card** account. To process `Lender -> Borrower` **Payment** it should be done in two `Payment Steps`:
1. `Lender -> Zirtue ACH`
2. *(Zirtue ACH reports that funds recieved)*
3. `Zirtue Debit -> Borrower`

Thus **Loan Payments Router** should take as INPUT:
- source Payment Account
- target Payment Account
- Loan properties

and returns as OUTPUT:
- list of **Route Steps** 

## Route Types and Entities Structure
To allow **Loan Payment Router** support certain level of flexibility (cross-provider transfers, multiple internal accounts for the same **Payment Provider**) following variables participation in **Payment Routing**:
- Loan Configuration:
  - `loanType`: 'dbp' | 'p2p' | 'rr'
  - `stage`: 'funding' | 'disbursement' | 'fee' | 'repayment' | 'refund'
- Payment Account Configuration (twice as there is *source* and *target* of the payment):
  - `paymentAccountType`: 'debit_card' | 'bank_account' | 'rpps'
  - `ownership`: 'personal' | 'internal' | 'external'
  - `provider`: 'checkbook' | 'fiserv' | 'tabapay'

**Route Key** - is unique combination of Loan Configuration and two Payment Account Configurations (*from* and *to*).

```typescript
interface IRouteStep {

    id: string; // uuid
    routeId: string; // FK to Route

    order: number; // Order of a Route element in a chain
    fromId: string | null; // Id of the Payment Account if it is pre-defined (e.g. Zirtue Internal For Checkbook ACH Funding)    
    toId: string | null; // Id of the Payment Account if it is pre-defined (e.g. Zirtue Internal For Checkbook ACH Funding)
}

interface IRoute {
    id: string; // uuid

    //TODO: Cover by indexes? Composite indexes (from & to) as all 6 fields expected to persist?
    // #region Route Key - unique combination of the fields
    fromAccount: PaymentAccountType; // 'debit_card' | 'bank_account' | 'rpps';
    fromOwnership: PaymentAccountOwnershipType; // 'personal' | 'internal' | 'external';
    fromProvider: PaymentAccountProvider; // 'checkbook' | 'fiserv' | 'tabapay';

    toAccount: PaymentAccountType; // 'debit_card' | 'bank_account' | 'rpps';    
    toOwnership: PaymentAccountOwnershipType; // 'personal' | 'internal' | 'external';    
    toProvider: PaymentAccountProvider; // 'checkbook' | 'fiserv' | 'tabapay';

    //TODO: Use GIN Index for these two?
    loanStagesSupported: LoanStage[]; // 'funding' | 'disbursement' | 'fee' | 'repayment' | 'refund'
    loanTypesSupported: LoanType[]; // 'dbp' | 'p2p' | 'rr'
    // #endregion
    steps: IRouteStep[];
}
```

The idea of **Payment Route** requires `ALL` of following fields being provided for search:
- **fromAccount**
- **fromOwnership**
- **fromProvider**
- **toAccount**
- **toOwnership**
- **toProvider**

because as input before we have two **Payment Accounts** and we need to find a route that will allow to transfer funds from one to another.

Basically saying **Route** is an ordered array of **Route Steps** each of which have up to two **PaymentAccount** referencies:
- If in **Route Step** both `fromId` and `toId` are `null` - it means that this **Route Step** must be the only step in the route, both **Payment Account**s came from **Loan**
- If either `fromId` or `toId` is `null` - it means that for this route part **Payment Account** is not pre-defined and can be `lenderAccountId`, `borrowerAccountId` or `Biller's PaymentAccountId` - depending on **Loan** configuration and intended **Loan Stage**
- If `fromId` or `toId` is not `null` - it means that for this route part **Payment Account** if pre-defined and fixed

## Building a Loan Payment Route
If we attempt to have all variations of **Route Keys** then we will have *thousands* of them, which is complete overkill.
To solve this we could have pre-defined static collection of **Routes** with **Route Keys** that are supported per **Loan Type** and **Loan Stage**. **Payment Routes** not being mentioned in collection appears to be unsupported.

Thus we will have pre-defined Tables for **Routes** and **Route Steps** that will be used to build **Payment Route** for the **Loan Payment**.

### Supported Loan Payment Routes
- Route must start from null and end with null
- Route must have at least one step
- Tabapay may be used only for `Disbursement` stage and for `external` accounts
- `Internal` are accounts that Zirtue have for providers

> TODO: `(?)`add more specifics

---

### Loan Payment Step

As **Payment Route** might require to be performed it in few steps - we add **Loan Payment Step** collection into **Loan Payment**
```typescript
interface ILoanPaymentStep {
    id: string; // uuid
    loanPaymentId: string; // FK to ILoanPayment

    /**
     * Integer order number of the step.
     * Starts with 0.
    */
    order: number;

    amount: number; // Payment Step transfer amount. Basically the same as Loan Payment amount, but keep mentioned again
    sourcePaymentAccountId: string; // FK to Payment Account from which transfer will be performed
    targetPaymentAccountId: string; // FK to Payment Account to which transfer will be performed

    /**
   * Collection of Transfers that are part of this Loan Payment Step.
   * Ideally should contain only one Transfer. 
   * But if Transfer failed and re-attempt happened - new Transfer will be also referenced to the same Loan Payment Step.
   */
    transfers: ITransfer[] | null;

    state: PaymentStepState; // 'created', 'confirmed', 'pending', 'completed', 'failed'

    awaitStepState: PaymentStepState; // 'none' | 'confirmation' | 'completion'. Default: 'completion'
    awaitStepId: string | null; // reference to previous Payment Step. If `null` order-1 will be taken

}

interface ILoanPayment {
    ...
    steps: ILoanPaymentStep[];
    step: number; // <-- Removed
    paymentNumber: number | null; // <-- Removed
    transfers: ITransfer[] | null; // <-- Removed

    /** Shows for what Loan lifecycle Payment is assigned
   * `funding` - Lender transfers funds to Zirtue
   * `disbursement` - Zirtue transfers funds to Biller
   * `fee` - Lender pays Zirtue fee
   * `repayment` - Borrower repays Lender
   * `refund` - Performing refund for the payment
   */
    type: LoanPaymentType;
}
```

**Loan** moves further in it's payments stages (`Funding`, `Disbursement`, `Fee`, `Repayment`) ONLY if:
- Previous stage successfully completed
OR
- Previous stage was skipped

This means that next stage won't be reached until previous **Loan Payment** will have all **Loan Payment Steps** completed. 
To not have everything pre-generated we agreed that we will not schedule all payments in advance. But in terms of **Loan Payment Steps** - we might have them pre-generated for incoming **Loan Payment**. It means that if **Loan** goes to **Funding** stage - we will create **Loan Payment** with `type: 'funding'` and also generate required **Loan Payments Steps** for this to fixate the **Payment Route** and do not implement thousands of possible routes.

## Payment Routing Process
```mermaid
flowchart TD
    subgraph "Route Definition"
        Route[Route]
        RouteStep[Route Step]
        Route -->|contains| RouteStep
    end

    subgraph "Payment Execution"
        Loan[Loan]
        LoanPayment[Loan Payment]
        LoanPaymentStep[Loan Payment Step]
        Transfer[Transfer]
        
        Loan -->|produces| LoanPayment
        LoanPayment -->|contains| LoanPaymentStep
        LoanPaymentStep -->|produces| Transfer
    end

    subgraph "Payment Routing Process"
        LoanService[Loan Service]
        PaymentRouter[Payment Router]
        LoanPaymentFactory[Loan Payment Factory]
        LoanPaymentStepManager[Loan Payment Step Manager]
        TransferExecutionService[Transfer Execution Service]
        
        LoanService -->|1 calls| PaymentRouter
        PaymentRouter -->|2 returns route| LoanService
        LoanService -->|3 calls| LoanPaymentFactory
        LoanPaymentFactory -->|4 creates| LoanPayment
        LoanPaymentFactory -->|5 calls| LoanPaymentStepManager
        LoanPaymentStepManager -->|6 creates steps based on route| LoanPaymentStep
        LoanPaymentStepManager -->|7 calls| TransferExecutionService
        TransferExecutionService -->|8 executes| Transfer
    end
    
    Transfer -->|9 state change| LoanPaymentStep
    LoanPaymentStep -->|10 state change| LoanPayment
    LoanPayment -->|11 state change| Loan
    
    Route -->|defines possible paths| PaymentRouter
    RouteStep -->|defines steps| PaymentRouter
    PaymentRouter -->|determines| LoanPaymentStep
```


# Flow of funds

## Funding

### `Biller is Personal`
```mermaid
---
config:
  title: Flow of Funds
  class:
    theme: base
---

stateDiagram-v2
  direction LR
  classDef zpre fill:#00f
  classDef zrev fill:navy
  classDef lender fill:red

  zpre : <i class="fas fa-piggy-bank"></i> Zirtue Prefunded Account
  zrev : <i class="fas fa-wallet"></i> Zirtue Revenue Account
  Lender : <i class="fas fa-money-bill"></i> Lender
  Lender:::lender --> zpre:::zpre
  zpre --> zrev:::zrev
```

&nbsp;
### `Biller is Biller Network (RPPS)`
```mermaid
---
config:
  title: Flow of Funds
  class:
    theme: base
---

stateDiagram-v2
  direction LR
  classDef zpre fill:#00f
  classDef zrev fill:navy
  classDef lender fill:red

  zpre : <i class="fas fa-piggy-bank"></i> Zirtue Prefunded Account
  zrev : <i class="fas fa-wallet"></i> Zirtue Revenue Account
  Lender : <i class="fas fa-money-bill"></i> Lender
  Lender:::lender --> zpre:::zpre
  zpre --> zrev:::zrev
```

&nbsp;
### `Biller is Direct (Lender -> Borrower)`
```mermaid
---
config:
  title: Flow of Funds
  class:
    theme: base
---

stateDiagram-v2
  direction LR
  classDef zpre fill:#00f
  classDef zrev fill:navy
  classDef lender fill:red

  zpre : <i class="fas fa-piggy-bank"></i> Zirtue Prefunded Account
  zrev : <i class="fas fa-wallet"></i> Zirtue Revenue Account
  Lender : <i class="fas fa-money-bill"></i> Lender
  Lender:::lender --> zpre:::zpre
  zpre --> zrev:::zrev
```
&nbsp;
&nbsp;
## Disbursement
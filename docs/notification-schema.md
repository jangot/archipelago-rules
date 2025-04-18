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
### Notification Schema

```mermaid
---
config:
  title: Notifications Domain
  theme: default
  class:
    hideEmptyMembersBox: true
    padding: 8
---
classDiagram
  namespace notifications {
    class NotificationType {
      <<enumeration>>
      Email,
      SMS,
      Amplitude
    }

    class NotificationDefinition {
      <<Entity>>
      +uuid id
      +string name
      +Date createdAt
      +Date updatedAt
    }
    
    class NotificationDefinitionItem {
      <<Entity>>
      +uuid id
      +uuid notificationDefinitionId
      +number orderIndex
      +NotificationType notificationType
      +string template?
      +string header?
      +string body?
      +string target?
      +string metadata?
      +Date createdAt
      +Date updatedAt
    }

    
}

NotificationType "1" <.. "1" NotificationDefinitionItem: dependency
NotificationDefinitionItem "0..*" <-- "1" NotificationDefinition : association
```

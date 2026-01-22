
```mermaid
flowchart LR
A([Start]) --> B[Scan QR]
B --> C{Registered?}
C -- No --> D[Show: Not registered yet\nContact Initial Seal Owner\nRegister initial seals]
C -- Yes --> E{Action?}
E -- Planned access --> F[Fill Request form\n(select seals + reason + details)]
E -- Unplanned issue --> G[Fill Report form\n(broken/tampered/unauthorized)]
F --> H[Submit]
G --> H[Submit]
H --> I[Auto: Update log + Email EM/CxA/Processor]
I --> J{Time-critical?}
J -- Yes --> K[Escalate: Phone / WhatsApp]
J -- No --> L([End])
```

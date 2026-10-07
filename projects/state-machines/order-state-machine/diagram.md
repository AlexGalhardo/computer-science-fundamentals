<!-- Generated from machine.json. Do not edit by hand: run the diagram command of the README. -->

# Order state machine

```mermaid
stateDiagram-v2
    [*] --> created
    created --> paid: pay
    created --> cancelled: cancel
    paid --> shipped: ship
    paid --> refunded: refund
    shipped --> delivered: deliver
    delivered --> refunded: refund
    cancelled --> [*]
    refunded --> [*]
```

| state | pay | ship | deliver | cancel | refund |
| --- | --- | --- | --- | --- | --- |
| created | paid | - | - | cancelled | - |
| paid | - | shipped | - | - | refunded |
| shipped | - | - | delivered | - | - |
| delivered | - | - | - | - | refunded |
| cancelled | - | - | - | - | - |
| refunded | - | - | - | - | - |

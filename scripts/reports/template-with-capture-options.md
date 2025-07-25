# Capture Rate Visualization Options

## Option 1: Subtle Background Line
Add a thin horizontal line showing average capture rate across the chart:

```
█████████████████████████████████████████
█                     ----average----   █  ← Thin dotted line at avg capture rate
█         ████                          █
█       ████████                        █
█     ██████████████                    █
█   ████████████████████                █
█ ██████████████████████████            █
█████████████████████████████████████████
```

## Option 2: Context Box Above Chart
Small info box that doesn't interfere with the bars:

```
┌─────────────────────────────────────┐
│ Daily Avg: 68.5% capture rate       │
└─────────────────────────────────────┘
█████████████████████████████████████████
█         ████                          █
█       ████████                        █
█     ██████████████                    █
█   ████████████████████                █
█ ██████████████████████████            █
█████████████████████████████████████████
```

## Option 3: Subtle Gradient Background
Use a very light gradient to indicate capture rate zones:

```
█████████████████████████████████████████
█░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░█ ← Very light bg: >70% capture
█▒▒▒▒▒▒▒▒████▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒█ ← Light bg: 50-70% capture
█▓▓▓▓▓▓████████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓█ ← Medium bg: <50% capture
█     ██████████████                    █
█   ████████████████████                █
█ ██████████████████████████            █
█████████████████████████████████████████
```

## Option 4: Small Icons/Indicators
Add tiny indicators only at key hours:

```
█████████████████████████████████████████
█         ★                             █  ← ★ = High capture rate hour
█         ████                          █
█       ████████                        █
█     ██████████████          •         █  ← • = Low capture rate hour
█   ████████████████████                █
█ ██████████████████████████            █
█████████████████████████████████████████
```

## Option 5: Chart Legend (Recommended)
Keep chart clean, add context in legend:

```
█████████████████████████████████████████
█         ████                          █
█       ████████                        █
█     ██████████████                    █
█   ████████████████████                █
█ ██████████████████████████            █
█████████████████████████████████████████
■ Visitors  ◆ Avg capture: 68.5% (1,818 passersby)
```
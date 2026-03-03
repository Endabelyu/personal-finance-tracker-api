# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - img [ref=e7]
    - generic [ref=e11]: "404"
    - heading "Page Not Found" [level=1] [ref=e12]
    - paragraph [ref=e13]: Oops! The page you're looking for seems to have wandered off into the digital wilderness.
    - paragraph [ref=e14]: It might have been moved, deleted, or you may have mistyped the URL. Let's get you back on track!
    - generic [ref=e15]:
      - link "Go to Dashboard" [ref=e16] [cursor=pointer]:
        - /url: /
        - img [ref=e17]
        - text: Go to Dashboard
      - link "View Transactions" [ref=e20] [cursor=pointer]:
        - /url: /transactions
        - img [ref=e21]
        - text: View Transactions
    - button "Go back to previous page" [ref=e24]:
      - img [ref=e25]
      - generic [ref=e27]: Go back to previous page
  - generic [ref=e28]:
    - link "Dashboard" [ref=e29] [cursor=pointer]:
      - /url: /
      - img [ref=e31]
      - text: Dashboard
    - link "Transactions" [ref=e34] [cursor=pointer]:
      - /url: /transactions
      - img [ref=e36]
      - text: Transactions
    - link "Budget" [ref=e39] [cursor=pointer]:
      - /url: /budget
      - img [ref=e41]
      - text: Budget
```
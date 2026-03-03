# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - heading "Sign in" [level=1] [ref=e5]
    - paragraph [ref=e6]:
      - text: Don't have an account?
      - link "Sign up" [ref=e7] [cursor=pointer]:
        - /url: /auth/register
  - generic [ref=e9]:
    - img [ref=e10]
    - paragraph [ref=e13]: Invalid email or password
  - generic [ref=e14]:
    - generic [ref=e15]:
      - generic [ref=e16]:
        - generic [ref=e17]: Email address
        - generic [ref=e18]:
          - img [ref=e19]
          - textbox "Email address" [ref=e23]:
            - /placeholder: you@example.com
            - text: wrong@example.com
      - generic [ref=e24]:
        - generic [ref=e25]: Password
        - generic [ref=e26]:
          - img [ref=e27]
          - textbox "Password" [ref=e31]:
            - /placeholder: ••••••••
            - text: badpassword
          - button [ref=e32]:
            - img [ref=e33]
    - generic [ref=e36]:
      - generic [ref=e37]:
        - checkbox "Remember me" [ref=e38]
        - generic [ref=e39]: Remember me
      - link "Forgot your password?" [ref=e41] [cursor=pointer]:
        - /url: /auth/forgot-password
    - button "Sign in" [ref=e42]
```